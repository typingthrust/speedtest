import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow app to run even without Supabase credentials (for development)
// Will show errors in console but won't crash the app
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url_here') {
  console.warn('⚠️ Supabase environment variables are not set. Please configure your .env file.');
  console.warn('The app will run but authentication and database features will not work.');
}

// Create client with fallback values to prevent crashes
const safeUrl = supabaseUrl && supabaseUrl !== 'your_supabase_project_url_here' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here'
  ? supabaseAnonKey
  : 'placeholder-key';

export const supabase = createClient(safeUrl, safeKey); 