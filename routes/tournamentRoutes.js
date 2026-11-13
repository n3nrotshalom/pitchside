const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireOrganizer = require("../middleware/requireOrganizer");

const router = express.Router();

// Public: list published tournaments
router.get("/", async (req, res) => {
  const { data, error } = await require("../lib/supabase").supabase
    .from("tournaments")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ tournaments: data });
});

// Public: tournament details
router.get("/:id", async (req, res) => {
  const { data, error } = await require("../lib/supabase").supabase
    .from("tournaments")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Tournament not found" });
  res.json({ tournament: data });
});

// Organizer: create tournament
router.post("/", requireAuth, requireOrganizer, async (req, res) => {
  const { name, description, location, start_date, end_date } = req.body;

  if (!name) return res.status(400).json({ error: "Tournament name is required" });

  const { data, error } = await req.supabase
    .from("tournaments")
    .insert({
      name,
      description: description || null,
      location: location || null,
      start_date: start_date || null,
      end_date: end_date || null,
      organizer_id: req.user.id,
      status: "draft"
    })
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ tournament: data });
});

// Organizer: update own tournament
router.patch("/:id", requireAuth, requireOrganizer, async (req, res) => {
  const allowed = ["name", "description", "location", "start_date", "end_date", "status"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const { data, error } = await req.supabase
    .from("tournaments")
    .update(updates)
    .eq("id", req.params.id)
    .eq("organizer_id", req.user.id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ tournament: data });
});

// Organizer: delete own tournament
router.delete("/:id", requireAuth, requireOrganizer, async (req, res) => {
  const { error } = await req.supabase
    .from("tournaments")
    .delete()
    .eq("id", req.params.id)
    .eq("organizer_id", req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Tournament deleted" });
});

module.exports = router;