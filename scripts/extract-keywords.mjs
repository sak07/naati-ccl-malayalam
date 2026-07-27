import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_PATH = path.join(__dirname, '..', 'lib', 'scripts.json');
const VOCAB_PATH = path.join(__dirname, '..', 'lib', 'vocabularies.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'lib', 'extracted-vocabularies.json');

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'but', 'or', 'so', 'if', 'because', 'as', 'what', 'why', 'how', 'when', 'where', 'who', 'which',
  'this', 'that', 'these', 'those', 'then', 'there', 'here', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'to', 'of',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 's',
  't', 'just', 'now', 'mr', 'mrs', 'ms', 'dr', 'hello', 'hi', 'yes', 'ok', 'okay', 'thank', 'thanks', 'please', 'straightaway',
  'oh', 'well', 'etc', 'want', 'need', 'like', 'come', 'go', 'take', 'make', 'get', 'see', 'know', 'tell', 'think', 'say',
  'already', 'straight', 'back', 'good', 'great', 'fine', 'sure'
]);

function googleTranslate(text, from = 'en', to = 'hi') {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encoded}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const translated = json[0].map(s => s[0]).join('');
          resolve(translated);
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const scripts = JSON.parse(fs.readFileSync(SCRIPTS_PATH, 'utf8'));
  const vocabularies = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));

  // Map vocabulary words by domain (lowercase)
  const vocabMap = new Map();
  for (const v of vocabularies) {
    const key = v.domain.toLowerCase();
    const wordSet = new Set(v.terms.map(t => t.english.toLowerCase()));
    vocabMap.set(key, wordSet);
  }

  // Extract candidate words grouped by domain
  const domainCandidates = new Map();

  for (const script of scripts) {
    const domainKey = script.domain.toLowerCase();
    if (!domainCandidates.has(domainKey)) {
      domainCandidates.set(domainKey, new Set());
    }
    const candidates = domainCandidates.get(domainKey);

    for (const ex of script.exchanges) {
      if (!ex.english) continue;
      // Extract words
      const words = ex.english
        .toLowerCase()
        .replace(/[^a-z\s-]/g, '') // remove punctuation
        .split(/\s+/);

      for (const w of words) {
        if (w.length > 3 && !STOP_WORDS.has(w)) {
          // Check if it's already in the vocabulary list for this domain
          const vocabSet = vocabMap.get(domainKey);
          if (vocabSet && !vocabSet.has(w)) {
            candidates.add(w);
          }
        }
      }
    }
  }

  // Translate and save
  const result = {};

  for (const [domain, candidates] of domainCandidates.entries()) {
    console.log(`\nTranslating for domain: ${domain} (${candidates.size} candidate words)`);
    const terms = [];
    const sortedWords = Array.from(candidates).sort();

    for (const word of sortedWords) {
      process.stdout.write(`  translating "${word}"...`);
      try {
        const translated = await googleTranslate(word);
        console.log(` ✓ ${translated}`);
        terms.push({ english: word, hindi: translated });
        await sleep(150);
      } catch (err) {
        console.log(` ✗ ERROR: ${err.message}`);
      }
    }
    result[domain] = terms;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\nSuccessfully wrote extracted vocabularies to ${OUTPUT_PATH}`);
}

main().catch(console.error);
