/**
 * List Available Gemini Models
 *
 * This script lists all available Gemini models from the API
 * to help identify the correct model name for audio transcription
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    console.log('🔍 Listing Available Gemini Models...\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in environment');
        console.log('Please set GEMINI_API_KEY in your .env file');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // List all available models
        console.log('Fetching models from Google AI...\n');

        // Try to get model info
        const models = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro',
            'gemini-1.5-pro-latest',
            'gemini-pro',
            'gemini-pro-vision',
            'gemini-flash-1.5',
            'models/gemini-1.5-flash',
        ];

        console.log('Testing model names:\n');

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                console.log(`✅ ${modelName} - ACCESSIBLE`);

                // Try to get model info if available
                try {
                    const info = await model.getGenerativeModel();
                    console.log(`   Info:`, info);
                } catch (e) {
                    // Model exists but can't get info
                }
            } catch (error) {
                console.log(`❌ ${modelName} - NOT FOUND`);
                if (error.message) {
                    console.log(`   Error: ${error.message.substring(0, 100)}`);
                }
            }
        }

        console.log('\n📋 Testing with a simple text prompt to verify working models:\n');

        // Test models with actual content generation
        const testModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

        for (const modelName of testModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Say "test successful"');
                const response = await result.response;
                const text = response.text();
                console.log(`✅ ${modelName} - WORKS (response: ${text.substring(0, 50)}...)`);
            } catch (error) {
                console.log(`❌ ${modelName} - FAILED`);
                console.log(`   Error: ${error.message.substring(0, 150)}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:', error);
    }
}

listModels().catch(console.error);
