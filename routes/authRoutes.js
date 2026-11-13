const express = require("express");
const { supabase } = require("../lib/supabase");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        error: "fullName, email, password and role are required"
      });
    }

    if (!["fan", "organizer"].includes(role)) {
      return res.status(400).json({ error: "Role must be fan or organizer" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role
        }
      }
    });

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({
      message: data.session
        ? "Account created successfully"
        : "Account created. Check your email to confirm it before logging in.",
      user: data.user,
      session: data.session
    });
  } catch (err) {
    res.status(500).json({ error: "Unable to create account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: error.message });

    res.json({
      message: "Login successful",
      user: data.user,
      session: data.session
    });
  } catch (err) {
    res.status(500).json({ error: "Unable to log in" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const { data: profile, error } = await req.supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(404).json({ error: "Profile not found" });

  res.json({ user: req.user, profile });
});

// POST /api/auth/logout
// JWT-based API logout is completed by deleting tokens on the frontend.
router.post("/logout", requireAuth, (req, res) => {
  res.json({
    message: "Logout request received. The frontend must discard the access and refresh tokens."
  });
});

module.exports = router;