# Scripts

This directory contains utility scripts for the frontend development workflow.

## convex-dev-retry.js

A Node.js script that automatically retries starting the Convex dev server when it fails with the common "Local backend did not start on port 3210 within 10 seconds" error.

### Features

- **Auto-retry**: Automatically detects Convex startup failures and retries up to 5 times
- **Process cleanup**: Kills hanging Convex processes before retrying
- **Colored output**: Provides clear visual feedback about retry attempts
- **Error detection**: Specifically watches for the port 3210 timeout error
- **Graceful exit**: Properly handles SIGINT/SIGTERM signals

### Usage

The script is automatically used when running:
```bash
npm run convex:dev
npm run dev
npm run dev:all
```

### Available Scripts

- `npm run convex:dev` - Convex dev with auto-retry (recommended)
- `npm run convex:dev:base` - Raw convex dev command (no retry)
- `npm run convex:dev:no-retry` - Alias for convex:dev:base

### Configuration

You can modify the retry behavior by editing the constants in `convex-dev-retry.js`:

- `MAX_RETRIES`: Maximum number of retry attempts (default: 5)
- `RETRY_DELAY`: Delay between retries in milliseconds (default: 3000)

### Troubleshooting

If the script continues to fail after maximum retries, you can:

1. Run `npx convex disable-local-deployments` to disable local Convex backend
2. Use `npm run convex:dev:no-retry` to run without retry logic
3. Check if port 3210 is blocked by another process

### Legacy Script

`convex-dev-retry.sh` is a bash version of the retry script, kept for reference but not actively used.