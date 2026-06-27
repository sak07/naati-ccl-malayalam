import fs from 'fs';
import https from 'https';

const DIALOGUES_PATH = new URL('../lib/dialogues.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

function isMalayalam(text) {
  return /[ഀ-ൿ]/.test(text);
}

function googleTranslate(text, from = 'ml', to = 'hi') {
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const dialogues = JSON.parse(fs.readFileSync(DIALOGUES_PATH, 'utf8'));

  let translated = 0;
  let skipped = 0;

  for (let di = 0; di < dialogues.length; di++) {
    const dialogue = dialogues[di];
    let dialogueChanged = false;

    for (let ei = 0; ei < dialogue.exchanges.length; ei++) {
      const ex = dialogue.exchanges[ei];

      for (const field of ['prompt', 'answer']) {
        if (isMalayalam(ex[field])) {
          process.stdout.write(`  [${dialogue.id}] exchange ${ei + 1} ${field}: translating...`);
          try {
            const hindi = await googleTranslate(ex[field]);
            ex[field] = hindi;
            translated++;
            dialogueChanged = true;
            console.log(` ✓ ${hindi.slice(0, 50)}…`);
            await sleep(120); // avoid rate limiting
          } catch (err) {
            console.log(` ✗ ERROR: ${err.message}`);
            skipped++;
          }
        }
      }
    }

    if (dialogueChanged) {
      // Write after each dialogue so progress is saved
      fs.writeFileSync(DIALOGUES_PATH, JSON.stringify(dialogues, null, 2));
    }
  }

  console.log(`\nDone. Translated: ${translated} fields. Skipped: ${skipped}.`);

  // Final check
  const remaining = dialogues.filter(d =>
    d.exchanges.some(e => isMalayalam(e.prompt) || isMalayalam(e.answer))
  );
  if (remaining.length === 0) {
    console.log('✓ No Malayalam remaining in any dialogue.');
  } else {
    console.log(`⚠ Still has Malayalam: ${remaining.map(d => d.id).join(', ')}`);
  }
}

main().catch(console.error);
