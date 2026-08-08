-- get_anagram_word_info_v1 resolves a verb by its normalized lemma. The table
-- previously had only its entry-key primary key, forcing a scan per card.

begin;

create index if not exists idx_verb_entries_norm_lemma
  on public.verb_entries (norm_lemma);

commit;
