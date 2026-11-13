const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env");
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

function createUserClient(accessToken) {
  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

module.exports = { supabase, createUserClient };