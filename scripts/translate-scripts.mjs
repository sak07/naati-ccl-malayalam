import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_PATH = path.join(__dirname, '..', 'lib', 'scripts.json');

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

  for (const script of scripts) {
    console.log(`\n[${script.id}]`);
    for (let i = 0; i < script.exchanges.length; i++) {
      const ex = script.exchanges[i];
      // Translate English → Hindi
      process.stdout.write(`  exchange ${i + 1}: translating english → hindi...`);
      try {
        ex.hindi = await googleTranslate(ex.english);
        console.log(` ✓ ${ex.hindi.slice(0, 60)}…`);
        await sleep(120);
      } catch (err) {
        console.log(` ✗ ERROR: ${err.message}`);
        ex.hindi = ex.english; // fallback to English
      }
    }
    // Save after each script
    fs.writeFileSync(SCRIPTS_PATH, JSON.stringify(scripts, null, 2));
  }

  console.log('\nDone. All scripts translated.');
}

main().catch(console.error);
