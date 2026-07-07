import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const SRC = join(REPO, "src");
const OUTPUT = join(REPO, "output");
const CONFIG = join(REPO, "characters.json");
const FONT_PATH = join(REPO, "stickers-maker", "src", "fonts", "ShangShouFangTangTi.woff2");

GlobalFonts.registerFromPath(FONT_PATH, "SSFangTangTi");

const CANVAS_W = 296;
const CANVAS_H = 256;
const FONT_FAMILY = "SSFangTangTi, Microsoft YaHei, SimHei, sans-serif";
const PAD = 20;
const MAX_FONT = 40;
const MIN_FONT = 8;
const GAP_RATIO = 0.18;
const STROKE_RATIO = 0.15;
const COL_GAP_RATIO = 0.25;

interface CharFeature {
  arrangement: string; textBehind: boolean; splitSide?: boolean;
  x: number; y: number; rotation: number;
}
interface Config {
  role_meta: Record<string, { cn: string; color: string }>;
  font: string; characters: Record<string, CharFeature>;
}
type Layout = { fontSize: number; step: number; colGap: number; columns: string[][] };

const config: Config = JSON.parse(readFileSync(CONFIG, "utf-8"));
const features = config.characters;
const COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(config.role_meta).map(([k, v]) => [k, v.color])
);

// ── Layout: max 2 columns ─────────────────────────────────────────────────
function calcLayout(ctx: any, text: string): Layout {
  const maxH = CANVAS_H - PAD * 2;
  const maxW = CANVAS_W - PAD * 2;
  const chars = Array.from(text);
  const total = chars.length;

  for (let fs = MAX_FONT; fs >= MIN_FONT; fs -= 2) {
    const step = Math.round(fs * (1 + GAP_RATIO));
    const colGap = Math.round(fs * COL_GAP_RATIO);
    ctx.font = `bold ${fs}px ${FONT_FAMILY}`;

    // Single column
    if ((total - 1) * step <= maxH) {
      return { fontSize: fs, step, colGap, columns: [chars] };
    }
    // Max 2 columns
    const perCol = Math.floor(maxH / step);
    if (perCol < 1) continue;
    const numCols = Math.min(2, Math.ceil(total / perCol));
    if (numCols * step + (numCols - 1) * colGap <= maxW) {
      const cols: string[][] = [];
      const n = Math.ceil(total / numCols);
      for (let i = 0; i < total; i += n) cols.push(chars.slice(i, i + n));
      return { fontSize: fs, step, colGap, columns: cols };
    }
  }

  // Force 2 cols at min font
  const fs = MIN_FONT;
  const step = Math.round(fs * (1 + GAP_RATIO));
  const colGap = Math.round(fs * COL_GAP_RATIO);
  const n = Math.ceil(total / 2);
  const cols: string[][] = [];
  for (let i = 0; i < total; i += n) cols.push(chars.slice(i, i + n));
  ctx.font = `bold ${fs}px ${FONT_FAMILY}`;
  return { fontSize: fs, step, colGap, columns: cols };
}

// ── Draw a single column centred at origin ────────────────────────────────
function renderCol(ctx: any, col: string[], fontSize: number, step: number, color: string): void {
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * STROKE_RATIO));
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const totalH = (col.length - 1) * step;
  let charY = -totalH / 2;
  for (const ch of col) {
    ctx.strokeText(ch, 0, charY);
    ctx.fillText(ch, 0, charY);
    charY += step;
  }
}

// ── Normal multi-column (left-anchored) ───────────────────────────────────
function renderText(ctx: any, layout: Layout, color: string): void {
  const { fontSize, step, colGap, columns } = layout;
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * STROKE_RATIO));
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let colX = 0;
  for (const col of columns) {
    const totalH = (col.length - 1) * step;
    let charY = -totalH / 2;
    for (const ch of col) {
      ctx.strokeText(ch, colX, charY);
      ctx.fillText(ch, colX, charY);
      charY += step;
    }
    colX += step + colGap;
  }
}

