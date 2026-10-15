const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function createIcoFromPng(pngBuffer, width, height) {
  const header = Buffer.alloc(22);
  // ICONDIR
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = Icon
  header.writeUInt16LE(1, 4); // Count = 1 image

  // ICONDIRENTRY
  header.writeUInt8(width >= 256 ? 0 : width, 6);   // bWidth
  header.writeUInt8(height >= 256 ? 0 : height, 7); // bHeight
  header.writeUInt8(0, 8);                          // bColorCount
  header.writeUInt8(0, 9);                          // bReserved
  header.writeUInt16LE(1, 10);                       // wPlanes
  header.writeUInt16LE(32, 12);                      // wBitCount
  header.writeUInt32LE(pngBuffer.length, 14);       // dwBytesInRes
  header.writeUInt32LE(22, 18);                     // dwImageOffset

  return Buffer.concat([header, pngBuffer]);
}

async function generate() {
  const size = 512;
  const logoPath = path.resolve(__dirname, '../apps/frontend/public/images/logo/peralagae-logo.png');
  const logo = sharp(logoPath).trim();
  const trimmed = await logo.toBuffer({ resolveWithObject: true });
  
  const logoWidth = 440;
  const logoHeight = Math.round(logoWidth * (trimmed.info.height / trimmed.info.width));
  
  const resizedLogo = await sharp(trimmed.data)
    .resize(logoWidth, logoHeight, { fit: 'inside' })
    .toBuffer();

  const svgBadge = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="luxGlow" cx="50%" cy="50%" r="50%">
          <stop offset="90%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#F7F5F0" />
        </radialGradient>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 6}" fill="url(#luxGlow)" stroke="#C5A572" stroke-width="8" />
    </svg>
  `);

  const topOffset = Math.round((size - logoHeight) / 2);
  const leftOffset = Math.round((size - logoWidth) / 2);

  // 1. High-res PNG (512x512)
  const png512 = await sharp(svgBadge)
    .composite([
      {
        input: resizedLogo,
        top: topOffset,
        left: leftOffset,
      }
    ])
    .png()
    .toBuffer();

  // 2. 32x32 PNG for ICO
  const png32 = await sharp(png512)
    .resize(32, 32)
    .png()
    .toBuffer();

  const icoBuffer = createIcoFromPng(png32, 32, 32);

  // 3. SVG with self-contained embedded base64 image
  const base64Logo = resizedLogo.toString('base64');
  const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="luxGlow" cx="50%" cy="50%" r="50%">
      <stop offset="90%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F7F5F0" />
    </radialGradient>
  </defs>
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 6}" fill="url(#luxGlow)" stroke="#C5A572" stroke-width="8" />
  <image href="data:image/png;base64,${base64Logo}" x="${leftOffset}" y="${topOffset}" width="${logoWidth}" height="${logoHeight}" />
</svg>
`;

  // Write to destinations
  const targets = {
    'apps/frontend/public/icon.svg': fullSvg,
    'apps/frontend/src/app/icon.svg': fullSvg,
    'apps/frontend/public/icon.png': png512,
    'apps/frontend/src/app/icon.png': png512,
    'apps/frontend/public/favicon.ico': icoBuffer,
    'apps/frontend/src/app/favicon.ico': icoBuffer,
  };

  const root = path.resolve(__dirname, '..');
  for (const [relPath, content] of Object.entries(targets)) {
    const fullPath = path.join(root, relPath);
    fs.writeFileSync(fullPath, content);
    console.log('Wrote', relPath);
  }

  console.log('Successfully generated all Peralagae logo favicons!');
}

generate().catch(console.error);
