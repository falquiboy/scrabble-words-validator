-- Returns the compact card data used by the extended anagram view.
-- Keep the dictionary offline index focused on word generation; definitions and
-- grammatical metadata remain a small, batched online enrichment.

begin;

create or replace function public.get_anagram_word_info_v1(p_words text[])
returns table (
  norm_word text,
  lemma text,
  part_of_speech text,
  word_type text,
  short_definition text,
  is_scrabble_valid boolean,
  is_verb boolean,
  entry_key numeric,
  norm_lemma text,
  prime_sense text,
  prime_type text,
  regularity text,
  participle_masculine text,
  has_participle_masculine boolean,
  participle_masculine_plural text,
  has_participle_masculine_plural boolean,
  participle_feminine text,
  has_participle_feminine boolean,
  prnl_end text,
  voseo_imperative_plural text,
  has_voseo_imperative boolean,
  is_prnl_end boolean
)
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, extensions, pg_temp
as $function$
begin
  if coalesce(cardinality(p_words), 0) > 100 then
    raise exception 'At most 100 words are allowed per request'
      using errcode = '22023';
  end if;

  return query
  with input_words as (
    select distinct upper(btrim(input_word)) as normalized_word
    from unnest(coalesce(p_words, array[]::text[])) as value(input_word)
    where btrim(input_word) <> ''
  ),
  lexicon_rows as (
    select
      input_words.normalized_word,
      lexicon.key_lemma,
      lexicon.key_feminine,
      lexicon.key_plural,
      lexicon.key_conj,
      lexicon.key_variant,
      case
        when nullif(lexicon.key_conj, '') is not null then 'conjugación'
        when nullif(lexicon.key_feminine, '') is not null then 'femenino'
        when nullif(lexicon.key_plural, '') is not null then 'plural'
        when nullif(lexicon.key_variant, '') is not null then 'variante'
        when nullif(lexicon.key_lemma, '') is not null then 'base'
        else null
      end as relation_type,
      coalesce(
        nullif(lexicon.key_conj, ''),
        nullif(lexicon.key_feminine, ''),
        nullif(lexicon.key_plural, ''),
        nullif(lexicon.key_variant, ''),
        nullif(lexicon.key_lemma, '')
      ) as selected_keys
    from input_words
    left join lateral (
      select
        lk.key_lemma,
        lk.key_feminine,
        lk.key_plural,
        lk.key_conj,
        lk.key_variant
      from public.lexicon_keys lk
      where lk.norm_word = input_words.normalized_word
      limit 1
    ) lexicon on true
  ),
  resolved_keys as (
    select lexicon_rows.*, selected_key.entry_key
    from lexicon_rows
    left join lateral (
      select min(btrim(key_part)::numeric) as entry_key
      from unnest(string_to_array(lexicon_rows.selected_keys, ',')) as value(key_part)
      where btrim(key_part) ~ '^[0-9]+(\.[0-9]+)?$'
    ) selected_key on true
  ),
  cards as (
    select
      resolved_keys.normalized_word,
      resolved_keys.relation_type,
      resolved_keys.entry_key as resolved_entry_key,
      dictionary_entry.lemma as dictionary_lemma,
      first_sense.definition as sense_definition,
      first_sense.part_of_speech_1 as sense_part_of_speech,
      verb.*
    from resolved_keys
    left join public.dictionary_entries dictionary_entry
      on dictionary_entry.key = resolved_keys.entry_key
    left join lateral (
      select ds.definition, ds.part_of_speech_1
      from public.dictionary_senses ds
      where ds.entry_key = resolved_keys.entry_key
      order by ds.sense_number nulls last, ds.id
      limit 1
    ) first_sense on true
    left join lateral (
      select
        ve.entry_key,
        ve.norm_lemma,
        ve.prime_sense,
        ve.prime_type,
        ve.regularity,
        ve.participle_masculine,
        ve.has_participle_masculine,
        ve.participle_masculine_plural,
        ve.has_participle_masculine_plural,
        ve.participle_feminine,
        ve.has_participle_feminine,
        ve.prnl_end,
        ve.voseo_imperative_plural,
        ve.has_voseo_imperative,
        ve.is_prnl_end
      from public.verb_entries ve
      cross join lateral (
        select regexp_replace(
          lower(coalesce(dictionary_entry.lemma, resolved_keys.normalized_word)),
          '\d+$',
          ''
        ) as normalized_lemma
      ) lemma_value
      where ve.norm_lemma = lemma_value.normalized_lemma
         or (
           lemma_value.normalized_lemma like '%se'
           and ve.norm_lemma = left(lemma_value.normalized_lemma, length(lemma_value.normalized_lemma) - 2)
         )
      order by case
        when lemma_value.normalized_lemma like '%se'
          and ve.norm_lemma = left(lemma_value.normalized_lemma, length(lemma_value.normalized_lemma) - 2)
          then 0
        when ve.norm_lemma = lemma_value.normalized_lemma then 1
        else 2
      end
      limit 1
    ) verb on true
  )
  select
    cards.normalized_word,
    coalesce(cards.dictionary_lemma, cards.norm_lemma, lower(cards.normalized_word)),
    case when cards.entry_key is not null then 'verbo' else cards.sense_part_of_speech end,
    coalesce(cards.relation_type, 'base'),
    case when cards.entry_key is not null then cards.prime_sense else cards.sense_definition end,
    cards.resolved_entry_key is not null,
    cards.entry_key is not null,
    cards.entry_key,
    cards.norm_lemma,
    cards.prime_sense,
    cards.prime_type,
    cards.regularity,
    cards.participle_masculine,
    cards.has_participle_masculine,
    cards.participle_masculine_plural,
    cards.has_participle_masculine_plural,
    cards.participle_feminine,
    cards.has_participle_feminine,
    cards.prnl_end,
    cards.voseo_imperative_plural,
    cards.has_voseo_imperative,
    cards.is_prnl_end
  from cards;
end;
$function$;

revoke all on function public.get_anagram_word_info_v1(text[]) from public, anon, authenticated, service_role;
grant execute on function public.get_anagram_word_info_v1(text[]) to anon, authenticated;

commit;
