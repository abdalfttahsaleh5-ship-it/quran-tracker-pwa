const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Raw pixel data: for each row: 1 filter byte (0) + width * 4 RGBA bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.46;
  const rInner = width * 0.40;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded square / shield
      const cornerRadius = size * 0.22;
      const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
      const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
      const distCorner = Math.sqrt(qx * qx + qy * qy);

      let r = 6, g = 78, b = 59, a = 255; // #064e3b deep emerald

      if (distCorner > cornerRadius) {
        a = 0; // transparent outside rounded card
      } else {
        // Subtle emerald gradient
        const grad = (y / height) * 30;
        r = Math.min(255, 6 + grad * 0.4);
        g = Math.min(255, 78 + grad * 0.8);
        b = Math.min(255, 59 + grad * 0.6);

        // Gold Quran / Star Symbol in center
        // Center circle / book motif
        if (dist <= rOuter && dist >= rInner) {
          // Gold ring
          r = 251; g = 191; b = 36; // Amber-400 (#fbbf24)
        } else if (dist < rInner * 0.85) {
          // Book pages shape:
          // Two symmetric curved polygons for open Quran pages
          const nx = dx / (width * 0.3);
          const ny = dy / (height * 0.3);

          const inLeftPage = (nx >= -0.75 && nx <= -0.05 && ny >= -0.65 && ny <= 0.65);
          const inRightPage = (nx >= 0.05 && nx <= 0.75 && ny >= -0.65 && ny <= 0.65);

          if (inLeftPage || inRightPage) {
            // Gold fill with emerald lines
            r = 253; g = 230; b = 138; // Light amber #fde68a
            if (Math.abs(ny * 10 - Math.round(ny * 10)) < 0.15 && ny > -0.4 && ny < 0.4) {
              r = 6; g = 78; b = 59; // green text lines
            }
          } else if (Math.abs(dx) < width * 0.04 && Math.abs(dy) < height * 0.28) {
            // Book spine in gold
            r = 217; g = 119; b = 6; // Amber-600
          }
        }
      }

      rawData[pixelOffset] = Math.round(r);
      rawData[pixelOffset + 1] = Math.round(g);
      rawData[pixelOffset + 2] = Math.round(b);
      rawData[pixelOffset + 3] = Math.round(a);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(rawData, { level: 9 });

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", idat);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), generatePng(192));
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), generatePng(512));
console.log("Successfully generated PWA icons (192x192 and 512x512)!");
