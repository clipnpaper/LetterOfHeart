import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine script directory reliably regardless of current working directory
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(scriptDir, '..');
const jsonPath = path.join(webDir, 'kakao-share.json');
const indexPath = path.join(webDir, 'index.html');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(jsonPath)) fail('kakao-share.json not found at ' + jsonPath);
if (!fs.existsSync(indexPath)) fail('index.html not found at ' + indexPath);

const cfg = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
let html = fs.readFileSync(indexPath, 'utf-8');

const tags = [];
if (cfg.title) {
  tags.push(`<meta property="og:title" content="${escapeAttr(cfg.title)}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeAttr(cfg.title)}" />`);
}
if (cfg.description) {
  tags.push(`<meta property="og:description" content="${escapeAttr(cfg.description)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeAttr(cfg.description)}" />`);
}
if (cfg.image) {
  // If a relative image path is provided (starts with '/'), and a url is present,
  // turn it into an absolute URL so crawlers (Kakao, Twitter) can fetch it.
  let imageVal = cfg.image;
  if (typeof imageVal === 'string' && imageVal.startsWith('/') && cfg.url) {
    imageVal = cfg.url.replace(/\/$/, '') + imageVal;
  }
  tags.push(`<meta property="og:image" content="${escapeAttr(imageVal)}" />`);
  tags.push(`<meta name="twitter:image" content="${escapeAttr(imageVal)}" />`);
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
}
if (cfg.url) {
  tags.push(`<meta property="og:url" content="${escapeAttr(cfg.url)}" />`);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}

const inner = tags.join('\n  ');
const startMarker = '<!--KAKAO_META_START-->';
const endMarker = '<!--KAKAO_META_END-->';
const legacyMarker = '<!--KAKAO_META-->';
const block = `${startMarker}\n  ${inner}\n  ${endMarker}`;

if (html.includes(startMarker) && html.includes(endMarker)) {

  // replace between markers
  const re = new RegExp(`${startMarker}[\s\S]*?${endMarker}`,'m');
  html = html.replace(re, block);
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('Updated existing kakao meta block in web/index.html');
} else if (html.includes(legacyMarker)) {
  // replace legacy placeholder with wrapped block
  html = html.replace(legacyMarker, block);
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('Replaced legacy placeholder with kakao meta block in web/index.html');
} else if (html.includes('</head>')) {
  // insert before closing head
  html = html.replace('</head>', `  ${block}\n</head>`);
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('Inserted kakao meta block into web/index.html (before </head>)');
} else {
  fail('Could not find a place to inject kakao meta tags in index.html');
}
