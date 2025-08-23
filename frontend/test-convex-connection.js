#!/usr/bin/env node

/**
 * Test Convex connection and webhook endpoints
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'http://127.0.0.1:3210';

console.log('Testing Convex connection...');
console.log(`Convex URL: ${CONVEX_URL}`);
console.log('');

// Test if Convex is running
fetch(CONVEX_URL)
  .then(response => {
    if (response.ok || response.status === 404) {
      console.log('✅ Convex server is running');
      return testWebhookEndpoint();
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  })
  .catch(error => {
    console.error('❌ Convex server is NOT running');
    console.error(`Error: ${error.message}`);
    console.log('');
    console.log('To start Convex:');
    console.log('  npx convex dev');
    process.exit(1);
  });

async function testWebhookEndpoint() {
  console.log('');
  console.log('Testing webhook endpoint...');
  
  try {
    const response = await fetch(`${CONVEX_URL}/updateSearchProgress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchId: 'test_' + Date.now(),
        progress: 50,
        currentStage: 'Test webhook from script'
      })
    });
    
    const text = await response.text();
    
    if (response.ok) {
      console.log('✅ Webhook endpoint is working');
      console.log(`Response: ${text}`);
    } else {
      console.log(`⚠️  Webhook returned status ${response.status}`);
      console.log(`Response: ${text}`);
      
      if (response.status === 404) {
        console.log('');
        console.log('The HTTP endpoint is not found. Make sure:');
        console.log('1. Convex is running (npx convex dev)');
        console.log('2. The http.ts file has been deployed');
        console.log('3. Try restarting Convex dev server');
      }
    }
  } catch (error) {
    console.error('❌ Failed to test webhook');
    console.error(`Error: ${error.message}`);
  }
  
  console.log('');
  console.log('=== Test Complete ===');
}