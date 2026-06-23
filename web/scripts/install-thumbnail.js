import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(scriptDir, '..');
// repo root is one level above webDir
const repoRoot = path.join(webDir, '..');
const candidate = path.join(repoRoot, 'thumbnail.png'); // repoRoot/thumbnail.png
const alternate = path.join(webDir, 'thumbnail.png'); // web/thumbnail.png fallback
const uploadsDir = path.join(repoRoot, 'uploads'); // repoRoot/uploads (served by backend)


function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

let src = null;
if (fs.existsSync(candidate)) src = candidate;
else if (fs.existsSync(alternate)) src = alternate;

if (!src) {
  console.log('No thumbnail.png found at project root. Skipping thumbnail install.');
  process.exit(0);
}

ensureDir(uploadsDir);
const dest = path.join(uploadsDir, 'kakao-thumbnail.png');
fs.copyFileSync(src, dest);
console.log(`Copied thumbnail from ${src} to ${dest}`);
