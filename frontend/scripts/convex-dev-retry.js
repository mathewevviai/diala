#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runConvexCloud() {
  log('Using Convex Cloud (no local backend).', 'yellow');
  const child = spawn('npx', ['convex', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, FORCE_CONVEX_CLOUD: '1' }
  });
  child.on('close', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    log(`Failed to start Convex (Cloud) via npx: ${err.message}`, 'red');
    process.exit(1);
  });
}

function killConvexProcesses() {
  return new Promise((resolve) => {
    const killProcess = spawn('pkill', ['-f', 'convex-local-backend'], { stdio: 'pipe' });
    killProcess.on('close', () => setTimeout(resolve, 1000));
  });
}

function startLocalConvexBackend() {
  return new Promise((resolve, reject) => {
    const binaryPath = path.join(process.cwd(), 'convex-local-backend');
    log(`Starting convex local backend (${binaryPath})...`, 'green');

    const convexProcess = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let hasStarted = false;

    convexProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);

      if (output.includes('Listening on http://0.0.0.0:3210') ||
          output.includes('Listening on 127.0.0.1:3210')) {
        hasStarted = true;
        resolve();
      }
    });

    convexProcess.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      if (output.toLowerCase().includes('error') || output.toLowerCase().includes('failed')) {
        reject(new Error('Local Convex backend error'));
      }
    });

    convexProcess.on('close', (code) => {
      if (code === 0 && hasStarted) {
        resolve();
      } else {
        reject(new Error(`convex-local-backend exited with code ${code}`));
      }
    });

    convexProcess.on('error', (err) => reject(err));

    // Ensure cleanup
    process.on('SIGINT', () => {
      convexProcess.kill('SIGTERM');
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      convexProcess.kill('SIGTERM');
      process.exit(0);
    });
  });
}

async function main() {
  const binaryPath = path.join(process.cwd(), 'convex-local-backend');
  const hasLocalBinary = fs.existsSync(binaryPath);
  const forceCloud = ['1', 'true', 'yes'].includes(String(process.env.FORCE_CONVEX_CLOUD || '').toLowerCase());

  if (forceCloud || !hasLocalBinary) {
    if (!hasLocalBinary) {
      log('convex-local-backend binary not found; falling back to Cloud.', 'yellow');
    }
    return runConvexCloud();
  }

  log('Starting Convex local backend with auto-retry...', 'yellow');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log(`Attempt ${attempt}/${MAX_RETRIES}`, 'green');
      await killConvexProcesses();
      await startLocalConvexBackend();
      log('Convex local backend started successfully!', 'green');
      return;
    } catch (error) {
      log(`Attempt ${attempt} failed: ${error.message}`, 'red');
      if (attempt < MAX_RETRIES) {
        log(`Retrying in ${RETRY_DELAY / 1000} seconds...`, 'yellow');
        await killConvexProcesses();
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      } else {
        log(`Max retries (${MAX_RETRIES}) reached. Convex local backend failed to start.`, 'red');
        process.exit(1);
      }
    }
  }
}

main().catch((err) => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
