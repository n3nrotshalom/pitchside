const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireOrganizer = require("../middleware/requireOrganizer");
const { supabase } = require("../lib/supabase");

const router = express.Router();

// List matches in a tournament
router.get("/tournament/:tournamentId", async (req, res) => {
  const { data, error } = await supabase
    .from("matches")
    .select("*, home_team:teams!matches_home_team_id_fkey(id,name), away_team:teams!matches_away_team_id_fkey(id,name)")
    .eq("tournament_id", req.params.tournamentId)
    .order("kickoff_at", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ matches: data });
});

// Create a fixture
router.post("/", requireAuth, requireOrganizer, async (req, res) => {
  const {
    tournament_id,
    home_team_id,
    away_team_id,
    kickoff_at,
    venue
  } = req.body;

  if (!tournament_id || !home_team_id || !away_team_id || !kickoff_at) {
    return res.status(400).json({
      error: "tournament_id, home_team_id, away_team_id and kickoff_at are required"
    });
  }

  if (home_team_id === away_team_id) {
    return res.status(400).json({ error: "A team cannot play against itself" });
  }

  const { data, error } = await req.supabase
    .from("matches")
    .insert({
      tournament_id,
      home_team_id,
      away_team_id,
      kickoff_at,
      venue: venue || null,
      created_by: req.user.id
    })
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ match: data });
});

// Update a match score/status
router.patch("/:id/result", requireAuth, requireOrganizer, async (req, res) => {
  const { home_score, away_score, status } = req.body;
  const updates = {};

  if (home_score !== undefined) updates.home_score = home_score;
  if (away_score !== undefined) updates.away_score = away_score;
  if (status !== undefined) updates.status = status;

  if (
    (home_score !== undefined && (!Number.isInteger(home_score) || home_score < 0)) ||
    (away_score !== undefined && (!Number.isInteger(away_score) || away_score < 0))
  ) {
    return res.status(400).json({ error: "Scores must be non-negative whole numbers" });
  }

  const { data, error } = await req.supabase
    .from("matches")
    .update(updates)
    .eq("id", req.params.id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ match: data });
});

module.exports = router;