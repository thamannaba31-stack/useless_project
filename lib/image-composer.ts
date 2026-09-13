import sharp, { type OverlayOptions } from "sharp";
import path from "path";
import fs from "fs";

const CANVAS_SIZE = 2048;
const PANEL_WIDTH = CANVAS_SIZE / 2; // 1024
const PANEL_HEIGHT = CANVAS_SIZE; // 2048
const DIVIDER_WIDTH = 4;

export interface ComposeOptions {
  originalImageBuffer: Buffer;
  reactionImagePath: string; // path relative to public/
  caption: string;
  // Photo pan/zoom offset - in pixels on the original image space
  photoOffsetX?: number;
  photoOffsetY?: number;
  photoZoom?: number; // scale factor, default 1.0
}

export interface ComposeResult {
  buffer: Buffer;
  mimeType: "image/png";
}

/**
 * Main entry: compose the split-screen meme.
 */
export async function composeMeme(
  options: ComposeOptions
): Promise<ComposeResult> {
  const {
    originalImageBuffer,
    reactionImagePath,
    caption,
    photoOffsetX = 0,
    photoOffsetY = 0,
    photoZoom = 1.0,
  } = options;

  // Resolve the reaction image from public/
  const publicDir = path.join(process.cwd(), "public");
  const reactionAbsPath = path.join(publicDir, reactionImagePath);

  if (!fs.existsSync(reactionAbsPath)) {
    throw new Error(`Reaction image not found: ${reactionAbsPath}`);
  }

  // Process left panel (reaction) and right panel (original photo) in parallel
  const [leftPanel, rightPanel] = await Promise.all([
    prepareReactionPanel(reactionAbsPath, caption),
    prepareOriginalPanel(
      originalImageBuffer,
      photoOffsetX,
      photoOffsetY,
      photoZoom
    ),
  ]);

  // Create a 2048×2048 canvas
  const canvas = sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 3,
      background: { r: 20, g: 20, b: 30 }, // dark background
    },
  });

  // Divider line
  const dividerSvg = `<svg width="${DIVIDER_WIDTH}" height="${CANVAS_SIZE}">
    <rect width="${DIVIDER_WIDTH}" height="${CANVAS_SIZE}" fill="#ffffff" opacity="0.25"/>
  </svg>`;
  const dividerBuffer = Buffer.from(dividerSvg);

  const result = await canvas
    .composite([
      { input: leftPanel, left: 0, top: 0 },
      { input: rightPanel, left: PANEL_WIDTH, top: 0 },
      {
        input: dividerBuffer,
        left: PANEL_WIDTH - DIVIDER_WIDTH / 2,
        top: 0,
      },
    ])
    .png({ quality: 90 })
    .toBuffer();

  return { buffer: result, mimeType: "image/png" };
}

/**
 * Prepare the LEFT panel: reaction image + caption overlay.
 */
async function prepareReactionPanel(
  reactionPath: string,
  caption: string
): Promise<Buffer> {
  // Get reaction image info
  const reactionMeta = await sharp(reactionPath).metadata();
  const origW = reactionMeta.width ?? 512;
  const origH = reactionMeta.height ?? 512;

  // The reaction image area (leaving space for caption at bottom)
  const captionAreaHeight = caption ? 220 : 0;
  const imageAreaHeight = PANEL_HEIGHT - captionAreaHeight;

  // Fit the reaction image into the image area with cover/contain
  const scale = Math.min(PANEL_WIDTH / origW, imageAreaHeight / origH);
  const scaledW = Math.round(origW * scale);
  const scaledH = Math.round(origH * scale);
  const offsetX = Math.round((PANEL_WIDTH - scaledW) / 2);
  const offsetY = Math.round((imageAreaHeight - scaledH) / 2);

  // Resize reaction image
  const resizedReaction = await sharp(reactionPath)
    .resize(scaledW, scaledH, { fit: "fill" })
    .png()
    .toBuffer();

  // Build panel: dark background
  const panelCanvas = sharp({
    create: {
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      channels: 4,
      background: { r: 20, g: 20, b: 30, alpha: 1 },
    },
  });

  const composites: OverlayOptions[] = [
    { input: resizedReaction, left: offsetX, top: offsetY },
  ];

  // Add caption if present
  if (caption) {
    const captionSvg = buildCaptionSvg(caption, PANEL_WIDTH, captionAreaHeight);
    composites.push({
      input: Buffer.from(captionSvg),
      left: 0,
      top: imageAreaHeight,
    });
  }

  return panelCanvas.composite(composites).png().toBuffer();
}

/**
 * Prepare the RIGHT panel: user's original photo.
 * Crops/fits it into a 1024×2048 area with cover behavior.
 * Supports pan and zoom via offsets.
 */
async function prepareOriginalPanel(
  originalBuffer: Buffer,
  offsetX: number,
  offsetY: number,
  zoom: number
): Promise<Buffer> {
  const meta = await sharp(originalBuffer).metadata();
  const origW = meta.width ?? 512;
  const origH = meta.height ?? 512;

  // Apply zoom: scale the image up so we can pan inside it
  const zoomFactor = Math.max(0.5, Math.min(zoom, 3.0));
  const scaledW = Math.round(origW * zoomFactor);
  const scaledH = Math.round(origH * zoomFactor);

  // Cover-fit the scaled image into the panel
  const coverScale = Math.max(PANEL_WIDTH / scaledW, PANEL_HEIGHT / scaledH);
  const coveredW = Math.round(scaledW * coverScale);
  const coveredH = Math.round(scaledH * coverScale);

  // Resize the original (cover)
  const resized = await sharp(originalBuffer)
    .resize(coveredW, coveredH, { fit: "fill" })
    .toBuffer();

  // Calculate crop with pan offset clamped
  const baseLeft = Math.round((coveredW - PANEL_WIDTH) / 2);
  const baseTop = Math.round((coveredH - PANEL_HEIGHT) / 2);

  const clampedLeft = Math.max(0, Math.min(coveredW - PANEL_WIDTH, baseLeft - offsetX));
  const clampedTop = Math.max(0, Math.min(coveredH - PANEL_HEIGHT, baseTop - offsetY));

  const cropped = await sharp(resized)
    .extract({
      left: clampedLeft,
      top: clampedTop,
      width: Math.min(PANEL_WIDTH, coveredW),
      height: Math.min(PANEL_HEIGHT, coveredH),
    })
    .resize(PANEL_WIDTH, PANEL_HEIGHT, { fit: "fill" })
    .png()
    .toBuffer();

  return cropped;
}

/**
 * Build an SVG for the Malayalam caption text at the bottom of the left panel.
 */
function buildCaptionSvg(
  caption: string,
  width: number,
  height: number
): string {
  // Split caption at newline
  const lines = caption.split("\n").slice(0, 2);
  const fontSize = 52;
  const lineHeight = 70;
  const totalTextHeight = lines.length * lineHeight;
  const startY = Math.round((height - totalTextHeight) / 2) + fontSize;

  const textElements = lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `<text
        x="50%"
        y="${y}"
        dominant-baseline="auto"
        text-anchor="middle"
        font-family="Noto Sans Malayalam, Arial Unicode MS, serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
        filter="url(#shadow)"
      >${escapeXml(line)}</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="rgba(0,0,0,0.6)" rx="0"/>
    ${textElements}
  </svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
