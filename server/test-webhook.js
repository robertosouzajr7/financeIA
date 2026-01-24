const axios = require('axios');

async function testWebhook() {
  try {
    console.log('🚀 Testing Webhook...');
    
    // 1. Simulate a message from a new user (or existing)
    const payload = {
      user_phone: '5511999999999',
      message: 'Olá, qual meu saldo?',
      instance_name: 'financeia',
      has_media: false
    };

    console.log('📤 Sending payload:', payload);

    const response = await axios.post('http://localhost:3000/api/webhook/whatsapp', payload);

    console.log('✅ Response received:', response.data);
    
    if (response.data.success) {
        console.log('🎉 Test Passed!');
    } else {
        console.log('⚠️ Test completed but success flag is false.');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
    }
  }
}

testWebhook();
