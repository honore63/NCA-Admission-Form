const SUPABASE_URL = "https://faajngoklmoydbzyjxpz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhYWpuZ29rbG1veWRienlqeHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjE5ODksImV4cCI6MjEwMDczNzk4OX0.C3SfjHSNdOYrhjU2jQmNUalG8JWf8P2e09p-D0XrYhg";

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
