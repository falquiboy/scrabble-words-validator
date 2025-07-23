import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykbtguxnrlprxlxowklx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrYnRndXhucmxwcnhseG93a2x4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEwNzg1OTcsImV4cCI6MjAzNjY1NDU5N30.0-xQhGKGKBKhG8kUz1Wl7MxNNK6cQpCkRxJQzGiw0IM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('🔍 Checking verb tables...');
    
    try {
        // Check verb_entries
        const { data: verbData, error: verbError } = await supabase
            .from('verb_entries')
            .select('*')
            .limit(1);
        
        if (verbError) {
            console.log('❌ verb_entries error:', verbError.message);
        } else {
            console.log('✅ verb_entries accessible, columns:', Object.keys(verbData[0] || {}));
        }

        // Check verb_entries_comp
        const { data: compData, error: compError } = await supabase
            .from('verb_entries_comp')
            .select('*')
            .limit(1);
        
        if (compError) {
            console.log('❌ verb_entries_comp error:', compError.message);
        } else {
            console.log('✅ verb_entries_comp accessible, columns:', Object.keys(compData[0] || {}));
            console.log('📋 Sample comp data:', compData[0]);
        }

    } catch (error) {
        console.error('❌ Connection error:', error.message);
    }
}

checkTables();