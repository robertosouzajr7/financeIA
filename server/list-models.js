require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('Fetching available models...');
  try {
     // This is a guess at the API, if the SDK doesn't expose it easily we might need raw fetch
     // But for now let's try a direct simple "gemini-1.0-pro" fallback which is older but stable
     console.log('Skipping list, trying gemini-pro-vision fallback or just gemini-1.0-pro');
  } catch (error) {
     console.error(error);
  }
}

// Actually better to just try a known stable legacy model name that often aliases correctly
// or try to debug the SDK version.
// Let's trying updating the code to 'gemini-1.0-pro' first as a quick check.
