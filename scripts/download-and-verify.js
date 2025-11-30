// scripts/download-and-verify.js
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const path = require('path');
const os = require('os');

function download(url, outPath, expectedHash) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath);
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error('bad status ' + res.statusCode));
      const hash = crypto.createHash('sha256');
      res.on('data', chunk => hash.update(chunk));
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const h = hash.digest('hex');
          if (expectedHash && expectedHash.length > 0 && h !== expectedHash) return reject(new Error('hash mismatch ' + h));
          resolve(outPath);
        });
      });
    }).on('error', err => {
      try { fs.unlinkSync(outPath); } catch {}
      reject(err);
    });
  });
}

(async function main(){
  try {
    const url = process.argv[2];
    const expectedHash = process.argv[3] || '';
    if (!url) {
      console.error('Usage: node download-and-verify.js <url> [sha256]');
      process.exit(1);
    }
    const outDir = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'TechnetiumIDE', 'models');
    fs.mkdirSync(outDir, { recursive: true });
    const filename = path.basename(url.split('?')[0]);
    const outPath = path.join(outDir, filename);
    console.log('Downloading to', outPath);
    await download(url, outPath, expectedHash);
    // Print a single-line JSON object on stdout with the saved path (easy to parse)
    const result = { path: outPath };
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error('Download error:', err?.message || err);
    process.exit(2);
  }
})();