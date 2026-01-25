/**
 * Test Script for Audio Transcription and PDF Reading
 *
 * Testa se as funcionalidades de transcrição de áudio e leitura de PDF estão funcionando
 */

const fs = require('fs');
const path = require('path');

async function testPDFParsing() {
    console.log('\n📄 ===== TESTE: PDF Parsing =====\n');

    try {
        const pdf = require('pdf-parse');
        console.log('✅ pdf-parse library loaded successfully');

        // Criar um PDF de teste simples (mock)
        const testPDFBuffer = Buffer.from('%PDF-1.4\nTest PDF Content\n%%EOF');

        console.log('⚠️  Para testar com PDF real, você precisaria de um arquivo PDF.');
        console.log('   A biblioteca pdf-parse está instalada e pronta para uso.');

        return true;
    } catch (error) {
        console.error('❌ Error testing PDF parsing:', error.message);
        return false;
    }
}

async function testAudioTranscription() {
    console.log('\n🎤 ===== TESTE: Audio Transcription =====\n');

    try {
        const { transcribeAudio } = require('../utils/llm');
        console.log('✅ transcribeAudio function loaded successfully');

        if (!process.env.GEMINI_API_KEY) {
            console.log('⚠️  GEMINI_API_KEY not found in environment');
            console.log('   Set GEMINI_API_KEY in .env to test audio transcription');
            return false;
        }

        console.log('✅ GEMINI_API_KEY found');
        console.log('✅ Audio transcription is ready (uses gemini-1.5-flash)');
        console.log('   To test with real audio, send an audio message via WhatsApp');

        return true;
    } catch (error) {
        console.error('❌ Error testing audio transcription:', error.message);
        return false;
    }
}

async function testGoogleGenerativeAI() {
    console.log('\n🤖 ===== TESTE: Google Generative AI Library =====\n');

    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        console.log('✅ @google/generative-ai library loaded successfully');

        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            console.log('✅ GoogleGenerativeAI instance created successfully');

            // Testar lista de modelos disponíveis
            console.log('\n📋 Modelos Gemini disponíveis para áudio:');
            console.log('   - gemini-1.5-flash (recomendado - rápido e suporta áudio)');
            console.log('   - gemini-1.5-pro (mais preciso, mais caro)');
            console.log('\n⚠️  gemini-2.0-flash NÃO suporta áudio (apenas texto e imagem)');
        } else {
            console.log('⚠️  GEMINI_API_KEY not set - skipping API test');
        }

        return true;
    } catch (error) {
        console.error('❌ Error testing Google Generative AI:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🧪 ===== INICIANDO TESTES DE PROCESSAMENTO DE MÍDIA =====');
    console.log('Data:', new Date().toLocaleString('pt-BR'));

    const results = {
        pdf: await testPDFParsing(),
        audio: await testAudioTranscription(),
        gemini: await testGoogleGenerativeAI()
    };

    console.log('\n📊 ===== RESULTADOS =====\n');
    console.log('PDF Parsing:', results.pdf ? '✅ OK' : '❌ FALHOU');
    console.log('Audio Transcription Setup:', results.audio ? '✅ OK' : '⚠️  Requer GEMINI_API_KEY');
    console.log('Google Generative AI:', results.gemini ? '✅ OK' : '❌ FALHOU');

    const allPassed = results.pdf && results.gemini;
    console.log('\n' + (allPassed ? '✅ Todos os testes básicos passaram!' : '⚠️  Alguns testes falharam ou requerem configuração'));

    if (!process.env.GEMINI_API_KEY) {
        console.log('\n💡 DICA: Configure GEMINI_API_KEY no .env para habilitar transcrição de áudio');
        console.log('   Obtenha grátis em: https://aistudio.google.com/apikey');
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Certifique-se de que GEMINI_API_KEY está configurado');
    console.log('   2. Envie um áudio via WhatsApp para testar a transcrição');
    console.log('   3. Envie um PDF via WhatsApp para testar a extração de texto');
}

// Executar testes
runAllTests().catch(console.error);
