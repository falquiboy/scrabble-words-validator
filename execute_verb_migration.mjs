import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = 'https://ykbtguxnrlprxlxowklx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYnRndXhucmxwcnhseG93a2x4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMTA3ODU5NywiZXhwIjoyMDM2NjU0NTk3fQ.m6tSV9a8DW7hRX3MoYHy-yt2N4nP1u9aBe3LJq3JQ1w'; // Service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeVerbMigration() {
    console.log('🔄 Starting verb tables migration...\n');

    try {
        // Step 0: Check if we can connect and see both tables
        console.log('🔍 Checking connection and table structures...');
        
        const { data: verbSample } = await supabase
            .from('verb_entries')
            .select('*')
            .limit(1);
        
        const { data: compSample } = await supabase
            .from('verb_entries_comp')
            .select('*')
            .limit(1);
        
        if (!verbSample || !compSample) {
            console.error('❌ Cannot access one or both tables');
            return;
        }
        
        console.log('✅ Both tables accessible');
        console.log('📊 verb_entries columns:', Object.keys(verbSample[0]));
        console.log('📊 verb_entries_comp columns:', Object.keys(compSample[0]));

        // Check if columns already exist
        const hasNewColumns = verbSample[0].hasOwnProperty('norm_lemma');
        
        if (hasNewColumns) {
            console.log('⚠️  Columns already exist, skipping ALTER TABLE...');
        } else {
            console.log('❌ Cannot add columns via client - please run ALTER TABLE manually in Supabase SQL Editor');
            console.log('📋 Run this command in SQL Editor:');
            console.log(`
ALTER TABLE verb_entries 
ADD COLUMN norm_lemma TEXT,
ADD COLUMN prime_sense TEXT,
ADD COLUMN prime_type TEXT,
ADD COLUMN prnl_end TEXT,
ADD COLUMN is_prnl_end BOOLEAN;
            `);
            return;
        }

        // Step 2: Get all complementary data and update in batches
        console.log('\n📝 Step 2: Fetching complementary data...');
        
        const { data: compData, error: compError } = await supabase
            .from('verb_entries_comp')
            .select('*');
        
        if (compError) {
            console.error('❌ Error fetching comp data:', compError);
            return;
        }
        
        console.log(`✅ Found ${compData.length} records in verb_entries_comp`);

        // Update in batches
        console.log('\n📝 Updating verb_entries with complementary data...');
        let updated = 0;
        const batchSize = 100;
        
        for (let i = 0; i < compData.length; i += batchSize) {
            const batch = compData.slice(i, i + batchSize);
            
            for (const comp of batch) {
                const { error: updateError } = await supabase
                    .from('verb_entries')
                    .update({
                        norm_lemma: comp.norm_lemma,
                        prime_sense: comp.prime_sense,
                        prime_type: comp.prime_type,
                        prnl_end: comp.prnl_end,
                        is_prnl_end: comp.is_prnl_end
                    })
                    .eq('entry_key', comp.key);
                
                if (!updateError) {
                    updated++;
                }
            }
            
            console.log(`   Processed ${Math.min(i + batchSize, compData.length)}/${compData.length} records...`);
        }
        
        console.log(`✅ Updated ${updated} records successfully!`);

        // Step 3: Verify the merge
        console.log('\n📝 Step 3: Verifying the merge...');
        
        const { data: verifyData, error: verifyError } = await supabase
            .from('verb_entries')
            .select('entry_key, norm_lemma, prime_sense, prime_type, prnl_end, is_prnl_end')
            .not('norm_lemma', 'is', null)
            .limit(5);
        
        if (verifyError) {
            console.error('❌ Error verifying data:', verifyError);
            return;
        }
        
        console.log('✅ Sample merged data:');
        verifyData.forEach((row, index) => {
            console.log(`   ${index + 1}. Key: ${row.entry_key}`);
            console.log(`      Norm Lemma: ${row.norm_lemma}`);
            console.log(`      Prime Type: ${row.prime_type}`);
            console.log(`      Pronominal: ${row.prnl_end} (valid: ${row.is_prnl_end})`);
            console.log(`      Prime Sense: ${row.prime_sense?.substring(0, 60)}...`);
            console.log('');
        });

        // Step 4: Count updated records
        console.log('📊 Step 4: Counting updated records...');
        
        const { count: totalCount } = await supabase
            .from('verb_entries')
            .select('*', { count: 'exact', head: true });
        
        const { count: updatedCount } = await supabase
            .from('verb_entries')
            .select('*', { count: 'exact', head: true })
            .not('norm_lemma', 'is', null);
        
        console.log(`✅ Migration Results:`);
        console.log(`   Total verb_entries: ${totalCount}`);
        console.log(`   Updated with comp data: ${updatedCount}`);
        console.log(`   Percentage updated: ${((updatedCount / totalCount) * 100).toFixed(2)}%`);

        console.log('\n🎉 Verb tables migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

executeVerbMigration().catch(console.error);