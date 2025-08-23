## Image Generation Prompts (Neobrutalist/Memphis Story Set)

Baseline house style for ALL prompts:
- Neobrutalist/Memphis look; bold 3px black outlines; offset shadows; playful geometric shapes
- Vibrant palette: pink, yellow, cyan, violet, with strong black; high contrast
- Flat vector/illustration; minimal gradients; clean noise-free; crisp edges
- Optional grid backdrop (60px spacing), subtle, behind the subject
- Framing variants: 16:9 hero, 1:1 square icon, 4:5 card
- Lighting: none (flat); Background: light off‑white or pastel block with patterns
- Negative: photorealistic, 3D renders, excessive gradients, skeuomorphism, text labels

Tip: Keep a consistent black stroke thickness (3px) and shadow offset (4–6px) across the set.

---

### Hunter LeadGen (hunter/page.tsx)
1) Hero — “Define Your Hunt” (16:9)
- A stylized magnifying glass targeting a city map with pins; industry icons (factory, office, storefront) drift around; Memphis blobs and stripes; bold black outlines; vibrant pink/violet/cyan accents; subtle grid backdrop; offset drop shadows.
2) Step Icons (1:1 set)
- Industry & Location: map marker + briefcase; Company Details: building + sliders; Keywords: tag clouds; Contact Prefs: email/phone/linkedin badges; Validation: shield + check; Preview: clipboard with list; Progress: radar sweep; Results: trophy + database. Each as a separate square icon with thick outlines and 2–3 bold colors.
3) Empty State — “No Results Yet” (4:5)
- An open box with flying contact cards; dotted lines; gentle confetti shapes; warm yellow background block with black border; Memphis dots/grid.
4) Success — “Leads Found” (16:9)
- Stacked contact cards with verified badges (check marks); upward arrow motif; celebratory rays; cyan and pink accents with black outlines.

### Voice Cloning (cloning/page.tsx)
1) Hero — “Choose Your World” (16:9)
- TikTok/YouTube/Twitch abstract tiles (no logos), play buttons, waveform ribbons; Memphis triangles; pink and violet dominant; black outlines; subtle grid.
2) Content Selection (4:5)
- A filmstrip of thumbnails with one highlighted; cursor selecting; bold check marks; cyan/yellow accent shapes.
3) Model & Settings (1:1)
- Dial/knobs and sliders panel; waveform morphing into a microphone silhouette; thick 3px outlines; offset shadow.
4) Identity Verify (4:5)
- ID card with shield and sparkle; calm blue/cyan background block; reassuring tone.
5) Finale — “Your Clone Is Ready” (16:9)
- Headphones around a shining cassette/tape icon labeled with a star; sound waves radiating; confetti shapes.

### Bulk RAG Builder (rag/page.tsx)
1) Hero — “Forge Your Knowledge Base” (16:9)
- Conveyor belt feeding documents/web tiles into a glowing database cylinder; vector arrows; black pipes; violet/orange palette with cyan sparks.
2) Embedding Model (1:1)
- Interlocking nodes (graph) compressing into vectors; bracket glyphs around; Memphis dots.
3) Vector DB Selection (1:1)
- Three database cylinders with different labels as abstract icons; selection ring around one; bold yellow highlight.
4) Processing (4:5)
- Progress gauge filling; gear cluster; floating document chips turning into small cubes; motion lines.
5) Export (16:9)
- Tray ejecting neat JSON/doc tiles; upward arrow; tidy success vibe; cyan/green accent.

### Audio Transcriber (transcribe/page.tsx)
1) Hero — “Transcribe Any Audio” (16:9)
- Microphone + waveform flowing into text blocks; page icons with lines; pink/blue dominance; clean grid.
2) Upload/Drop (4:5)
- Big arrow into a folder; audio file chip; dotted border; playful shapes.
3) Progress (1:1)
- Circular progress ring around a waveform; percent dial; solid black outline.
4) Transcript Actions (4:5)
- Three small panels: copy icon; voice clone icon; bulk download stack; each with label badges (no text).
5) Speakers View (16:9)
- Two chat bubbles with different colors and small avatar circles; timeline ribbon underneath; sentiment badges (smile/neutral/frown) floating.

