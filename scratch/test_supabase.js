import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('bins').select('*').limit(1);
        if (error) {
            console.error('❌ Connection Error:', error.message);
            console.error('Full error:', error);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Sample Data:', data);
        }
    } catch (e) {
        console.error('❌ Fatal Error:', e.message);
    }
}

test();
