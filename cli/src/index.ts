import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const SRC = join(REPO, "src");
const OUTPUT = join(REPO, "output");
const CONFIG = join(REPO, "characters.json");
const FONT_PATH = join(REPO, "image-editor", "src", "fonts", "ShangShouFangTangTi.woff2");

GlobalFonts.registerFromPath(FONT_PATH, "SSFangTangTi");

const CANVAS_W = 296;
const CANVAS_H = 296;
const FONT_FAMILY = "SSFangTangTi, Microsoft YaHei, SimHei, sans-serif";
const PAD = 20;
const MAX_FONT = 40;
const MIN_FONT = 25;
const GAP_RATIO = 0.18;
const STROKE_RATIO = 0.15;

interface CharFeature {
  arrangement: string; textBehind: boolean; splitSide?: boolean;
  x: number; y: number; rotation: number;
}
interface Config {
  role_meta: Record<string, { cn: string; color: string }>;
  font: string; characters: Record<string, CharFeature>;
}
type Layout = {
  fontSize: number;
  charStep: number;        // vertical spacing between chars (font-based)
  colStep: number;         // horizontal column advancement
  colGap: number;          // horizontal gap between columns
  columns: string[][];
};

const config: Config = JSON.parse(readFileSync(CONFIG, "utf-8"));
const features = config.characters;
const COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(config.role_meta).map(([k, v]) => [k, v.color])
);

// Reference colStep at 40px �� only used for splitSide=true mode.
const REF_COL_STEP = Math.round(MAX_FONT * (1 + GAP_RATIO));
const MAX_COL_GAP = 5;

// ---- Layout ---------------------------------------------------------------
function calcLayout(ctx: any, text: string, splitSide: boolean): Layout {
  const maxH = CANVAS_H - PAD * 2;
  const chars = Array.from(text);
  const total = chars.length;
  const maxCols = splitSide ? 2 : 3;

  for (let fs = MAX_FONT; fs >= MIN_FONT; fs -= 2) {
    const charStep = Math.round(fs * (1 + GAP_RATIO));
    // splitSide=true: REF colStep; splitSide=false: font-based colStep
    const colStep = splitSide ? REF_COL_STEP : charStep;
    ctx.font = `bold ${fs}px ${FONT_FAMILY}`;

    if ((total - 1) * charStep <= maxH) {
      return { fontSize: fs, charStep, colStep, colGap: MAX_COL_GAP, columns: [chars] };
    }
  }

  const fs = MIN_FONT;
  const charStep = Math.round(fs * (1 + GAP_RATIO));
  const colStep = splitSide ? REF_COL_STEP : charStep;
  ctx.font = `bold ${fs}px ${FONT_FAMILY}`;

  for (let numCols = 2; numCols <= maxCols; numCols++) {
    const perCol = Math.ceil(total / numCols);
    if ((perCol - 1) * charStep <= maxH) {
      const cols: string[][] = [];
      for (let i = 0; i < total; i += perCol) cols.push(chars.slice(i, i + perCol));
      return { fontSize: fs, charStep, colStep, colGap: MAX_COL_GAP, columns: cols };
    }
  }

  const perCol = Math.ceil(total / maxCols);
  const cols: string[][] = [];
  for (let i = 0; i < total; i += perCol) cols.push(chars.slice(i, i + perCol));
  return { fontSize: fs, charStep, colStep, colGap: MAX_COL_GAP, columns: cols };
}

// ---- Draw a single column centred at origin ------------------------------
function renderCol(
  ctx: any, col: string[], fontSize: number, charStep: number, color: string
): void {
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * STROKE_RATIO));
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const totalH = (col.length - 1) * charStep;
  let charY = -totalH / 2;
  for (const ch of col) {
    ctx.strokeText(ch, 0, charY);
    ctx.fillText(ch, 0, charY);
    charY += charStep;
  }
}

// ---- Normal multi-column (left-anchored) ----------------------------------
function renderText(ctx: any, layout: Layout, color: string): void {
  const { fontSize, charStep, colStep, colGap, columns } = layout;
  ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * STROKE_RATIO));
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let colX = 0;
  for (const col of columns) {
    const totalH = (col.length - 1) * charStep;
    let charY = -totalH / 2;
    for (const ch of col) {
      ctx.strokeText(ch, colX, charY);
      ctx.fillText(ch, colX, charY);
      charY += charStep;
    }
    colX += colStep + colGap;
  }
}

// ---- Render helper for a single text pass (handles splitSide) -------------
function renderPass(
  ctx: any, layout: Layout, feat: CharFeature,
  cx: number, cy: number, color: string
): void {
  if (feat.splitSide && layout.columns.length > 1) {
    const half = Math.ceil(layout.columns.length / 2);
    const left = layout.columns.slice(0, half);
    const right = layout.columns.slice(half);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((feat.rotation * Math.PI) / 180);
    renderText(ctx, { ...layout, columns: left }, color);
    ctx.restore();

    const mx = CANVAS_W - cx;
    const my = CANVAS_H - cy;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate((-feat.rotation * Math.PI) / 180);
    renderText(ctx, { ...layout, columns: right }, color);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((feat.rotation * Math.PI) / 180);
    renderText(ctx, layout, color);
    ctx.restore();
  }
}

// ---- Process one /roleN text ----------------------------------------------
async function processInput(input: string): Promise<void> {
  const m = input.match(/^\/([a-z]+)(\d+)\s+(.+)$/);
  if (!m) throw new Error(`Invalid: "${input}"`);
  const role = m[1], idx = m[2], text = m[3];
  if ([...text].length > 20) throw new Error(`Text too long: ${[...text].length} > 20`);

  const key = `${role}${idx}`;
  const feat = features[key];
  if (!feat) throw new Error(`No feature: ${key}`);

  const imgPath = join(SRC, role, `${key}.png`);
  if (!existsSync(imgPath)) throw new Error(`Image not found: ${imgPath}`);
  const img = await loadImage(imgPath);
  const color = COLORS[role] || "#ffffff";

  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext("2d");
  const layout = calcLayout(ctx, text, feat.splitSide ?? false);

  const maxColLen = Math.max(...layout.columns.map(c => c.length));
  const blockH = (maxColLen - 1) * layout.charStep;
  const halfColStep = layout.colStep / 2;
  let cx = feat.x, cy = feat.y;
  const ox = cx, oy = cy;
  const useSplit = feat.splitSide && layout.columns.length >= 2;

  if (useSplit) {
    cx = Math.max(PAD + halfColStep, Math.min(CANVAS_W - PAD - halfColStep, cx));
    cy = Math.max(PAD + blockH / 2, Math.min(CANVAS_H - PAD - blockH / 2, cy));
  } else {
    const totalWidth = (layout.columns.length - 1) * (layout.colStep + layout.colGap);
    cx = Math.max(PAD + halfColStep, Math.min(CANVAS_W - PAD - halfColStep - totalWidth, cx));
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

// ---- Output helpers -------------------------------------------------------
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
