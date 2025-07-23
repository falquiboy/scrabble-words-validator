import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase connection
const supabaseUrl = 'https://ykbtguxnrlprxlxowklx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYnRndXhucmxwcnhseG93a2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEwNzg1OTcsImV4cCI6MjAzNjY1NDU5N30.0-xQhGKGKBKhG8kUz1Wl7MxNNK6cQpCkRxJQzGiw0IM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerbMigration() {
    console.log('🔄 Starting verb tables migration...\n');

    try {
        // Step 1: Check current structure of verb_entries
        console.log('📊 Checking current verb_entries structure...');
        const { data: currentData, error: currentError } = await supabase
            .from('verb_entries')
            .select('*')
            .limit(1);
        
        if (currentError) {
            console.error('❌ Error checking verb_entries:', currentError);
            return;
        }
        
        if (currentData && currentData.length > 0) {
            console.log('✅ Current columns in verb_entries:', Object.keys(currentData[0]));
        }

        // Step 2: Check verb_entries_comp structure
        console.log('\n📊 Checking verb_entries_comp structure...');
        const { data: compData, error: compError } = await supabase
            .from('verb_entries_comp')
            .select('*')
            .limit(3);
        
        if (compError) {
            console.error('❌ Error checking verb_entries_comp:', compError);
            return;
        }
        
        if (compData && compData.length > 0) {
            console.log('✅ Columns in verb_entries_comp:', Object.keys(compData[0]));
            console.log('✅ Sample data from verb_entries_comp:');
            compData.forEach((row, index) => {
                console.log(`   Row ${index + 1}:`, {
                    key: row.key,
                    norm_lemma: row.norm_lemma,
                    prime_type: row.prime_type,
                    is_prnl_end: row.is_prnl_end
                });
            });
        }

        // Step 3: Count records in both tables
        const { count: verbCount } = await supabase
            .from('verb_entries')
            .select('*', { count: 'exact', head: true });
        
        const { count: compCount } = await supabase
            .from('verb_entries_comp')
            .select('*', { count: 'exact', head: true });

        console.log(`\n📈 Record counts:`);
        console.log(`   verb_entries: ${verbCount} records`);
        console.log(`   verb_entries_comp: ${compCount} records`);

        // Step 4: Test the key relationship
        console.log('\n🔗 Testing key relationship...');
        const { data: relationshipTest } = await supabase
            .from('verb_entries')
            .select('entry_key')
            .in('entry_key', compData.map(row => row.key))
            .limit(5);
        
        console.log('✅ Matching keys found:', relationshipTest?.length || 0);

        console.log('\n✅ Migration analysis complete!');
        console.log('\n🚀 Ready to run the SQL migration commands.');
        console.log('📄 Execute the commands in: merge_verb_tables.sql');

    } catch (error) {
        console.error('❌ Migration analysis failed:', error);
    }
}

runVerbMigration().catch(console.error);