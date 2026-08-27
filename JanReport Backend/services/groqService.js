import axios from "axios";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* ================= HELPER FUNCTION ================= */
function containsFakePatterns(text) {
  const t = text.toLowerCase();

  const fakePatterns = [
    "free money",
    "free cash",
    "₹",
    "rs",
    "earn money",
    "win money",
    "viral message",
    "share this",
    "forward this",
    "limited offer",
    "only first",
    "guaranteed money",
    "click this link",
    "government giving money"
  ];

  return fakePatterns.some(pattern => t.includes(pattern));
}

/* ================= AI INSIGHTS ================= */
export async function generateAIResponse(messages) {
  try {
    const prompt = `
You are an intelligent AI assistant for a news platform.

Give a clear, natural, human-like explanation of the news.

Keep it:
- Short
- Informative
- Like ChatGPT

News:
${messages.map(m => m.content).join("\n")}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Respond like ChatGPT. Clear and helpful."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("🔥 GROQ ERROR:", error.response?.data || error.message);
    return "AI service temporarily unavailable.";
  }
}

/* ================= REAL / FAKE DETECTION ================= */
export async function analyzeNewsAuthenticity(newsText) {
  try {

    // 🔥 STEP 1: RULE-BASED (VERY IMPORTANT)
    if (containsFakePatterns(newsText)) {
      return { verdict: "FAKE" };
    }

    // 🔥 STEP 2: AI VALIDATION
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are a strict news verification system.

Rules:
- Real-world events (accidents, infrastructure, crime, weather, transport) → REAL
- Unrealistic claims, scams, viral forwards → FAKE
- If it sounds like a scam → FAKE
- If normal believable news → REAL

Respond ONLY:
REAL or FAKE
            `
          },
          {
            role: "user",
            content: newsText
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let result = response.data.choices[0].message.content
      .toUpperCase()
      .trim();

    if (result.includes("FAKE")) return { verdict: "FAKE" };

    return { verdict: "REAL" };

  } catch (error) {
    console.error("🔥 GROQ ERROR:", error.response?.data || error.message);

    // SAFE FALLBACK
    return { verdict: "REAL" };
  }
}