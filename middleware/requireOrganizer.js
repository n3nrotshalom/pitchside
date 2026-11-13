async function requireOrganizer(req, res, next) {
  const { data, error } = await req.supabase
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .single();

  if (error || !data || data.role !== "organizer") {
    return res.status(403).json({ error: "Organizer account required" });
  }

  next();
}

module.exports = requireOrganizer;