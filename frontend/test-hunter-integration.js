#!/usr/bin/env node

/**
 * Test script to verify the hunter search integration is working
 * Run with: node test-hunter-integration.js
 */

const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:8000';
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://127.0.0.1:3210';

async function testWebhookEndpoint() {
  console.log('Testing Convex webhook endpoint...');
  
  try {
    const response = await fetch(`${CONVEX_URL}/updateSearchProgress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchId: 'test_search_123',
        progress: 50,
        currentStage: 'Testing webhook integration'
      })
    });
    
    if (response.ok) {
      console.log('✅ Webhook endpoint is accessible');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('❌ Webhook endpoint returned error:', response.status);
      const text = await response.text();
      console.log('Error:', text);
    }
  } catch (error) {
    console.log('❌ Failed to connect to Convex:', error.message);
    console.log('Make sure npx convex dev is running');
  }
}

async function testBackendEndpoint() {
  console.log('\nTesting backend hunter endpoint...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/public/hunter/health`);
    
    if (response.ok) {
      console.log('✅ Backend hunter service is healthy');
      const data = await response.json();
      console.log('Health:', data);
    } else {
      console.log('❌ Backend service returned error:', response.status);
    }
  } catch (error) {
    console.log('❌ Failed to connect to backend:', error.message);
    console.log('Make sure the backend server is running');
  }
}

async function main() {
  console.log('Hunter Search Integration Test\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Convex URL: ${CONVEX_URL}\n`);
  
  await testWebhookEndpoint();
  await testBackendEndpoint();
  
  console.log('\n✨ Test complete');
  console.log('\nTo fully test the integration:');
  console.log('1. Make sure both backend and Convex are running');
  console.log('2. Visit http://localhost:3000/dashboard/business-hunter');
  console.log('3. Click "NEW HUNT" to create a search');
  console.log('4. Watch the progress update in real-time');
}

main().catch(console.error);