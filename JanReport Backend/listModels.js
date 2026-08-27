import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error:", data);
      return;
    }

    console.log("✅ Available Models:\n");

    data.models.forEach((model) => {
      console.log(`🔹 ${model.name}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Methods: ${model.supportedGenerationMethods}`);
      console.log("--------------------------------------------------");
    });

  } catch (error) {
    console.error("❌ Fetch Error:", error);
  }
}

listModels();