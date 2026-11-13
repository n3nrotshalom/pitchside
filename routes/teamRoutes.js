const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireOrganizer = require("../middleware/requireOrganizer");
const { supabase } = require("../lib/supabase");

const router = express.Router();

// List teams for a tournament
router.get("/tournament/:tournamentId", async (req, res) => {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", req.params.tournamentId)
    .order("name");

  if (error) return res.status(400).json({ error: error.message });
  res.json({ teams: data });
});

// Add a team to a tournament owned by the organizer
router.post("/", requireAuth, requireOrganizer, async (req, res) => {
  const { tournament_id, name, coach_name } = req.body;

  if (!tournament_id || !name) {
    return res.status(400).json({ error: "tournament_id and name are required" });
  }

  const { data, error } = await req.supabase
    .from("teams")
    .insert({
      tournament_id,
      name,
      coach_name: coach_name || null,
      created_by: req.user.id
    })
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ team: data });
});

module.exports = router;