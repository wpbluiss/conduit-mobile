/**
 * Premium App Store Screenshot Generator
 * Generates 6 cinematic screenshots at 1284x2778px
 *
 * Usage: npm install canvas && node scripts/generate-screenshots.mjs
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'screenshots');
mkdirSync(OUT, { recursive: true });

// ── Dimensions ───────────────────────────────────────────────
const W = 1284;
const H = 2778;
const CX = W / 2;

// ── Colors ───────────────────────────────────────────────────
const COL = {
  bg1: '#030712',
  bg2: '#0a1628',
  card: '#1e293b',
  cardLight: '#253349',
  cyan: '#00D4FF',
  cyanDim: 'rgba(0,212,255,0.15)',
  cyanGlow: 'rgba(0,212,255,0.08)',
  white: '#FFFFFF',
  textSub: '#94a3b8',
  textDim: '#64748b',
  green: '#22c55e',
  greenDim: 'rgba(34,197,94,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',
  yellow: '#eab308',
  yellowDim: 'rgba(234,179,8,0.15)',
  purple: '#a855f7',
  purpleDim: 'rgba(168,85,247,0.15)',
  orange: '#f97316',
  orangeDim: 'rgba(249,115,22,0.15)',
};

// ── Helpers ──────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, fill) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r, stroke, lw = 1) {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function drawText(ctx, text, x, y, { font = '400 32px "Helvetica Neue", sans-serif', fill = COL.white, align = 'left', baseline = 'top' } = {}) {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function drawPill(ctx, x, y, text, bgColor, textColor, fontSize = 22) {
  ctx.font = `600 ${fontSize}px "Helvetica Neue", sans-serif`;
  const tw = ctx.measureText(text).width;
  const pw = tw + 24;
  const ph = fontSize + 16;
  fillRoundRect(ctx, x, y, pw, ph, ph / 2, bgColor);
  drawText(ctx, text, x + pw / 2, y + ph / 2, { font: `600 ${fontSize}px "Helvetica Neue", sans-serif`, fill: textColor, align: 'center', baseline: 'middle' });
  return pw;
}

// ── Background ───────────────────────────────────────────────

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, COL.bg1);
  grad.addColorStop(0.5, COL.bg2);
  grad.addColorStop(1, COL.bg1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow at top center
  const rg = ctx.createRadialGradient(CX, 300, 0, CX, 300, 700);
  rg.addColorStop(0, 'rgba(0,212,255,0.06)');
  rg.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, 1200);

  // Secondary glow behind phone area
  const rg2 = ctx.createRadialGradient(CX, 1500, 0, CX, 1500, 600);
  rg2.addColorStop(0, 'rgba(0,212,255,0.03)');
  rg2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg2;
  ctx.fillRect(0, 800, W, 1400);
}

// ── Headlines ────────────────────────────────────────────────

function drawHeadlines(ctx, line1, line2, sub) {
  // Glow behind headline
  const glow = ctx.createRadialGradient(CX, 280, 0, CX, 280, 400);
  glow.addColorStop(0, 'rgba(0,212,255,0.07)');
  glow.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 50, W, 500);

  drawText(ctx, line1, CX, 200, { font: '800 96px "Helvetica Neue", sans-serif', align: 'center' });
  drawText(ctx, line2, CX, 310, { font: '800 96px "Helvetica Neue", sans-serif', align: 'center' });
  drawText(ctx, sub, CX, 440, { font: '400 42px "Helvetica Neue", sans-serif', fill: COL.textSub, align: 'center' });
}

// ── Phone Frame ──────────────────────────────────────────────

const PHONE = { x: 142, y: 560, w: 1000, h: 1850, r: 55 };
const SCREEN = { x: PHONE.x + 12, y: PHONE.y + 12, w: PHONE.w - 24, h: PHONE.h - 24, r: 45 };

function drawPhoneFrame(ctx) {
  // Outer glow
  ctx.shadowColor = 'rgba(0,212,255,0.2)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;
  fillRoundRect(ctx, PHONE.x, PHONE.y, PHONE.w, PHONE.h, PHONE.r, '#0d1320');
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Phone border — gradient stroke
  const borderGrad = ctx.createLinearGradient(PHONE.x, PHONE.y, PHONE.x, PHONE.y + PHONE.h);
  borderGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
  borderGrad.addColorStop(0.5, 'rgba(0,212,255,0.3)');
  borderGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
  strokeRoundRect(ctx, PHONE.x, PHONE.y, PHONE.w, PHONE.h, PHONE.r, borderGrad, 2.5);

  // Screen area (clip will be applied per-screenshot)
  fillRoundRect(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r, COL.bg1);
}

function drawStatusBar(ctx) {
  const sy = SCREEN.y + 18;
  const sx = SCREEN.x;
  const sw = SCREEN.w;

  // Dynamic island
  fillRoundRect(ctx, sx + sw / 2 - 65, sy, 130, 36, 18, '#000000');

  // Time
  drawText(ctx, '9:41', sx + 38, sy + 6, { font: '600 28px "Helvetica Neue", sans-serif', fill: COL.white });

  // Signal bars
  const bx = sx + sw - 180;
  for (let i = 0; i < 4; i++) {
    const bh = 8 + i * 4;
    fillRoundRect(ctx, bx + i * 12, sy + 22 - bh, 8, bh, 2, COL.white);
  }

  // WiFi icon (simple arcs)
  const wx = sx + sw - 115;
  ctx.strokeStyle = COL.white;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(wx, sy + 24, 6 + i * 6, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }

  // Battery
  const batX = sx + sw - 72;
  strokeRoundRect(ctx, batX, sy + 8, 42, 18, 4, COL.white, 2);
  fillRoundRect(ctx, batX + 3, sy + 11, 32, 12, 2, COL.green);
  fillRoundRect(ctx, batX + 42, sy + 13, 3, 8, 1, COL.white);
}

// ── Bottom Branding ──────────────────────────────────────────

function drawBranding(ctx) {
  // Conduit AI glow
  const glow = ctx.createRadialGradient(CX, H - 180, 0, CX, H - 180, 200);
  glow.addColorStop(0, 'rgba(0,212,255,0.06)');
  glow.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(CX - 300, H - 300, 600, 250);

  drawText(ctx, 'Conduit AI', CX, H - 200, { font: '700 44px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'center' });
  drawText(ctx, 'conduitai.io', CX, H - 140, { font: '400 30px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'center' });
}

// ── Screen Content Renderers ─────────────────────────────────

function screenCoords() {
  // Content area inside phone screen, below status bar
  return {
    x: SCREEN.x + 30,
    y: SCREEN.y + 72,
    w: SCREEN.w - 60,
    maxH: SCREEN.h - 90,
  };
}

// Screenshot 1: Dashboard (Premium Card Design)
function drawDashboard(ctx) {
  const s = screenCoords();
  let cy = s.y + 20;

  // Header
  drawText(ctx, 'Good morning, Chris', s.x, cy, { font: '700 38px "Helvetica Neue", sans-serif' });
  drawText(ctx, 'Demo Mode', s.x, cy + 48, { font: '400 24px "Helvetica Neue", sans-serif', fill: COL.textDim });
  cy += 100;

  // Agent status card
  fillRoundRect(ctx, s.x, cy, s.w, 90, 18, COL.card);
  strokeRoundRect(ctx, s.x, cy, s.w, 90, 18, 'rgba(34,197,94,0.25)', 1);
  fillRoundRect(ctx, s.x + 22, cy + 32, 12, 12, 6, COL.green);
  drawText(ctx, 'AI Agent: Active', s.x + 46, cy + 24, { font: '600 28px "Helvetica Neue", sans-serif' });
  drawText(ctx, 'Answering calls 24/7', s.x + 46, cy + 58, { font: '400 22px "Helvetica Neue", sans-serif', fill: COL.textDim });
  drawPill(ctx, s.x + s.w - 110, cy + 28, 'LIVE', COL.greenDim, COL.green, 20);
  cy += 114;

  // 3 Stat cards with colored LEFT borders
  const gap = 16;
  const cardW = (s.w - gap * 2) / 3;
  const cardH = 140;
  const statCards = [
    { label: 'TODAY', value: '14', color: COL.cyan },
    { label: 'THIS MONTH', value: '87', color: COL.green },
    { label: 'CAPTURE', value: '94%', color: COL.yellow },
  ];

  statCards.forEach((sc, i) => {
    const cx = s.x + i * (cardW + gap);
    fillRoundRect(ctx, cx, cy, cardW, cardH, 16, COL.card);
    strokeRoundRect(ctx, cx, cy, cardW, cardH, 16, 'rgba(255,255,255,0.06)', 1);
    // 4px colored left border
    fillRoundRect(ctx, cx, cy + 8, 5, cardH - 16, 3, sc.color);
    drawText(ctx, sc.label, cx + 18, cy + 18, { font: '500 18px "Helvetica Neue", sans-serif', fill: '#9CA3AF' });
    drawText(ctx, sc.value, cx + 18, cy + 52, { font: '800 48px "Helvetica Neue", sans-serif' });
  });
  cy += cardH + 24;

  // Feature cards with colored icon circles
  const features = [
    { icon: '💳', title: 'Payments & Deposits', sub: '$5,280 collected', color: '#3B82F6' },
    { icon: '📅', title: 'Calendar & Bookings', sub: '12 this week', color: '#10B981' },
    { icon: '📈', title: 'Revenue Dashboard', sub: '$23,460 saved', color: COL.cyan },
    { icon: '⭐', title: 'Reviews & Reputation', sub: 'Manage reviews', color: '#F59E0B' },
  ];

  features.forEach((f) => {
    fillRoundRect(ctx, s.x, cy, s.w, 86, 16, '#0F172A');
    strokeRoundRect(ctx, s.x, cy, s.w, 86, 16, 'rgba(255,255,255,0.08)', 1);

    // 44px colored icon circle
    ctx.beginPath();
    ctx.arc(s.x + 48, cy + 43, 22, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    drawText(ctx, f.icon, s.x + 48, cy + 43, { font: '20px "Helvetica Neue"', align: 'center', baseline: 'middle' });

    drawText(ctx, f.title, s.x + 84, cy + 24, { font: '600 26px "Helvetica Neue", sans-serif' });
    drawText(ctx, f.sub, s.x + 84, cy + 56, { font: '400 22px "Helvetica Neue", sans-serif', fill: '#6B7280' });

    // Chevron
    drawText(ctx, '›', s.x + s.w - 26, cy + 38, { font: '400 32px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'center', baseline: 'middle' });
    cy += 98;
  });

  cy += 8;

  // Recent Activity section
  fillRoundRect(ctx, s.x + 2, cy + 2, 8, 8, 4, COL.cyan);
  drawText(ctx, 'Recent Activity', s.x + 18, cy, { font: '700 30px "Helvetica Neue", sans-serif' });
  drawText(ctx, 'View All', s.x + s.w, cy + 4, { font: '500 24px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'right' });
  cy += 48;

  const leads = [
    { name: 'Sarah Mitchell', sub: 'HVAC Repair', time: '2m ago', accent: COL.cyan, status: 'New' },
    { name: 'James Rodriguez', sub: 'Plumbing', time: '18m ago', accent: COL.yellow, status: 'Contacted' },
    { name: 'Emily Chen', sub: 'Electrical', time: '1h ago', accent: COL.green, status: 'Booked' },
  ];

  leads.forEach((lead) => {
    fillRoundRect(ctx, s.x, cy, s.w, 100, 16, COL.card);
    strokeRoundRect(ctx, s.x, cy, s.w, 100, 16, 'rgba(255,255,255,0.06)', 1);
    // 3px left border by status
    fillRoundRect(ctx, s.x, cy + 8, 4, 84, 2, lead.accent);

    // Avatar
    fillRoundRect(ctx, s.x + 18, cy + 18, 64, 64, 20, COL.cardLight);
    drawText(ctx, lead.name[0], s.x + 50, cy + 50, { font: '700 28px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'center', baseline: 'middle' });

    drawText(ctx, lead.name, s.x + 98, cy + 24, { font: '600 28px "Helvetica Neue", sans-serif' });
    drawText(ctx, lead.sub, s.x + 98, cy + 60, { font: '400 22px "Helvetica Neue", sans-serif', fill: '#9CA3AF' });
    drawText(ctx, lead.time, s.x + s.w - 20, cy + 66, { font: '400 20px "Helvetica Neue", sans-serif', fill: '#6B7280', align: 'right' });

    cy += 114;
  });
}

// Screenshot 2: AI Agent
function drawAIAgent(ctx) {
  const s = screenCoords();
  let cy = s.y + 20;

  drawText(ctx, 'AI Agent', s.x, cy, { font: '700 42px "Helvetica Neue", sans-serif' });
  drawPill(ctx, s.x + s.w - 100, cy - 4, 'LIVE', COL.greenDim, COL.green, 22);
  cy += 80;

  // Active call card
  fillRoundRect(ctx, s.x, cy, s.w, 280, 24, COL.card);

  // Pulsing ring indicator
  const ringX = s.x + s.w / 2;
  const ringY = cy + 80;
  for (let i = 3; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(ringX, ringY, 30 + i * 18, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,212,255,${0.04 + i * 0.02})`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(ringX, ringY, 30, 0, Math.PI * 2);
  ctx.fillStyle = COL.cyan;
  ctx.fill();

  // Phone icon in circle
  drawText(ctx, '📞', ringX, ringY, { font: '28px "Helvetica Neue"', align: 'center', baseline: 'middle' });

  drawText(ctx, 'AI is answering...', s.x + s.w / 2, cy + 150, { font: '600 32px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'center' });

  // Waveform
  const waveY = cy + 210;
  const waveX = s.x + 60;
  const bars = 40;
  const barWidth = (s.w - 120) / bars;
  for (let i = 0; i < bars; i++) {
    const h = 8 + Math.sin(i * 0.5) * 20 + Math.sin(i * 0.3 + 1) * 15 + Math.random() * 8;
    const alpha = 0.4 + Math.sin(i * 0.2) * 0.3;
    fillRoundRect(ctx, waveX + i * barWidth, waveY - h / 2, barWidth - 3, h, 2, `rgba(0,212,255,${alpha})`);
  }

  cy += 310;

  // Caller info
  fillRoundRect(ctx, s.x, cy, s.w, 200, 24, COL.card);
  fillRoundRect(ctx, s.x + 24, cy + 24, 80, 80, 40, COL.cardLight);
  drawText(ctx, 'D', s.x + 64, cy + 64, { font: '700 36px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'center', baseline: 'middle' });

  drawText(ctx, 'David Thompson', s.x + 124, cy + 36, { font: '600 32px "Helvetica Neue", sans-serif' });
  drawText(ctx, '(555) 234-8901', s.x + 124, cy + 78, { font: '400 26px "Helvetica Neue", sans-serif', fill: COL.textDim });
  drawPill(ctx, s.x + 124, cy + 116, 'HVAC Repair', COL.cyanDim, COL.cyan, 22);
  drawText(ctx, '2:34', s.x + s.w - 30, cy + 50, { font: '600 36px "Helvetica Neue", sans-serif', fill: COL.white, align: 'right' });
  drawText(ctx, 'duration', s.x + s.w - 30, cy + 90, { font: '400 22px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'right' });
  cy += 230;

  // AI Actions
  drawText(ctx, 'AI Actions', s.x, cy, { font: '700 30px "Helvetica Neue", sans-serif' });
  cy += 50;

  const actions = [
    { icon: '✓', text: 'Greeted caller professionally', color: COL.green },
    { icon: '✓', text: 'Collected service details', color: COL.green },
    { icon: '✓', text: 'Scheduled appointment', color: COL.green },
    { icon: '◉', text: 'Sending confirmation SMS...', color: COL.cyan },
  ];

  actions.forEach((a) => {
    fillRoundRect(ctx, s.x, cy, s.w, 70, 14, COL.card);
    drawText(ctx, a.icon, s.x + 30, cy + 35, { font: '600 24px "Helvetica Neue", sans-serif', fill: a.color, align: 'center', baseline: 'middle' });
    drawText(ctx, a.text, s.x + 60, cy + 35, { font: '400 26px "Helvetica Neue", sans-serif', fill: COL.textSub, baseline: 'middle' });
    cy += 82;
  });
}

// Screenshot 3: Lead Detail
function drawLeadDetail(ctx) {
  const s = screenCoords();
  let cy = s.y + 20;

  // Header with back arrow
  drawText(ctx, '← Lead Details', s.x, cy, { font: '700 42px "Helvetica Neue", sans-serif' });
  cy += 70;

  // Contact card
  fillRoundRect(ctx, s.x, cy, s.w, 210, 24, COL.card);
  fillRoundRect(ctx, s.x + 24, cy + 30, 86, 86, 43, COL.cardLight);
  drawText(ctx, 'SM', s.x + 67, cy + 73, { font: '700 32px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'center', baseline: 'middle' });

  drawText(ctx, 'Sarah Mitchell', s.x + 134, cy + 38, { font: '700 36px "Helvetica Neue", sans-serif' });
  drawText(ctx, '(555) 867-5309', s.x + 134, cy + 84, { font: '400 28px "Helvetica Neue", sans-serif', fill: COL.textDim });
  drawPill(ctx, s.x + 134, cy + 126, 'Booked', COL.greenDim, COL.green, 24);
  const pw = drawPill(ctx, s.x + 134, cy + 126, 'Booked', COL.greenDim, COL.green, 24);
  drawPill(ctx, s.x + 134 + pw + 12, cy + 126, 'HVAC Repair', COL.cyanDim, COL.cyan, 24);
  cy += 240;

  // Call recording card
  drawText(ctx, 'Call Recording', s.x, cy, { font: '700 30px "Helvetica Neue", sans-serif' });
  cy += 48;

  fillRoundRect(ctx, s.x, cy, s.w, 130, 20, COL.card);
  // Play button
  ctx.beginPath();
  ctx.arc(s.x + 60, cy + 65, 34, 0, Math.PI * 2);
  ctx.fillStyle = COL.cyan;
  ctx.fill();
  // Triangle
  ctx.beginPath();
  ctx.moveTo(s.x + 52, cy + 48);
  ctx.lineTo(s.x + 52, cy + 82);
  ctx.lineTo(s.x + 78, cy + 65);
  ctx.closePath();
  ctx.fillStyle = COL.white;
  ctx.fill();

  // Waveform
  const wvX = s.x + 115;
  const wvW = s.w - 200;
  for (let i = 0; i < 50; i++) {
    const bh = 6 + Math.abs(Math.sin(i * 0.4 + 0.5)) * 35;
    const played = i < 20;
    fillRoundRect(ctx, wvX + i * (wvW / 50), cy + 65 - bh / 2, (wvW / 50) - 2, bh, 2, played ? COL.cyan : 'rgba(0,212,255,0.2)');
  }
  drawText(ctx, '1:47 / 3:22', s.x + s.w - 24, cy + 98, { font: '400 22px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'right' });
  cy += 160;

  // Transcript
  drawText(ctx, 'Transcript', s.x, cy, { font: '700 30px "Helvetica Neue", sans-serif' });
  cy += 48;

  const transcript = [
    { speaker: 'AI Agent', text: 'Good afternoon! Thanks for calling Mitchell\'s HVAC. How can I help you today?', isAI: true },
    { speaker: 'Sarah', text: 'Hi, my AC unit stopped blowing cold air this morning. I need someone to come take a look.', isAI: false },
    { speaker: 'AI Agent', text: 'I\'m sorry to hear that. I can get a technician out to you. What\'s your address?', isAI: true },
    { speaker: 'Sarah', text: '742 Evergreen Terrace. Can someone come tomorrow morning?', isAI: false },
  ];

  transcript.forEach((t) => {
    const bubbleBg = t.isAI ? 'rgba(0,212,255,0.08)' : COL.card;
    const nameColor = t.isAI ? COL.cyan : COL.textSub;

    fillRoundRect(ctx, s.x, cy, s.w, 120, 16, bubbleBg);
    drawText(ctx, t.speaker, s.x + 20, cy + 16, { font: '600 22px "Helvetica Neue", sans-serif', fill: nameColor });
    // Wrap text manually (simple version)
    ctx.font = '400 24px "Helvetica Neue", sans-serif';
    const words = t.text.split(' ');
    let line = '';
    let lineY = cy + 50;
    words.forEach((w) => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > s.w - 44) {
        drawText(ctx, line.trim(), s.x + 20, lineY, { font: '400 24px "Helvetica Neue", sans-serif', fill: COL.textSub });
        line = w + ' ';
        lineY += 30;
      } else {
        line = test;
      }
    });
    drawText(ctx, line.trim(), s.x + 20, lineY, { font: '400 24px "Helvetica Neue", sans-serif', fill: COL.textSub });

    cy += 134;
  });
}

// Screenshot 4: Notification
function drawNotification(ctx) {
  const s = screenCoords();
  let cy = s.y + 20;

  drawText(ctx, 'Notifications', s.x, cy, { font: '700 42px "Helvetica Neue", sans-serif' });
  drawPill(ctx, s.x + s.w - 80, cy - 2, '12', COL.cyanDim, COL.cyan, 24);
  cy += 80;

  // Push notification banner at top
  fillRoundRect(ctx, s.x, cy, s.w, 150, 28, '#1a2744');
  strokeRoundRect(ctx, s.x, cy, s.w, 150, 28, 'rgba(0,212,255,0.2)', 1.5);

  // App icon
  fillRoundRect(ctx, s.x + 22, cy + 22, 50, 50, 12, COL.cyan);
  drawText(ctx, '⚡', s.x + 47, cy + 47, { font: '24px "Helvetica Neue"', align: 'center', baseline: 'middle' });

  drawText(ctx, 'Conduit AI', s.x + 86, cy + 30, { font: '600 24px "Helvetica Neue", sans-serif', fill: COL.cyan });
  drawText(ctx, 'now', s.x + s.w - 22, cy + 30, { font: '400 22px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'right' });
  drawText(ctx, 'New Lead: John Smith — HVAC Repair', s.x + 86, cy + 68, { font: '600 28px "Helvetica Neue", sans-serif' });
  drawText(ctx, 'AI booked an appointment for tomorrow 9AM', s.x + 86, cy + 106, { font: '400 24px "Helvetica Neue", sans-serif', fill: COL.textSub });

  cy += 186;

  // Today section
  drawText(ctx, 'Today', s.x, cy, { font: '600 28px "Helvetica Neue", sans-serif', fill: COL.textDim });
  cy += 48;

  const notifications = [
    { icon: '📞', title: 'New lead captured', desc: 'Maria Garcia — Plumbing Emergency', time: '12m ago', accent: COL.cyan },
    { icon: '📅', title: 'Appointment booked', desc: 'Robert Kim — Electrical Inspection, Wed 2PM', time: '34m ago', accent: COL.green },
    { icon: '📊', title: 'Weekly report ready', desc: '47 leads captured, 94% answer rate', time: '1h ago', accent: COL.purple },
    { icon: '⭐', title: 'New 5-star review', desc: '"Amazing service, the AI was so helpful!"', time: '2h ago', accent: COL.yellow },
    { icon: '💰', title: 'Payment received', desc: '$450.00 from Thompson HVAC job', time: '3h ago', accent: COL.green },
  ];

  notifications.forEach((n) => {
    fillRoundRect(ctx, s.x, cy, s.w, 120, 18, COL.card);

    // Icon circle
    ctx.beginPath();
    ctx.arc(s.x + 52, cy + 60, 32, 0, Math.PI * 2);
    ctx.fillStyle = `${n.accent}15`;
    ctx.fill();
    drawText(ctx, n.icon, s.x + 52, cy + 60, { font: '28px "Helvetica Neue"', align: 'center', baseline: 'middle' });

    drawText(ctx, n.title, s.x + 100, cy + 26, { font: '600 28px "Helvetica Neue", sans-serif' });
    drawText(ctx, n.desc, s.x + 100, cy + 66, { font: '400 24px "Helvetica Neue", sans-serif', fill: COL.textSub });
    drawText(ctx, n.time, s.x + s.w - 20, cy + 30, { font: '400 20px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'right' });

    // Accent left bar
    fillRoundRect(ctx, s.x + 4, cy + 20, 4, 80, 2, n.accent);

    cy += 134;
  });

  // Earlier section
  cy += 10;
  drawText(ctx, 'Earlier', s.x, cy, { font: '600 28px "Helvetica Neue", sans-serif', fill: COL.textDim });
  cy += 48;

  fillRoundRect(ctx, s.x, cy, s.w, 120, 18, COL.card);
  ctx.beginPath();
  ctx.arc(s.x + 52, cy + 60, 32, 0, Math.PI * 2);
  ctx.fillStyle = `${COL.orange}15`;
  ctx.fill();
  drawText(ctx, '🔔', s.x + 52, cy + 60, { font: '28px "Helvetica Neue"', align: 'center', baseline: 'middle' });
  drawText(ctx, 'Missed call recovered', s.x + 100, cy + 26, { font: '600 28px "Helvetica Neue", sans-serif' });
  drawText(ctx, 'AI called back and booked Lisa Park', s.x + 100, cy + 66, { font: '400 24px "Helvetica Neue", sans-serif', fill: COL.textSub });
  drawText(ctx, 'Yesterday', s.x + s.w - 20, cy + 30, { font: '400 20px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'right' });
  fillRoundRect(ctx, s.x + 4, cy + 20, 4, 80, 2, COL.orange);
}

// Screenshot 5: Analytics
function drawAnalytics(ctx) {
  const s = screenCoords();
  let cy = s.y + 20;

  drawText(ctx, 'Analytics', s.x, cy, { font: '700 42px "Helvetica Neue", sans-serif' });
  drawPill(ctx, s.x + s.w - 170, cy - 2, 'This Week', COL.cyanDim, COL.cyan, 22);
  cy += 80;

  // Revenue card
  fillRoundRect(ctx, s.x, cy, s.w, 200, 24, COL.card);
  drawText(ctx, 'Revenue', s.x + 28, cy + 24, { font: '500 26px "Helvetica Neue", sans-serif', fill: COL.textSub });
  drawText(ctx, '$12,400', s.x + 28, cy + 64, { font: '800 52px "Helvetica Neue", sans-serif' });
  drawPill(ctx, s.x + 280, cy + 72, '↑ 23%', COL.greenDim, COL.green, 22);
  drawText(ctx, 'vs last week', s.x + 410, cy + 80, { font: '400 22px "Helvetica Neue", sans-serif', fill: COL.textDim });

  // Revenue mini line chart
  const chartX = s.x + 28;
  const chartY = cy + 140;
  const chartW = s.w - 56;
  ctx.beginPath();
  ctx.strokeStyle = COL.cyan;
  ctx.lineWidth = 3;
  const revPts = [60, 45, 55, 35, 40, 20, 10];
  revPts.forEach((p, i) => {
    const px = chartX + (i / (revPts.length - 1)) * chartW;
    const py = chartY + p;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.stroke();
  // Gradient fill under line
  ctx.lineTo(chartX + chartW, chartY + 60);
  ctx.lineTo(chartX, chartY + 60);
  ctx.closePath();
  const lineGrad = ctx.createLinearGradient(0, chartY, 0, chartY + 60);
  lineGrad.addColorStop(0, 'rgba(0,212,255,0.15)');
  lineGrad.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = lineGrad;
  ctx.fill();

  cy += 230;

  // Weekly leads bar chart
  fillRoundRect(ctx, s.x, cy, s.w, 380, 24, COL.card);
  drawText(ctx, 'Weekly Leads', s.x + 28, cy + 24, { font: '600 28px "Helvetica Neue", sans-serif' });

  const barData = [
    { label: 'Mon', value: 5, max: 12 },
    { label: 'Tue', value: 8, max: 12 },
    { label: 'Wed', value: 6, max: 12 },
    { label: 'Thu', value: 11, max: 12 },
    { label: 'Fri', value: 9, max: 12 },
    { label: 'Sat', value: 4, max: 12 },
    { label: 'Sun', value: 3, max: 12 },
  ];

  const barAreaX = s.x + 40;
  const barAreaY = cy + 80;
  const barAreaH = 230;
  const barAreaW = s.w - 80;
  const barW = barAreaW / barData.length;

  // Grid lines
  for (let i = 0; i <= 3; i++) {
    const gy = barAreaY + (barAreaH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(barAreaX, gy);
    ctx.lineTo(barAreaX + barAreaW, gy);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  barData.forEach((d, i) => {
    const bx = barAreaX + i * barW + barW * 0.2;
    const bw = barW * 0.6;
    const bh = (d.value / d.max) * barAreaH;
    const isMax = d.value === Math.max(...barData.map(b => b.value));

    const barGrad = ctx.createLinearGradient(0, barAreaY + barAreaH - bh, 0, barAreaY + barAreaH);
    barGrad.addColorStop(0, isMax ? COL.cyan : 'rgba(0,212,255,0.5)');
    barGrad.addColorStop(1, isMax ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.15)');

    fillRoundRect(ctx, bx, barAreaY + barAreaH - bh, bw, bh, 8, barGrad);

    if (isMax) {
      drawText(ctx, String(d.value), bx + bw / 2, barAreaY + barAreaH - bh - 12, { font: '700 22px "Helvetica Neue", sans-serif', fill: COL.cyan, align: 'center', baseline: 'bottom' });
    }

    drawText(ctx, d.label, bx + bw / 2, barAreaY + barAreaH + 18, { font: '400 20px "Helvetica Neue", sans-serif', fill: COL.textDim, align: 'center' });
  });

  cy += 410;

  // Performance metrics row
  const mCardW = (s.w - 20) / 2;
  const mCardH = 150;

  fillRoundRect(ctx, s.x, cy, mCardW, mCardH, 20, COL.card);
  drawText(ctx, 'Avg Response', s.x + 20, cy + 20, { font: '500 22px "Helvetica Neue", sans-serif', fill: COL.textDim });
  drawText(ctx, '0.8s', s.x + 20, cy + 56, { font: '800 44px "Helvetica Neue", sans-serif', fill: COL.cyan });
  drawText(ctx, '↓ 15% faster', s.x + 20, cy + 112, { font: '500 22px "Helvetica Neue", sans-serif', fill: COL.green });

  fillRoundRect(ctx, s.x + mCardW + 20, cy, mCardW, mCardH, 20, COL.card);
  drawText(ctx, 'Satisfaction', s.x + mCardW + 40, cy + 20, { font: '500 22px "Helvetica Neue", sans-serif', fill: COL.textDim });
  drawText(ctx, '4.9/5', s.x + mCardW + 40, cy + 56, { font: '800 44px "Helvetica Neue", sans-serif', fill: COL.yellow });
  drawText(ctx, '⭐⭐⭐⭐⭐', s.x + mCardW + 40, cy + 110, { font: '22px "Helvetica Neue"' });

  cy += mCardH + 24;

  // Conversion funnel
  fillRoundRect(ctx, s.x, cy, s.w, 200, 20, COL.card);
  drawText(ctx, 'Conversion Funnel', s.x + 24, cy + 20, { font: '600 26px "Helvetica Neue", sans-serif' });

  const funnel = [
    { label: 'Calls', value: 156, pct: 1.0 },
    { label: 'Answered', value: 147, pct: 0.94 },
    { label: 'Qualified', value: 89, pct: 0.57 },
    { label: 'Booked', value: 47, pct: 0.30 },
  ];

  const funnelY = cy + 64;
  funnel.forEach((f, i) => {
    const fw = (s.w - 60) * f.pct;
    const fy = funnelY + i * 34;
    const alpha = 0.15 + (1 - i / funnel.length) * 0.25;
    fillRoundRect(ctx, s.x + 24, fy, fw, 26, 6, `rgba(0,212,255,${alpha})`);
    drawText(ctx, `${f.label}: ${f.value}`, s.x + 36, fy + 4, { font: '500 18px "Helvetica Neue", sans-serif', fill: COL.white });
  });
}

// Screenshot 6: Industries
function drawIndustries(ctx) {
  const s = screenCoords();
  let cy = s.y + 20;

  drawText(ctx, 'Industries', s.x, cy, { font: '700 42px "Helvetica Neue", sans-serif' });
  cy += 70;

  drawText(ctx, 'Trusted by 2,000+ businesses', s.x, cy, { font: '400 28px "Helvetica Neue", sans-serif', fill: COL.textSub });
  cy += 60;

  const industries = [
    { icon: '💈', name: 'Barber Shops', leads: '3.2k leads/mo', color: COL.cyan },
    { icon: '💇', name: 'Hair Salons', leads: '4.1k leads/mo', color: COL.purple },
    { icon: '❄️', name: 'HVAC', leads: '5.8k leads/mo', color: COL.cyan },
    { icon: '🔧', name: 'Plumbing', leads: '4.5k leads/mo', color: COL.green },
    { icon: '⚡', name: 'Electricians', leads: '3.9k leads/mo', color: COL.yellow },
    { icon: '🏠', name: 'Roofing', leads: '2.8k leads/mo', color: COL.orange },
    { icon: '🦷', name: 'Dental', leads: '3.6k leads/mo', color: COL.cyan },
    { icon: '🏋️', name: 'Fitness', leads: '2.4k leads/mo', color: COL.green },
    { icon: '🚗', name: 'Auto Repair', leads: '3.1k leads/mo', color: COL.red },
    { icon: '🌿', name: 'Landscaping', leads: '2.7k leads/mo', color: COL.green },
    { icon: '🧹', name: 'Cleaning', leads: '3.3k leads/mo', color: COL.purple },
    { icon: '🐾', name: 'Pet Services', leads: '1.9k leads/mo', color: COL.yellow },
  ];

  const cols = 2;
  const cardW = (s.w - 20) / cols;
  const cardH = 190;
  const gap = 20;

  industries.forEach((ind, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = s.x + col * (cardW + gap);
    const cardY = cy + row * (cardH + 16);

    fillRoundRect(ctx, cx, cardY, cardW, cardH, 22, COL.card);

    // Icon circle
    ctx.beginPath();
    ctx.arc(cx + 50, cardY + 56, 34, 0, Math.PI * 2);
    ctx.fillStyle = `${ind.color}15`;
    ctx.fill();
    drawText(ctx, ind.icon, cx + 50, cardY + 56, { font: '32px "Helvetica Neue"', align: 'center', baseline: 'middle' });

    drawText(ctx, ind.name, cx + 100, cardY + 36, { font: '600 28px "Helvetica Neue", sans-serif' });
    drawText(ctx, ind.leads, cx + 100, cardY + 74, { font: '400 22px "Helvetica Neue", sans-serif', fill: COL.textDim });

    // Small bar
    fillRoundRect(ctx, cx + 20, cardY + 130, cardW - 40, 8, 4, 'rgba(255,255,255,0.05)');
    const barPct = 0.4 + Math.random() * 0.5;
    const barGrad = ctx.createLinearGradient(cx + 20, 0, cx + 20 + (cardW - 40) * barPct, 0);
    barGrad.addColorStop(0, ind.color);
    barGrad.addColorStop(1, `${ind.color}66`);
    fillRoundRect(ctx, cx + 20, cardY + 130, (cardW - 40) * barPct, 8, 4, barGrad);

    // Active indicator
    fillRoundRect(ctx, cx + 20, cardY + 154, 8, 8, 4, COL.green);
    drawText(ctx, 'Active', cx + 36, cardY + 152, { font: '400 18px "Helvetica Neue", sans-serif', fill: COL.textDim });
  });
}

// ── Main render pipeline ─────────────────────────────────────

const SCREENSHOTS = [
  { file: 'screenshot-1.png', h1: 'Never Miss', h2: 'Another Lead', sub: 'AI captures every call, 24/7', render: drawDashboard },
  { file: 'screenshot-2.png', h1: 'Your AI', h2: 'Answers 24/7', sub: 'Professional voice agent for your business', render: drawAIAgent },
  { file: 'screenshot-3.png', h1: 'Every Call.', h2: 'Every Detail.', sub: 'Transcripts, recordings, and insights', render: drawLeadDetail },
  { file: 'screenshot-4.png', h1: 'Real-Time', h2: 'Notifications', sub: 'Know the moment a lead comes in', render: drawNotification },
  { file: 'screenshot-5.png', h1: 'Track Your', h2: 'Growth', sub: 'Analytics that drive decisions', render: drawAnalytics },
  { file: 'screenshot-6.png', h1: 'Works for', h2: 'Any Business', sub: 'From barbershops to contractors', render: drawIndustries },
];

// ── Google Play Feature Graphic (1024x500) ───────────────────

function generateFeatureGraphic() {
  const FW = 1024, FH = 500;
  const canvas = createCanvas(FW, FH);
  const ctx = canvas.getContext('2d');
  ctx.antialias = 'subpixel';

  // Dark gradient background
  const bg = ctx.createLinearGradient(0, 0, FW, FH);
  bg.addColorStop(0, '#030712');
  bg.addColorStop(0.5, '#0a1628');
  bg.addColorStop(1, '#030712');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, FW, FH);

  // Radial glow
  const rg = ctx.createRadialGradient(FW * 0.35, FH / 2, 0, FW * 0.35, FH / 2, 350);
  rg.addColorStop(0, 'rgba(0,212,255,0.12)');
  rg.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, FW, FH);

  // App name
  drawText(ctx, 'Conduit AI', 80, 140, { font: '800 72px "Helvetica Neue", sans-serif', fill: COL.white });
  drawText(ctx, 'Never miss another lead.', 80, 225, { font: '400 32px "Helvetica Neue", sans-serif', fill: COL.textSub });
  drawText(ctx, 'AI answers your calls 24/7.', 80, 268, { font: '400 32px "Helvetica Neue", sans-serif', fill: COL.textDim });

  // Cyan accent line
  fillRoundRect(ctx, 80, 320, 120, 4, 2, COL.cyan);

  // Stats badges
  const badges = [
    { text: '24/7 AI Agent', x: 80, color: COL.cyan },
    { text: 'Auto-Book', x: 260, color: COL.green },
    { text: 'Instant Alerts', x: 420, color: '#F59E0B' },
  ];
  badges.forEach((b) => {
    drawPill(ctx, b.x, 354, b.text, `${b.color}20`, b.color, 18);
  });

  // Mini phone mockup on right side
  const px = 680, py = 60, pw = 280, ph = 380, pr = 28;
  fillRoundRect(ctx, px, py, pw, ph, pr, '#0d1320');
  strokeRoundRect(ctx, px, py, pw, ph, pr, 'rgba(0,212,255,0.2)', 2);

  // Phone screen content
  fillRoundRect(ctx, px + 8, py + 8, pw - 16, ph - 16, pr - 4, COL.bg1);
  // Mini stat cards
  const mx = px + 22, my = py + 50;
  const mcw = (pw - 60) / 3, mch = 60;
  [COL.cyan, COL.green, COL.yellow].forEach((c, i) => {
    const mcx = mx + i * (mcw + 8);
    fillRoundRect(ctx, mcx, my, mcw, mch, 8, COL.card);
    fillRoundRect(ctx, mcx, my + 6, 3, mch - 12, 2, c);
  });
  // Mini lead rows
  for (let i = 0; i < 3; i++) {
    const ry = my + mch + 20 + i * 52;
    fillRoundRect(ctx, mx, ry, pw - 44, 44, 8, COL.card);
    fillRoundRect(ctx, mx, ry + 6, 3, 32, 2, [COL.cyan, COL.yellow, COL.green][i]);
  }

  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(OUT, 'feature-graphic.png'), buf);
  console.log(`  ✓ feature-graphic.png (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log('Generating premium App Store screenshots...\n');

  for (const shot of SCREENSHOTS) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Anti-aliasing
    ctx.antialias = 'subpixel';

    // 1. Background
    drawBackground(ctx);

    // 2. Headlines
    drawHeadlines(ctx, shot.h1, shot.h2, shot.sub);

    // 3. Phone frame
    drawPhoneFrame(ctx);

    // 4. Status bar
    drawStatusBar(ctx);

    // 5. Screen content (clipped to phone screen)
    ctx.save();
    roundRect(ctx, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r);
    ctx.clip();
    shot.render(ctx);
    ctx.restore();

    // 6. Re-draw phone border on top (so content doesn't overlap it)
    const borderGrad = ctx.createLinearGradient(PHONE.x, PHONE.y, PHONE.x, PHONE.y + PHONE.h);
    borderGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    borderGrad.addColorStop(0.5, 'rgba(0,212,255,0.3)');
    borderGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
    strokeRoundRect(ctx, PHONE.x, PHONE.y, PHONE.w, PHONE.h, PHONE.r, borderGrad, 2.5);

    // 7. Branding
    drawBranding(ctx);

    // Write PNG
    const buf = canvas.toBuffer('image/png');
    writeFileSync(join(OUT, shot.file), buf);
    console.log(`  ✓ ${shot.file} (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  // Google Play Feature Graphic
  generateFeatureGraphic();

  console.log(`\nDone — ${SCREENSHOTS.length} screenshots + feature graphic saved to screenshots/`);
}

main().catch(console.error);
