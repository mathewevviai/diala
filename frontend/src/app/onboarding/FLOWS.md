## Diala Onboarding Flows (Story Edition)

Below is a story-style walkthrough for each onboarding area under `frontend/src/app/onboarding/`. Each section follows the imported components and the intended user journey from first click to finish.

### Hunter LeadGen (`hunter/page.tsx`)
- **Prologue — Define the hunt**: We open with `SearchDefinitionStep` where the user names their hunt and clarifies the mission (why these leads matter). Helper context appears via `SearchDefinitionInfoSections`.
- **Chapter 1 — Aim your sights**: `IndustryLocationStep` narrows focus to an industry and geography.
- **Chapter 2 — Know your prey**: `CompanyDetailsStep` shapes firmographics (size, attributes).
- **Chapter 3 — Speak their language**: `SearchKeywordsStep` captures the phrases that surface the right companies and contacts.
- **Chapter 4 — Outreach rules**: `ContactPreferencesStep` decides emails/phones/LinkedIn preferences.
- **Chapter 5 — Guardrails**: `ValidationCriteriaStep` sets must-have criteria so results are clean and useful.
- **Chapter 6 — Preview before launch**: `SearchPreviewStep` assembles the plan for review.
- **Chapter 7 — Arm the engines**: A `VerificationModal` briefly confirms contact info; the flow kicks off.
- **Chapter 8 — The crawl**: `SearchProgressStep` shows live status, percent complete, and stages.
- **Finale — The results**: `SearchResultsStep` reveals totals, verified contacts, and outcomes.

Supporting cast: UI (`Card`, `Button`, `TooltipProvider`), Convex actions (`api.hunterActions.*`), and a friendly `OnboardingFooter` at the end.

### Voice Cloning (`cloning/page.tsx`)
- **Prologue — Choose your world**: `PlatformSelectionStep` lets creators pick content from TikTok, YouTube, Twitch—or upload.
- **Chapter 1 — Set the stage**: `ChannelSetupStep` wires up the channel or media to pull from.
- **Chapter 2 — Pick your moments**: `ContentSelectionStep` curates the clips that define the voice.
- **Chapter 3 — Pick your engine**: `ModelSelectionStep` selects the AI voice model.
- **Chapter 4 — Sculpt the sound**: `VoiceSettingsStep` tunes expressiveness, pacing, chunking.
- **Chapter 5 — Give it lines**: `TextInputStep` provides the test script to hear the result.
- **Chapter 6 — Confirm identity**: `IdentityVerificationStep` and `VerificationModal` protect creators.
- **Finale — Review & celebrate**: `ReviewCompleteStep` packages the clone, offers test and export.

Powered by hooks (`useTikTokContent`, `useYouTubeContent`, `useTwitchContent`, `useVoiceCloning`), shared context (`VideoPreviewProvider`), and generous UI.

### Bulk RAG Builder (`rag/page.tsx`)
- **Prologue — Pick a source**: `PlatformSelectionStep` selects web, social, or docs.
- **Chapter 1 — How you’ll feed it**: `InputMethodStep` (URLs vs channel) or `DocumentUploadStep` for files.
- **Chapter 2 — Curate the corpus**: `ContentSelectionStep` gathers the right items (skipped for URLs).
- **Chapter 3 — Choose embeddings**: `ModelSelectionStep` picks an embedding model (e.g., Jina v4).
- **Chapter 4 — Choose your vector home**: `VectorDbSelectionStep` (e.g., Convex).
- **Chapter 5 — Light the forge**: `ProcessingStepConvex` streams progress creating vectors.
- **Finale — Ship it**: `ExportStep` packages outputs for downstream use.

This is the assembly line for a production-grade RAG corpus—fast, visible, and repeatable.

