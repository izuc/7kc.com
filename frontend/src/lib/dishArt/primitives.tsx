import { ReactNode } from 'react';
import { INK, PLATE_FACE, PLATE_RIM, SW } from './tokens';
import { Tones } from './palette';
import { rngFor } from './seed';

/**
 * Vessel + finish building blocks for dish templates. All coordinates live in
 * the 400×400 viewBox. Every vessel draws its own soft shadow so dishes sit on
 * the card instead of floating.
 */

/** The three-layer card background: wash, halo disc. Identical on every card. */
export function CardWash({ tones }: { tones: Tones }) {
  return (
    <>
      <rect width="400" height="400" fill={tones.bg} />
      <circle cx="200" cy="200" r="178" fill={tones.halo} />
    </>
  );
}

/** Top-down dinner plate: shadow, cream face, inner rim ring. */
export function TopPlate({ tones, cx = 200, cy = 202, r = 150 }: { tones: Tones; cx?: number; cy?: number; r?: number }) {
  return (
    <>
      <circle cx={cx + 6} cy={cy + 10} r={r} fill={tones.shadow} />
      <circle cx={cx} cy={cy} r={r} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke={PLATE_RIM} strokeWidth={5} />
    </>
  );
}

/** Top-down bowl: plate shell + a full food disc (fill it with the base colour). */
export function TopBowl({
  tones, cx = 200, cy = 202, r = 150, foodR = 112, foodFill,
}: { tones: Tones; cx?: number; cy?: number; r?: number; foodR?: number; foodFill: string }) {
  return (
    <>
      <circle cx={cx + 6} cy={cy + 10} r={r} fill={tones.shadow} />
      <circle cx={cx} cy={cy} r={r} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      <circle cx={cx} cy={cy} r={foodR} fill={foodFill} stroke={INK} strokeWidth={SW.macro} />
    </>
  );
}

/** Side-view plate (ellipse) for stacked/handheld foods sitting on it. */
export function SidePlate({ tones, cx = 200, cy = 296, rx = 148, ry = 30 }: { tones: Tones; cx?: number; cy?: number; rx?: number; ry?: number }) {
  return (
    <>
      <ellipse cx={cx + 5} cy={cy + 8} rx={rx} ry={ry} fill={tones.shadow} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      <ellipse cx={cx} cy={cy - 3} rx={rx * 0.8} ry={ry * 0.55} fill="none" stroke={PLATE_RIM} strokeWidth={4} />
    </>
  );
}

/** Top-down cast-iron pan with a handle (shakshuka, gambas, paella…). */
export function PanIron({ tones, cx = 190, cy = 202, r = 138, handleAngle = 0 }: { tones: Tones; cx?: number; cy?: number; r?: number; handleAngle?: number }) {
  return (
    <g transform={handleAngle ? `rotate(${handleAngle} ${cx} ${cy})` : undefined}>
      <circle cx={cx + 6} cy={cy + 10} r={r} fill={tones.shadow} />
      <rect x={cx + r - 8} y={cy - 16} width={70} height={32} rx={12} fill="#4a3527" stroke={INK} strokeWidth={SW.macro} />
      <rect x={cx + r + 26} y={cy - 6} width={22} height={12} rx={6} fill={PLATE_FACE} stroke={INK} strokeWidth={3.5} />
      <circle cx={cx} cy={cy} r={r} fill="#4a3527" stroke={INK} strokeWidth={SW.macro} />
      <circle cx={cx} cy={cy} r={r - 16} fill="#39281c" stroke={INK} strokeWidth={3} />
    </g>
  );
}

/** Top-down wooden board (pizza, bread, boards). */
export function BoardRound({ tones, cx = 200, cy = 204, r = 154 }: { tones: Tones; cx?: number; cy?: number; r?: number }) {
  return (
    <>
      <circle cx={cx + 6} cy={cy + 10} r={r} fill={tones.shadow} />
      <circle cx={cx} cy={cy} r={r} fill="#e0b174" stroke={INK} strokeWidth={SW.macro} />
      <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke="#c99a5c" strokeWidth={3} />
    </>
  );
}

