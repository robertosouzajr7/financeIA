require('dotenv').config();
const axios = require('axios');

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  console.log('Fetching models from:', url);
  try {
    const res = await axios.get(url);
    console.log('Available Models:');
    res.data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
  } catch (error) {
    console.error('Error fetching models:', error.response ? error.response.data : error.message);
  }
}

listModels();