### Audio Transcriber (`transcribe/page.tsx`)
- **Prologue — Drop your audio**: The user uploads or drags via `DragDropUpload`.
- **Chapter 1 — Verify & go**: `VerificationModal` confirms contact and starts the job.
- **Chapter 2 — Watch it work**: A clear progress bar tracks upload and processing.
- **Chapter 3 — Read & act**: Transcript arrives with actions:
  - `CopyTranscriptModal` for one‑click copy
  - `VoiceCloneModal` to immediately leverage the audio in cloning
  - `BulkDownloadModal` for batch workflows
  - `ChatWithDialaModal` to explore your transcript conversationally
- **Chapter 4 — Understand speakers**: Toggle tabs to `SpeakerTimeline` for diarization and sentiment context.

### YouTube Transcript Fetcher (`transcripts/page.tsx`)
- **Prologue — Paste a link**: The user enters a YouTube URL.
- **Chapter 1 — Start the job**: The system fires a Convex job (`youtubeTranscriptActions.*`).
- **Chapter 2 — See the video & metadata**: Title, author, and preview appear.
- **Chapter 3 — Use the words**: Copy, bulk options, and a friendly chat prompt. The transcript renders in bold, readable chunks.

### Calls Campaign Onboarding (`calls/page.tsx`)
- **Prologue — Define your mission**: Rich controls (`Input`, `Select`, `Switch`, `Slider`) shape campaign name, goals, and type.
- **Chapter 1 — Team & talent**: Pick an Agent voice and configure preview text; surface premium features via `PremiumFeatureCard`.
- **Chapter 2 — Targets & uploads**: Choose list type, import contacts, and map fields with `Textarea`/`Upload` flows.
- **Chapter 3 — Schedule & scale**: Operating hours, retries, recording, voicemail—all governed by clear toggles and sliders.
- **Chapter 4 — Script & safeguards**: Design scripts, assign play/pause cues, and set compliance guardrails.
- **Finale — Review & launch**: Analytics widgets, performance indicators, and a confident launch button.

A narrative UI for production‑ready outbound, bookended by `OnboardingNav` and `OnboardingFooter`.

### Real‑Time Telephony Demo (`rtc/page.tsx`)
- **Prologue — The promise**: A welcome card sets expectations: real‑time ASR, diarization, and sentiment.
- **Chapter 1 — Dial**: `RTCPhoneDialer` simulates the live call setup.
- **Chapter 2 — Go live**: Streaming transcript, adaptive sentiment chips, and speaker labels tell the story of the call.
- **Finale — Wrap**: `Call Complete` summarizes duration, sentiment, speakers, and transcript size—with a one‑click reset to go again.

### Voice App Container (`voice/page.tsx`)
- **All‑in one stage**: Embeds the full `App` experience inside a branded layout with the `OnboardingFooter`. A direct gateway to the live voice agent.

### Procedural Audio Generator (`procedural/page.tsx`)
- **Prologue — Design the ambience**: Name the scene, describe the space, and pick intensity.
- **Chapter 1 — Pick your preset**: Coffee shop flavors like Cozy Café or Busy Coffee, each tuned.
- **Chapter 2 — Brew the sound**: Kick off generation; a progress modal and `AudioGenerationProgress` keep you in the loop.
- **Finale — Enjoy the vibe**: Audio previews inline; download and start another in a click.

### Content Hub — Blog (`blog/page.tsx`, `blog/[blogId]/page.tsx`)
- **Discover**: Featured hero + recent list.
- **Explore**: Category‑flavored tiles lead to in‑depth posts.
- **Read**: Clean, typographic posts with strong emphasis and scannability.

### Courses Catalog (`courses/page.tsx`)
- **Browse**: Filter by level; cards show duration, modules, students, and rating.
- **Commit**: Enroll, track `Progress`, and return to continue learning.

### Guides Library (`guides/page.tsx`)
- **Pick the path**: Beginner to advanced.
- **Follow the steps**: Estimated time, steps, and a bold CTA to start.

---

Each flow is purpose‑built: clear steps, visible progress, strong defaults, and delightful finishes. Whether you’re hunting leads, cloning a voice, forging a RAG corpus, or brewing ambience, every journey lands with momentum for what comes next.