/** Top-down rectangular baking dish with handle tabs (bakes, crumbles, lasagna). */
export function BakingDishTop({
  tones, x = 52, y = 82, w = 296, h = 240, fill = '#b9552e',
}: { tones: Tones; x?: number; y?: number; w?: number; h?: number; fill?: string }) {
  const cy = y + h / 2;
  return (
    <>
      <rect x={x + 6} y={y + 10} width={w} height={h} rx={26} fill={tones.shadow} />
      <ellipse cx={x - 6} cy={cy} rx={18} ry={34} fill={fill} stroke={INK} strokeWidth={SW.macro} />
      <ellipse cx={x + w + 6} cy={cy} rx={18} ry={34} fill={fill} stroke={INK} strokeWidth={SW.macro} />
      <rect x={x} y={y} width={w} height={h} rx={26} fill={fill} stroke={INK} strokeWidth={SW.macro} />
      <rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} rx={16} fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />
    </>
  );
}

/**
 * Wet-sauce gloss (the Direction-B steal, kept flat): one lighter blob offset
 * toward 10–11 o'clock plus a small specular sheen. Place over any sauce mass.
 */
export function Gloss({ cx, cy, rx, ry, tint, rot = -18 }: { cx: number; cy: number; rx: number; ry: number; tint: string; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx - rx * 0.28} cy={cy - ry * 0.35} rx={rx * 0.55} ry={ry * 0.45} fill={tint} opacity={0.75} />
      <ellipse cx={cx - rx * 0.42} cy={cy - ry * 0.52} rx={rx * 0.2} ry={ry * 0.13} fill="#ffffff" opacity={0.5} />
      <circle cx={cx - rx * 0.14} cy={cy - ry * 0.62} r={Math.max(3, rx * 0.05)} fill="#ffffff" opacity={0.6} />
    </g>
  );
}

/** Round-cap sheen arc for discs (pizza sauce, buns, cake tops). */
export function SheenArc({ cx, cy, r, from = 205, to = 250, color = '#ffffff', width = 9, opacity = 0.45 }: {
  cx: number; cy: number; r: number; from?: number; to?: number; color?: string; width?: number; opacity?: number;
}) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + Math.cos(rad(from)) * r, y1 = cy + Math.sin(rad(from)) * r;
  const x2 = cx + Math.cos(rad(to)) * r, y2 = cy + Math.sin(rad(to)) * r;
  return <path d={`M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} />;
}

/** Two steam curls above hot dishes (drop below 96px). */
export function Steam({ x = 200, y = 66, scale = 1, color = '#ffffff', opacity = 0.55 }: { x?: number; y?: number; scale?: number; color?: string; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" opacity={opacity}>
      <path d="M-22,26 Q -34,10 -22,-6 Q -12,-20 -22,-34" />
      <path d="M18,30 Q 6,12 18,-4 Q 28,-18 18,-32" />
    </g>
  );
}

/** Seeded crumb scatter (the Direction-D "one eaten" steal's supporting cast). */
export function CrumbScatter({ seedKey, cx, cy, rx, ry, n = 6, color, rMax = 4 }: {
  seedKey: string; cx: number; cy: number; rx: number; ry: number; n?: number; color: string; rMax?: number;
}) {
  const rnd = rngFor(seedKey + ':crumbs');
  const dots: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    dots.push(
      <circle key={i} cx={cx + Math.cos(a) * rx * d} cy={cy + Math.sin(a) * ry * d} r={1.5 + rnd() * (rMax - 1.5)} fill={color} />
    );
  }
  return <>{dots}</>;
}

/**
 * The pulled-slice helper (the Direction-C steal): returns the SVG path for a
 * wedge of a disc plus the transform that slides it out along its bisector.
 * Draw the disc with the wedge angles skipped, then draw the wedge translated.
 */
export function wedge(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + Math.cos(rad(startDeg)) * r, y1 = cy + Math.sin(rad(startDeg)) * r;
  const x2 = cx + Math.cos(rad(endDeg)) * r, y2 = cy + Math.sin(rad(endDeg)) * r;
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
}

export function wedgeShift(startDeg: number, endDeg: number, dist: number): string {
  const mid = ((startDeg + endDeg) / 2 * Math.PI) / 180;
  return `translate(${Math.cos(mid) * dist} ${Math.sin(mid) * dist})`;
}
