## Diala

Diala is a real-time voice agent application with a focus on clean, guided onboarding experiences.

## Backend Models & Dependencies

### Hugging Face Models
The backend uses various Hugging Face models for audio processing, voice cloning, and AI capabilities. To see the exact models currently cached, run:

```bash
cd backend
source venv/bin/activate
huggingface-cli scan-cache
```

### Model Installation
After clearing the cache, models will be automatically downloaded when first used. However, you can pre-download specific models using:

```bash
cd backend
source venv/bin/activate
# Example: Download a specific model
huggingface-cli download <model-name>
```

### Cache Management
To clear the Hugging Face model cache:

```bash
cd backend
# Find and remove cache directories
find . -name ".cache" -type d -exec rm -rf {} +
```

## What this repo focuses on now
We are primarily documenting and iterating on the onboarding flows. Start with the two docs below to understand the user journeys and the exact components each page imports.

- [Onboarding Flows (narrative walkthrough)](frontend/src/app/onboarding/FLOWS.md)
- [Onboarding Page Imports (component references)](frontend/src/app/onboarding/IMPORTS.md)

## TL;DR
- Read the two onboarding docs above to see what each flow does and how it's built.
- Use the existing pages under `frontend/src/app/onboarding/` as your source of truth for the current UX.

## Git Workflow
To commit and push changes to the main branch:

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Your commit message here"

# Push to main branch
git push origin main
```

For development commands and architecture, see `CLAUDE.md`. 