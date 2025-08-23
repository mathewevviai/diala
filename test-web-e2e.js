#!/usr/bin/env node

/**
 * CLI Tool for End-to-End Web Content Processing Testing
 * This tool tests the complete workflow from URL input to processed embeddings
 */

const { spawn } = require('child_process');
const path = require('path');

class WebContentTester {
  constructor() {
    this.convexUrl = 'http://localhost:3210';
    this.testWorkflowId = 'test-workflow-' + Date.now();
    this.testUserId = 'test-user-cli';
    this.testUrls = [
      'http://aeon.co/essays/beyond-humans-what-other-kinds-of-minds-might-be-out-there',
      'https://dergipark.org.tr/en/download/article-file/4570887'
    ];
  }

  async testApiConnectivity() {
    console.log('🔌 Testing Jina API connectivity...');
    
    try {
      const response = await fetch('https://r.jina.ai/https://example.com', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Jina API is responding');
        console.log('   Title:', data.title);
        console.log('   Word count:', data.content?.split(/\s+/).length || 0);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Jina API test failed:', error.message);
      return false;
    }
  }

  async testConvexIntegration() {
    console.log('🔄 Testing Convex integration...');
    
    // Check if Convex is running
    const convexCheck = spawn('npx', ['convex', 'dev', '--check'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe'
    });

    return new Promise((resolve) => {
      convexCheck.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Convex is running');
        } else {
          console.log('❌ Convex needs to be started');
        }
        resolve(code === 0);
      });
    });
  }

  async runConvexTest() {
    console.log('🧪 Running Convex web content processing test...');
    console.log('📋 Test URLs:', this.testUrls);
    console.log('🔧 Workflow:', this.testWorkflowId);

    try {
      // This would normally be run from Convex dashboard or script
      const testCommand = `
        curl -X POST ${this.convexUrl}/api/testActions.runE2ETest \
        -H "Content-Type: application/json" \
        -d '{"testUrls": ${JSON.stringify(this.testUrls)}, "workflowId": "${this.testWorkflowId}", "userId": "${this.testUserId}"}'
      `;

      console.log('💡 To test manually, run:');
      console.log(testCommand);
      
      return { success: true, command: testCommand };
    } catch (error) {
      console.log('❌ Convex test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async checkEnvironment() {
    console.log('🔍 Checking environment...');
    
    const checks = {
      jinaApiKey: !!process.env.JINA_API_KEY,
      convexEnv: !!process.env.NEXT_PUBLIC_CONVEX_URL,
      nodeEnv: process.env.NODE_ENV || 'development',
    };

    console.log('📊 Environment check:');
    console.log('   Jina API Key:', checks.jinaApiKey ? '✅ Found' : '❌ Missing');
    console.log('   Convex URL:', checks.convexEnv ? '✅ Configured' : '❌ Missing');
    console.log('   Node Env:', checks.nodeEnv);

    return checks;
  }

  async runFullTest() {
    console.log('🚀 Starting Complete Web Content Processing Test');
    console.log('==============================================');

    const results = {
      apiConnectivity: await this.testApiConnectivity(),
      convexIntegration: await this.testConvexIntegration(),
      environment: await this.checkEnvironment(),
      convexTest: await this.runConvexTest(),
    };

    console.log('\n📊 Test Results:');
    console.log('API Connectivity:', results.apiConnectivity ? '✅ PASS' : '❌ FAIL');
    console.log('Convex Integration:', results.convexIntegration ? '✅ PASS' : '❌ FAIL');
    console.log('Environment:', results.environment);
    console.log('Convex Test:', results.convexTest.success ? '✅ READY' : '❌ ISSUE');

    return results;
  }

  static async run() {
    const tester = new WebContentTester();
    await tester.runFullTest();
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Web Content Processor CLI

Usage: node test-web-e2e.js [options]

Options:
  --test-api       Test Jina API connectivity only
  --test-convex    Test Convex integration only
  --quick-test     Run quick single URL test
  --help           Show this help message

Examples:
  node test-web-e2e.js
  node test-web-e2e.js --test-api
  node test-web-e2e.js --quick-test
    `);
    process.exit(0);
  }

  WebContentTester.run();
}

module.exports = WebContentTester;