### YouTube Transcript Fetcher (transcripts/page.tsx)
1) Hero — “Paste a Link” (16:9)
- URL bar motif with a play triangle embedded; link chain icon; red/pink block; black outline; Memphis zigzags.
2) Video Preview (4:5)
- Framed video rectangle with play triangle; metadata badges (author/time) as icons.
3) Actions (1:1 set)
- Copy, Bulk, Chat icons on mini cards; consistent stroke and colors.

### Calls Campaign (calls/page.tsx)
1) Hero — “Launch an Outbound Campaign” (16:9)
- Dial pad + rocket; headset + chart arrow rising; bright purple/yellow; chunky shadows.
2) Targets & Upload (4:5)
- Spreadsheet chip + upload arrow; contact avatar grid; validation check marks.
3) Schedules & Rules (1:1)
- Clock + calendar interlock; toggle switches and sliders; compliance shield.
4) Script Designer (4:5)
- Script page with play/pause icons in margins; branching arrows; neat structure look.
5) Launch Success (16:9)
- Phone ringing icon + confetti; dashboard mini‑widgets smiling; bold green/cyan accent.

### Real‑Time Telephony (rtc/page.tsx)
1) Hero — “Real‑Time ASR” (16:9)
- Live waveform streaming into a transcript strip; Wi‑Fi glyph; orange/cyan palette.
2) Dialer (1:1)
- Retro keypad with glossy star; offset shadow; neat black outline.
3) Live Call (4:5)
- Three stacked panels: transcript lines, sentiment chip, speaker tags; blinking cursor detail.
4) Call Complete (16:9)
- Receipt‑style summary card with big check; duration clock; tidy victory confetti.

### Voice App Container (voice/page.tsx)
1) Hero (16:9)
- Big smiling chat bubble inside headphones; gradient‑free; pink/blue; grid background.
2) Button Set (1:1 set)
- Talk, Stop, Settings icons in our style; consistent stroke and shadow.

### Procedural Audio (procedural/page.tsx)
1) Hero — “Brew the Ambience” (16:9)
- Coffee cup with sound waves as steam; cups clinking motif; purple/yellow; cozy yet bold.
2) Presets (1:1 set)
- Cozy Café, Busy Coffee, Quiet Morning, Cups Clinking Focus: each a square tile with a distinct icon and color swatch.
3) Generating (4:5)
- Animated‑feel progress cauldron where sound cubes drop in; gauge rising.
4) Complete (16:9)
- Audio player bar with sparkles; download arrow; celebratory burst.

### Content Hub — Blog (blog/*)
1) Blog Hero (16:9)
- Editorial collage of geometric shapes; a big starburst sticker; pink/yellow/cyan blocks; bold border.
2) Post Card (4:5)
- Image tile with date badge circle; subtle grid; clean outline.
3) Category Icons (1:1 set)
- Getting Started (rocket), Sales (chart), Voice Tech (mic), Advanced (brain); consistent tile system.

### Courses (courses/page.tsx)
1) Catalog Hero (16:9)
- Graduation cap over layered cards; progress bar motif; purple theme.
2) Course Tile (4:5)
- Book + play icon; module count badge; certificate ribbon.
3) Level Badges (1:1 set)
- Beginner (green circle), Intermediate (yellow diamond), Advanced (red triangle) with black outline.

### Guides (guides/page.tsx)
1) Guides Hero (16:9)
- Big open manual with tabs; lightbulb sticker; cyan theme; Memphis sprinkles.
2) Guide Card (4:5)
- Steps ladder icon; clock badge; bold CTA arrow.
3) Difficulty Chips (1:1 set)
- Beginner/Intermediate/Advanced variants echoing Courses.

---

### Global Color Swatches (reference)
- Pink: #FF4FA3, Yellow: #FFD400, Cyan: #00D2FF, Violet: #9333EA, Black: #000000, Off‑white: #FAFAFA

### Export Guidance
- Deliver each prompt in three crops (16:9, 1:1, 4:5) where applicable
- Keep transparent PNG (icons) and solid‑background PNG/JPG (heroes/cards) variants
- Maintain 3px outline and 4–6px offset shadow consistently