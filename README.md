# NAATI CCL Malayalam Practice App

A web app for practising **NAATI CCL (Community Language Credential)** interpretation between **Malayalam and English**. Built because practising from an Excel file is painful — this gives you a clean, distraction-free flashcard experience in your browser.

Malayalam script is automatically converted to **Manglish** (romanised Malayalam) so you can practise even if you can't read the script.

---

## What's inside

| Section | Content |
|---|---|
| 💬 Dialogue Practice | 37 flashcard dialogues across 10 domains |
| 📖 Vocabulary | 10 domain word lists · 436 words total |
| 📄 Scripts | 8 human-written read-along scripts |

**Domains covered:** Education · Housing · Finance · Legal · Insurance · Social Service · Immigration · Business · Community · Consumer Affairs

---

## How to use

### Dialogue Practice
1. Pick a dialogue from the list
2. Read the sentence shown
3. Think of the interpretation in your head
4. Tap **Show translation** to reveal it
5. Tap **Next** and repeat

Use the ⚙ gear icon to switch direction (English → Manglish or Manglish → English) or turn off Manglish to see the original Malayalam script.

### Vocabulary
1. Pick a domain word list
2. See the English word
3. Tap **Show meaning** to reveal the Manglish equivalent
4. Mark it **Got it ✓** or **Still learning**

Switch to **Word list** view to browse all terms at once with search.

### Scripts
Read the full dialogue in Manglish and English side by side. Use the **Manglish only** or **English only** modes to test yourself by tapping each line to reveal the hidden translation. Good warmup before doing flashcard practice on the same dialogue.

---

## Running locally

```bash
cd naaticcl
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Adding new content

All source files live in `public/`. The processed JSON lives in `lib/`.

### Adding a new dialogue (xlsx)
1. Update `public/Dialogue Base_31_Oct (1) (1).xlsx` with new sheets
2. Re-run the data conversion script:
   ```bash
   node -e "$(cat scripts/convert-data.js)"
   ```
   Or run the inline node command that regenerates `lib/dialogues.json` (see the project history for the full script).

### Adding a new vocabulary list
1. Add a `.txt` file to `public/` in this format:
   ```
   Domain Name
   english word = manglish meaning
   another word = its meaning
   ```
2. Add the file entry to the `vocabFiles` array in the parse script and re-run it to regenerate `lib/vocabularies.json`.

### Adding a new script dialogue
1. Add a `.txt` file to `public/` with alternating Manglish/English lines:
   ```
   Dialogue Title
   Manglish line here...
   English line here...
   Manglish line here...
   English line here...
   ```
2. Add the entry to the `scriptFiles` array in the parse script and re-run it to regenerate `lib/scripts.json`.

---

## Project structure

```
naaticcl/
├── app/
│   ├── page.tsx                  # Home page (server)
│   ├── HomeClient.tsx            # Home page tabs + lists (client)
│   ├── practice/[id]/
│   │   ├── page.tsx              # Practice page (server)
│   │   └── PracticeClient.tsx    # Flashcard UI (client)
│   ├── vocab/[id]/
│   │   ├── page.tsx              # Vocab page (server)
│   │   └── VocabClient.tsx       # Vocab flashcard UI (client)
│   └── script/[id]/
│       ├── page.tsx              # Script page (server)
│       └── ScriptClient.tsx      # Read-along UI (client)
├── lib/
│   ├── dialogues.json            # 37 flashcard dialogues (generated)
│   ├── vocabularies.json         # 10 vocab lists, 436 words (generated)
│   ├── scripts.json              # 8 read-along scripts (generated)
│   ├── data.ts                   # Dialogue data loader
│   ├── vocab-data.ts             # Vocab data loader
│   ├── script-data.ts            # Script data loader
│   ├── types.ts                  # TypeScript interfaces + colour maps
│   └── useProgress.ts            # localStorage progress/streak hook
└── public/
    ├── Dialogue Base_31_Oct (1) (1).xlsx   # Source dialogue data
    ├── *.txt (vocab)             # Domain vocabulary lists
    └── *.txt (scripts)           # Human-written dialogue scripts
```

---

## Tech stack

- **Next.js 16** (App Router, fully static export)
- **Tailwind CSS v4**
- **TypeScript**
- **xlsx** — parse the Excel source file
- **ml2en** — Malayalam script → Manglish transliteration
- Progress tracking via **localStorage** (no backend needed)
