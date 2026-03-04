import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'assets');

// ── Colors ───────────────────────────────────────────────────

const BG_PRIMARY = '#0a0f1e';
const BG_VOID = '#030712';
const ELECTRIC = '#0EA5E9';
const BLUE = '#3B82F6';

// ── Lightning Bolt Path ──────────────────────────────────────
// Clean geometric bolt designed on a 100x100 viewBox

function boltPath(offsetX = 0, offsetY = 0, scale = 1) {
  // Geometric lightning bolt: top-left slant → notch → bottom-right point
  const points = [
    [42, 8],   // top-left of upper section
    [22, 52],  // left middle notch
    [44, 52],  // right of notch
    [36, 92],  // bottom-left tip approach
    [78, 40],  // right side strike point
    [56, 40],  // left of upper return
    [66, 8],   // back to top-right
  ];

  const scaled = points.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY]);
  return `M${scaled.map(([x, y]) => `${x},${y}`).join(' L')} Z`;
}

// ── Generate App Icon (1024x1024) ────────────────────────────

async function generateIcon() {
  const size = 1024;
  const cornerRadius = 224; // iOS-style rounded square
  const boltScale = 7.5;
  const boltOffsetX = (size - 100 * boltScale) / 2;
  const boltOffsetY = (size - 100 * boltScale) / 2 - 10;

  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1429"/>
      <stop offset="100%" stop-color="${BG_PRIMARY}"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${ELECTRIC}"/>
      <stop offset="100%" stop-color="${BLUE}"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="35"/>
    </filter>
    <clipPath id="roundedSquare">
      <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
    </clipPath>
  </defs>

  <g clip-path="url(#roundedSquare)">
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>

    <!-- Subtle radial glow behind bolt -->
    <ellipse cx="${size / 2}" cy="${size / 2}" rx="320" ry="320" fill="${ELECTRIC}" opacity="0.08"/>
    <ellipse cx="${size / 2}" cy="${size / 2}" rx="200" ry="200" fill="${ELECTRIC}" opacity="0.06"/>

    <!-- Glow layer -->
    <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="${ELECTRIC}" opacity="0.4" filter="url(#glow)"/>

    <!-- Main bolt -->
    <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="url(#boltGrad)"/>

    <!-- Highlight edge on bolt -->
    <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="white" opacity="0.1"/>
  </g>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(ASSETS, 'icon.png'));
  console.log('Generated: assets/icon.png (1024x1024)');
}

// ── Generate Adaptive Icon Foreground (1024x1024 with safe zone padding) ──

async function generateAdaptiveIcon() {
  const size = 1024;
  // Android adaptive icons: content should be within the center 66% (safe zone)
  // So scale the bolt to fit within ~676px centered area
  const boltScale = 5.0;
  const boltOffsetX = (size - 100 * boltScale) / 2;
  const boltOffsetY = (size - 100 * boltScale) / 2 - 8;

  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="boltGrad" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${ELECTRIC}"/>
      <stop offset="100%" stop-color="${BLUE}"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="25"/>
    </filter>
  </defs>

  <!-- Transparent background - adaptive icon uses separate background layer -->
  <rect width="${size}" height="${size}" fill="transparent"/>

  <!-- Subtle glow -->
  <ellipse cx="${size / 2}" cy="${size / 2}" rx="220" ry="220" fill="${ELECTRIC}" opacity="0.1"/>

  <!-- Glow layer -->
  <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="${ELECTRIC}" opacity="0.35" filter="url(#glow)"/>

  <!-- Main bolt -->
  <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="url(#boltGrad)"/>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(ASSETS, 'adaptive-icon.png'));
  console.log('Generated: assets/adaptive-icon.png (1024x1024)');
}

// ── Generate Splash Screen (1284x2778) ───────────────────────

async function generateSplash() {
  const width = 1284;
  const height = 2778;
  const centerX = width / 2;
  const centerY = height / 2 - 80; // Slightly above center for logo + text

  const boltScale = 4.2;
  const boltOffsetX = centerX - (100 * boltScale) / 2;
  const boltOffsetY = centerY - (100 * boltScale) / 2 - 40;

  const textY = centerY + (100 * boltScale) / 2 - 10;

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${BG_VOID}"/>
      <stop offset="50%" stop-color="${BG_VOID}"/>
      <stop offset="100%" stop-color="#050a18"/>
    </linearGradient>
    <linearGradient id="boltGrad" x1="0.3" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="${ELECTRIC}"/>
      <stop offset="100%" stop-color="${BLUE}"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
    <filter id="glowLarge" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="60"/>
    </filter>
    <filter id="glowSmall" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

  <!-- Large ambient glow -->
  <ellipse cx="${centerX}" cy="${centerY}" rx="400" ry="500" fill="${ELECTRIC}" opacity="0.04" filter="url(#glowLarge)"/>

  <!-- Medium glow ring -->
  <ellipse cx="${centerX}" cy="${centerY - 20}" rx="250" ry="280" fill="${ELECTRIC}" opacity="0.06"/>

  <!-- Bolt glow -->
  <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="${ELECTRIC}" opacity="0.3" filter="url(#glowSmall)"/>

  <!-- Main bolt -->
  <path d="${boltPath(boltOffsetX, boltOffsetY, boltScale)}" fill="url(#boltGrad)"/>

  <!-- "Conduit" text -->
  <text
    x="${centerX}"
    y="${textY}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-weight="700"
    font-size="72"
    fill="url(#textGrad)"
    letter-spacing="4"
  >CONDUIT</text>

  <!-- "AI" subtitle -->
  <text
    x="${centerX}"
    y="${textY + 50}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-weight="500"
    font-size="28"
    fill="${ELECTRIC}"
    letter-spacing="8"
    opacity="0.8"
  >AI</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(join(ASSETS, 'splash.png'));
  console.log('Generated: assets/splash.png (1284x2778)');
}

// ── Run ──────────────────────────────────────────────────────

async function main() {
  console.log('Generating Conduit AI app assets...\n');
  await generateIcon();
  await generateAdaptiveIcon();
  await generateSplash();
  console.log('\nAll assets generated successfully.');
}

main().catch(console.error);
