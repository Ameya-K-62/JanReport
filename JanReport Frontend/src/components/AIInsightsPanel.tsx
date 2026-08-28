import { useEffect, useState } from "react";
import { chatWithAI } from "../services/ai";

export const AIInsightsPanel = ({ report, onClose }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startAI();
  }, []);

  const cleanAIResponse = (text: string) => {
    if (!text) return "";

    return text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^\d+\.\s*/gm, "")
      .replace(/`{1,3}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const getDynamicData = () => {
    return {
      sentimentScore: report?.bert?.confidence || 0,
      sentimentLabel: report?.bert?.label || "neutral",
      severityLevel: report?.severity?.level || "LOW",
      severityScore: report?.severity?.score || 0,
      imageAvailable: report?.image ? true : false,
    };
  };

  const buildPrompt = () => {
    const {
      sentimentScore,
      sentimentLabel,
      severityLevel,
      severityScore,
      imageAvailable,
    } = getDynamicData();

    return [
      {
        role: "user",
        content: `
Analyze the following civic report and explain it clearly.

STRICT INSTRUCTIONS:
- Write in plain text only (no markdown, no **, no ###)
- Do NOT use headings like Summary or Risk Level
- Write in 2-3 natural paragraphs like ChatGPT
- Keep tone human, simple, and professional

DATA CONTEXT:
- Sentiment: ${sentimentLabel} (${sentimentScore}%)
- Severity Level: ${severityLevel} (${severityScore}/100)
- Image Evidence: ${imageAvailable ? "Available" : "Not Available"}

LOGIC RULES:
- If sentiment is positive and severity is LOW → keep tone calm
- If severity is HIGH → reflect urgency
- Do NOT exaggerate beyond given data
- Always match tone with severity

REPORT:
Title: ${report.title}
Description: ${report.description}
Location: ${report.location}
        `,
      },
    ];
  };

  const startAI = async () => {
    setLoading(true);

    try {
      const res = await chatWithAI(buildPrompt());

      const cleanedText = cleanAIResponse(
        res?.reply || "AI not responding"
      );

      typeWriter(cleanedText);

    } catch (err) {
      console.error(err);
      typeWriter("Failed to load AI insights.");
    }

    setLoading(false);
  };

  const typeWriter = (text: string) => {
    if (!text) text = "No response";

    let index = 0;

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const interval = setInterval(() => {
      index++;

      setMessages((prev) => {
        const updated = [...prev];

        if (!updated.length) return prev;

        updated[updated.length - 1].content =
          text.slice(0, index) || "";

        return updated;
      });

      if (index >= text.length) clearInterval(interval);
    }, 15);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await chatWithAI(newMessages);

      const cleanedText = cleanAIResponse(res?.reply || "AI failed");

      typeWriter(cleanedText);

    } catch (err) {
      typeWriter("Error getting response.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed right-0 top-0 w-[420px] h-full bg-white shadow-xl flex flex-col z-50">
      
      {/* HEADER */}
      <div className="bg-black text-white p-4 flex justify-between">
        <div>
          {/* ✅ Explicit h2 styling (same size ensured) */}
          <h2 className="text-xl font-semibold">AI Assistant</h2>
        </div>
        <button onClick={onClose}>✖</button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.role === "user"
                ? "bg-blue-100 ml-auto"
                : "bg-gray-100"
            }`}
            style={{ whiteSpace: "pre-line" }}
          >
            {msg.content}
          </div>
        ))}

        {loading && <div className="text-gray-400">AI thinking...</div>}
      </div>

      {/* INPUT BOX */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border-2 border-black p-2 rounded"
          placeholder="Ask AI..."
        />
        <button
          onClick={sendMessage}
          className="bg-black text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};