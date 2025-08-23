# Diala Frontend

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed (for backend)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development servers:

**Option 1: Run everything together**
```bash
npm run dev:all
```

This will start both the Convex dev server and Next.js dev server concurrently.

**Option 2: Run servers separately**

In one terminal:
```bash
npm run convex:dev
```

In another terminal:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### YouTube Transcript Feature

The YouTube transcript feature requires:
1. Convex dev server running (included in `npm run dev:all`)
2. Python backend running with the transcript API

To test the transcript feature:
1. Navigate to `/onboarding/transcripts`
2. Enter a YouTube URL
3. The system will fetch and display the transcript

### Environment Variables

The `.env.local` file is automatically created by Convex and contains:
- `CONVEX_DEPLOYMENT`: Your Convex deployment identifier
- `NEXT_PUBLIC_CONVEX_URL`: The Convex backend URL

### Troubleshooting

If you see "Module not found: Can't resolve '@convex/_generated/api'":
1. Make sure Convex dev server is running
2. Check that files exist in `convex/_generated/`
3. Restart the Next.js dev server

If you see "Could not find Convex client!":
1. Make sure the ConvexProvider is properly set up in the app
2. Check that NEXT_PUBLIC_CONVEX_URL is set in .env.local
3. Restart both servers