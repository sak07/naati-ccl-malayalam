#!/usr/bin/env node
/**
 * generate-audio.js
 * 
 * Pre-generates audio files for all NAATI CCL dialogue exchanges using
 * Mac's built-in `say` command. No API keys or costs required.
 *
 * Voices used:
 *   English: Karen (en_AU) — Australian English female
 *   Hindi:   Lekha (hi_IN) — Hindi female
 *
 * Output: public/audio/{dialogueId}/{exchangeIndex}-en.aiff
 *                                    {exchangeIndex}-hi.aiff
 *
 * Run: node scripts/generate-audio.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dialogues = require('../lib/dialogues.json');

const OUTPUT_DIR = path.join(__dirname, '../public/audio');
const EN_VOICE = 'Karen';   // en_AU — Australian English
const HI_VOICE = 'Lekha';  // hi_IN — Hindi
// Slower rate so it matches exam pacing (say rate is words-per-minute, default ~175)
const EN_RATE = 130;  // ~0.75 of normal — deliberate, clear
const HI_RATE = 110;  // Hindi slightly slower for clarity

function isEnglish(text) {
  return /^[A-Za-z\s.,!?'"()\-:;0-9]+$/.test(text.trim());
}

function sanitizeForShell(text) {
  // Escape single quotes for shell safety
  return text.replace(/'/g, "'\\''");
}

function generateAiff(text, voice, rate, outputPath) {
  const escaped = sanitizeForShell(text);
  const cmd = `say -v "${voice}" -r ${rate} -o "${outputPath}" '${escaped}'`;
  execSync(cmd, { stdio: 'pipe' });
}

function convertToM4a(aiffPath, m4aPath) {
  const cmd = `afconvert -f m4af -d aac "${aiffPath}" "${m4aPath}"`;
  execSync(cmd, { stdio: 'pipe' });
}

function ensureM4a(aiffPath, m4aPath) {
  if (fs.existsSync(m4aPath)) return 'skipped';
  if (!fs.existsSync(aiffPath)) return 'missing';
  convertToM4a(aiffPath, m4aPath);
  return 'converted';
}

let total = 0;
let done = 0;
let skipped = 0;
let errors = 0;

// Count total files to generate
for (const dialogue of dialogues) {
  total += dialogue.exchanges.length * 2; // en + hi per exchange
}

console.log(`\n🎙️  NAATI CCL Audio Generator`);
console.log(`   Voices: ${EN_VOICE} (English) + ${HI_VOICE} (Hindi)`);
console.log(`   Dialogues: ${dialogues.length} | Exchanges: ${total / 2} | Files: ${total}\n`);

for (const dialogue of dialogues) {
  const dialogueDir = path.join(OUTPUT_DIR, dialogue.id);
  fs.mkdirSync(dialogueDir, { recursive: true });

  for (let i = 0; i < dialogue.exchanges.length; i++) {
    const exchange = dialogue.exchanges[i];
    const { prompt, answer } = exchange;

    // Determine which is English and which is Hindi
    const promptIsEnglish = isEnglish(prompt);
    const englishText = promptIsEnglish ? prompt : answer;
    const hindiText = promptIsEnglish ? answer : prompt;

    const enAiff = path.join(dialogueDir, `${i}-en.aiff`);
    const hiAiff = path.join(dialogueDir, `${i}-hi.aiff`);
    const enPath = path.join(dialogueDir, `${i}-en.m4a`);
    const hiPath = path.join(dialogueDir, `${i}-hi.m4a`);

    // Generate English audio
    if (fs.existsSync(enPath)) {
      skipped++;
    } else {
      try {
        process.stdout.write(`  [${done + skipped + 1}/${total}] ${dialogue.id} exchange ${i} (EN)... `);
        if (!fs.existsSync(enAiff)) generateAiff(englishText, EN_VOICE, EN_RATE, enAiff);
        ensureM4a(enAiff, enPath);
        console.log('✓');
        done++;
      } catch (err) {
        console.log(`✗ ERROR: ${err.message}`);
        errors++;
      }
    }

    // Generate Hindi audio
    if (fs.existsSync(hiPath)) {
      skipped++;
    } else {
      try {
        process.stdout.write(`  [${done + skipped + 1}/${total}] ${dialogue.id} exchange ${i} (HI)... `);
        if (!fs.existsSync(hiAiff)) generateAiff(hindiText, HI_VOICE, HI_RATE, hiAiff);
        ensureM4a(hiAiff, hiPath);
        console.log('✓');
        done++;
      } catch (err) {
        console.log(`✗ ERROR: ${err.message}`);
        errors++;
      }
    }
  }
}

console.log(`\n✅ Done!`);
console.log(`   Generated: ${done} files`);
console.log(`   Skipped (already exist): ${skipped} files`);
if (errors > 0) console.log(`   Errors: ${errors} files`);
console.log(`   Audio saved to: public/audio/\n`);
