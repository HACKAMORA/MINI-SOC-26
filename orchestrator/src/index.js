import express from "express";
import { createLab, stopLab, getLab, listLabsForUser } from "./labs.js";

const app = express();
app.use(express.json());

// Internal-only service (bound to 127.0.0.1 by docker-compose.yml's port
// mapping) — the dashboard's Next.js API routes are the only intended
// caller, after they've already authenticated the user themselves.
// This service trusts whatever userId/wazuhGroup it's given; it does not
// re-check auth. Never expose this port beyond localhost.

app.post("/labs", async (req, res) => {
  const { userId, wazuhGroup } = req.body ?? {};
  if (!userId || !wazuhGroup) {
    return res.status(400).json({ error: "userId and wazuhGroup are required" });
  }
  const existing = listLabsForUser(userId);
  if (existing.length > 0) {
    return res.status(409).json({ error: "a lab is already running for this user", lab: existing[0] });
  }
  try {
    const lab = await createLab({ userId, wazuhGroup });
    res.status(201).json({ lab });
  } catch (err) {
    console.error("createLab failed:", err);
    res.status(502).json({ error: err.message });
  }
});

app.delete("/labs/:id", async (req, res) => {
  try {
    const result = await stopLab(req.params.id);
    if (!result) return res.status(404).json({ error: "lab not found" });
    res.json(result);
  } catch (err) {
    console.error("stopLab failed:", err);
    res.status(502).json({ error: err.message });
  }
});

app.get("/labs/:id", (req, res) => {
  const lab = getLab(req.params.id);
  if (!lab) return res.status(404).json({ error: "lab not found" });
  res.json({ lab });
});

app.get("/labs", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId query param is required" });
  const [lab] = listLabsForUser(userId);
  res.json({ lab: lab ?? null });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const port = 4100;
app.listen(port, () => console.log(`lab-orchestrator listening on :${port}`));