// ── Render helper for a single text pass (handles splitSide) ─────────────
function renderPass(ctx: any, layout: Layout, feat: CharFeature, cx: number, cy: number, color: string): void {
  if (feat.splitSide && layout.columns.length === 2) {
    // Col 0 at given coordinate with given rotation
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((feat.rotation * Math.PI) / 180);
    renderCol(ctx, layout.columns[0], layout.fontSize, layout.step, color);
    ctx.restore();

    // Col 1 at mirror position with opposite rotation
    const mx = CANVAS_W - cx;
    const my = CANVAS_H - cy;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate((-feat.rotation * Math.PI) / 180);
    renderCol(ctx, layout.columns[1], layout.fontSize, layout.step, color);
    ctx.restore();
  } else {
    // Normal left-anchored rendering
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((feat.rotation * Math.PI) / 180);
    renderText(ctx, layout, color);
    ctx.restore();
  }
}

// ── Process one /roleN text ───────────────────────────────────────────────
async function processInput(input: string): Promise<void> {
  const m = input.match(/^\/([a-z]+)(\d+)\s+(.+)$/);
  if (!m) throw new Error(`Invalid: "${input}"`);
  const role = m[1], idx = m[2], text = m[3];
  if ([...text].length > 10) throw new Error(`Text too long: ${[...text].length} > 10`);

  const key = `${role}${idx}`;
  const feat = features[key];
  if (!feat) throw new Error(`No feature: ${key}`);

  const imgPath = join(SRC, role, `${key}.png`);
  if (!existsSync(imgPath)) throw new Error(`Image not found: ${imgPath}`);
  const img = await loadImage(imgPath);
  const color = COLORS[role] || "#ffffff";

  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext("2d");
  const layout = calcLayout(ctx, text);

  // Clamp
  const maxColLen = Math.max(...layout.columns.map(c => c.length));
  const blockH = (maxColLen - 1) * layout.step;
  const halfStep = layout.step / 2;
  let cx = feat.x, cy = feat.y;
  const ox = cx, oy = cy;
  const useSplit = feat.splitSide && layout.columns.length === 2;

  if (useSplit) {
    cx = Math.max(PAD + halfStep, Math.min(CANVAS_W - PAD - halfStep, cx));
    cy = Math.max(PAD + blockH / 2, Math.min(CANVAS_H - PAD - blockH / 2, cy));
  } else {
    cx = Math.max(PAD + halfStep, Math.min(CANVAS_W - PAD - halfStep - (layout.columns.length - 1) * (layout.step + layout.colGap), cx));
    cy = Math.max(PAD + blockH / 2, Math.min(CANVAS_H - PAD - blockH / 2, cy));
  }
  if (cx !== ox || cy !== oy) {
    console.log(`  \u26a0 clamped (${ox},${oy}) \u2192 (${cx},${cy})`);
  }

  ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);

  if (feat.textBehind) {
    renderPass(ctx, layout, feat, cx, cy, color);
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  }
  renderPass(ctx, layout, feat, cx, cy, color);

  const buf = canvas.toBuffer("image/png");
  writeFileSync(join(OUTPUT, `${key}.png`), buf);
  const meta = config.role_meta[role];
  const mode = useSplit ? " split" : "";
  const colInfo = layout.columns.length > 1 ? ` ${layout.columns.length}cols${mode}` : "";
  console.log(`\u2713 ${key}.png  ${meta.cn}  ${layout.fontSize}px${colInfo}`);
}

// ── Output helpers ─────────────────────────────────────────────────────────
function clearOutput(): void {
  if (existsSync(OUTPUT)) {
    for (const f of readdirSync(OUTPUT)) rmSync(join(OUTPUT, f));
  } else {
    mkdirSync(OUTPUT, { recursive: true });
  }
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2);
  if (raw.length === 0) {
    console.log("用法: node cli/dist/index.js /anon1 文本 /tmr2 文本 ...");
    process.exit(1);
  }
  const inputs: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (/^\/[a-z]+\d+$/.test(raw[i]) && i + 1 < raw.length) {
      inputs.push(raw[i] + " " + raw[i + 1]);
      i++;
    } else {
      inputs.push(raw[i]);
    }
  }
  clearOutput();
  for (const input of inputs) {
    try { await processInput(input); }
    catch (e: any) { console.error(`\u2717 ${e.message}`); }
  }
}
main();