import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nfnordyuqwenbgjzvlql.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbm9yZHl1cXdlbmJnanp2bHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODM3NzAsImV4cCI6MjA3Nzc1OTc3MH0.O1waEdKdO0a3ecGVBIhc5c1b-1yul9tqJr1nUYJZeSc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: { "Accept": "application/json" },
  },
});
