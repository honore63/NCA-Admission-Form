const SUPABASE_URL = "https://ilmtgzejzgewbfqsfdqd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1zi3-9gsMc7-O8wII_6tnw_4aNhHU-l";

var supabase = null;

(function () {
  try {
    if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof createClient === "function") {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
    supabase = null;
  }
})();
