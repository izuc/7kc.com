/**
 * Client-side photo tiling for the pantry/fridge AI scan. A vision model downscales
 * its input, so on a dense shelf small items get lost. Cutting the photo into an N×N
 * grid (with a little overlap so boundary items aren't split) and reading each tile
 * "up close" improves recall. N comes from the operator's AI_SCAN_TILES (via /config).
 */

const OVERLAP = 0.1; // 10% on each cut edge so an item straddling a boundary survives

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image.'));
    img.src = url;
  });
}

/** Draw a source region to a canvas, scaled so its longest edge ≤ maxEdge, as a JPEG data URL. */
function regionToDataUrl(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  maxEdge: number,
): string {
  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const cv = document.createElement('canvas');
  cv.width = dw;
  cv.height = dh;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('Canvas not available.');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  return cv.toDataURL('image/jpeg', 0.85);
}

/**
 * Cut `file` into `n`×`n` overlapping tiles (n=1 → the whole image, downscaled).
 * @returns an array of base64 JPEG data URLs to POST to /ingredients/scan-pantry.
 */
export async function tileImage(file: Blob, n: number, maxEdge = 1280): Promise<string[]> {
  const grid = Math.max(1, Math.min(4, Math.floor(n) || 1));
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;
    if (grid <= 1) return [regionToDataUrl(img, 0, 0, W, H, maxEdge)];

    const out: string[] = [];
    const cw = W / grid;
    const ch = H / grid;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const x0 = Math.max(0, c * cw - cw * OVERLAP);
        const y0 = Math.max(0, r * ch - ch * OVERLAP);
        const x1 = Math.min(W, (c + 1) * cw + cw * OVERLAP);
        const y1 = Math.min(H, (r + 1) * ch + ch * OVERLAP);
        out.push(regionToDataUrl(img, x0, y0, x1 - x0, y1 - y0, maxEdge));
      }
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
