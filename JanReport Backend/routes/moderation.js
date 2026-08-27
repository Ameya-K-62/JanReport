import express from "express";
import { analyzeNewsAuthenticity } from "../services/geminiService.js";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const { description } = req.body;

    const result = await analyzeNewsAuthenticity(description);

    res.json(result);
  } catch (error) {
    res.status(500).json({ verdict: "FAKE" });
  }
});

export default router;