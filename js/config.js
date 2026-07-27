const SUPABASE_URL = "https://ilmtgzejzgewbfqsfdqd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1zi3-9gsMc7-O8wII_6tnw_4aNhHU-l";

const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
