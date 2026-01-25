const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Default looks in current dir (server/)

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).countTokens("test");
    // countTokens works on most models, but ListModels is a separate API call usually not directly exposed nicely in the helper, 
    // but the error message suggested calling ListModels.
    // Actually, let's try to just list them via REST or find the method if available.
    // The SDK might not have listModels easily accessible in the helper, but let's try the model.
    console.log("If you see this, gemini-1.5-flash is somewhat responsive.");
  } catch (e) {
      console.log("Error on default model:", e.message);
  }
}

// Better approach: use the raw fetch to list models
async function fetchModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Available Models:");
    if (data.models) {
        data.models.forEach(m => {
            if (m.name.includes("gemini")) console.log(m.name, m.supportedGenerationMethods);
        });
    } else {
        console.log("No models returned", data);
    }
}

fetchModels();
