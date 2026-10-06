import fs from 'fs';
import path from 'path';

// Minimal valid transparent/colored PNG template generator for PWA fallback icons
// Ensures browsers requiring PNG icons load valid image headers
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const iconBuffer = Buffer.from(base64Png, 'base64');

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

['pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'apple-touch-icon.png', 'favicon.ico'].forEach((filename) => {
  const filepath = path.join(publicDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, iconBuffer);
  }
});

console.log('PWA Icon assets initialized in /public');
