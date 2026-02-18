// core node libs
const path = require("path");
const { exec } = require("child_process");

// third-party libs
const express = require("express");
const multer = require("multer");

// ─────────────────────────────────────────────
// server setup
// ─────────────────────────────────────────────

const server = express();
const upload = multer({ dest: "uploads/" });
const PORT = 13001;

// parse JSON FIRST (important)
server.use(express.json());

// ─────────────────────────────────────────────
// in-memory archive (temporary)
// ─────────────────────────────────────────────

let rawArchive = [
  { id: 1, duration: 12.57, attentionScore: 8, focus: "Light glinting on fountain rocks" },
  { id: 2, duration: 25.5, attentionScore: 1, focus: "Watching blinking cursor" },
  { id: 3, duration: 10.18, attentionScore: 5, focus: "Candy flavor + moon blemishes" },
  { id: 4, duration: 7.11, attentionScore: 10, focus: "Stream of consciousness writing" },
  { id: 5, duration: 0.52, attentionScore: 1, focus: "Breath + palm ridges" },
  { id: 6, duration: 6.33, attentionScore: 3, focus: "Clouds moving" },
  { id: 7, duration: 18.49, attentionScore: 10, focus: "Wind chime installation" },
  { id: 8, duration: 4.23, attentionScore: 2, focus: "City skyline layers" },
  { id: 9, duration: 12.46, attentionScore: 7, focus: "Geese" },
  { id: 10, duration: 12.13, attentionScore: 8, focus: "Ice cream truck menu" },
  { id: 11, duration: 16.2, attentionScore: 10, focus: "Bay waves + bobbing boats" },
  { id: 12, duration: 19.56, attentionScore: 10, focus: "Wind on face" },
  { id: 13, duration: 14.11, attentionScore: 6, focus: "Kids swinging" }
];

// initialize the in-memory archive with required fields for tilling
let archive = rawArchive.map(entry => ({
  ...entry,
  phase: Math.random() * Math.PI * 2,
  metadata: { mood: entry.attentionScore / 10 },  // normalized 0–1
  state: { depth: 0.2, disturbance: 0, lastTouched: null },
  history: []
}));


// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────
// get full archive for frontend
server.get("/api/archive", (req, res) => {
  res.json(archive);
});


server.get("/api/debug", (req, res) => {
  res.json(
    archive.map(item => ({
      id: item.id,
      mood: item.metadata.mood.toFixed(2),
      depth: item.state.depth.toFixed(2),
      disturbance: item.state.disturbance.toFixed(2),
      historyLength: item.history.length
    }))
  );
});

// tilling interaction
server.post("/api/till", (req, res) => {
  const { angleDelta = 0, velocity = 0, direction = null } = req.body;

  archive = tillArchive(archive, angleDelta, velocity, direction);

  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// transformation logic
// ─────────────────────────────────────────────

function tillArchive(data, angleDelta, velocity, direction) {
  const force = Math.min(1, Math.abs(velocity) / 5);

  return data.map(item => {
    // metadata drift
    if (item.metadata?.mood !== undefined) {
      item.metadata.mood += (Math.random() - 0.5) * force;
      item.metadata.mood = clamp(item.metadata.mood, 0, 1);
    }

    // burial / surfacing
    if (direction === "right") {
      item.state.depth += force * 0.05;
    } else if (direction === "left") {
      item.state.depth -= force * 0.05;
    }

    item.state.depth = clamp(item.state.depth, 0, 1);
    item.state.disturbance += force;
    item.state.lastTouched = Date.now();

    item.history.push({
      type: "till",
      angleDelta,
      force,
      time: Date.now()
    });

    return item;
  });
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ─────────────────────────────────────────────
// STATIC FILES (LAST)
// ─────────────────────────────────────────────

server.use(express.static(path.join(__dirname, "public")));
server.use(
  "/ditheredgrass",
  express.static(path.join(__dirname, "ditheredgrass"))
);

// ─────────────────────────────────────────────
// start server
// ─────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});