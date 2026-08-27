import express from "express";
import { generateAIResponse } from "../services/geminiService.js";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        reply: "Invalid request format",
      });
    }

    const reply = await generateAIResponse(messages);

    res.json({
      success: true,
      reply: reply || "No response from AI",
    });

  } catch (err) {
    console.error("AI ROUTE ERROR:", err);

    res.status(500).json({
      success: false,
      reply: "AI failed. Try again.",
    });
  }
});

export default router;