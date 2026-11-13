const { createUserClient } = require("../lib/supabase");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer access token" });
  }

  const userSupabase = createUserClient(token);
  const { data, error } = await userSupabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }

  req.user = data.user;
  req.supabase = userSupabase;
  next();
}

module.exports = requireAuth;