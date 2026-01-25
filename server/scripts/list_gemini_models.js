/**
 * List Available Gemini Models
 *
 * This script lists all available Gemini models from the API
 * to help identify the correct model name for audio transcription
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
    console.log('🔍 Listing Available Gemini Models...\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment');
        console.log('Please set GEMINI_API_KEY in your .env file');
        process.exit(1);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });

        // List all available models
        console.log('Fetching models from Google AI...\n');

        // Try to get model info
        const models = [
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-3-flash-preview',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
        ];

        console.log('Testing model names:\n');

        // Test models with actual content generation
        console.log('Testing models with a simple text prompt:\n');

        for (const modelName of models) {
            try {
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: 'Say "test successful"'
                });

                const text = response.text;
                console.log(`✅ ${modelName} - WORKS (response: ${text.substring(0, 50)}...)`);
            } catch (error) {
                console.log(`❌ ${modelName} - FAILED`);
                if (error.message) {
                    console.log(`   Error: ${error.message.substring(0, 150)}`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:', error);
    }
}

listModels().catch(console.error);
