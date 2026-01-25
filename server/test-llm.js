require('dotenv').config();
const { generateResponse } = require('./utils/llm');

async function test() {
  console.log('Testing LLM...');
  try {
    const response = await generateResponse('Olá, quem é você?');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
