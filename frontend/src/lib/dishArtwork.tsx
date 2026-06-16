import { ReactNode } from 'react';
import { ingredientIcon } from './ingredientIcons';

/**
 * Flat-illustrated "cooked dish" SVG templates. Each template composes into a
 * 400×400 viewBox and returns a <g>.
 *
 * Each recipe slug in RECIPE_ARTWORK maps to one template + optional garnish
 * ingredient ids. The garnishes are stamped on top of the dish base so the
 * illustration still nods at the real ingredients.
 *
 * Design language:
 *  - Cream plate/bowl with warm shadow
 *  - Organic sauce pools coloured by recipe.palette[0]
 *  - Recognizable dish silhouette (pasta swirl, rice mound, curry pool,
 *    folded tacos, sandwich stack, etc.)
 *  - 2–4 small garnish decorations
 */

const INK = '#3f2410';
const PLATE_WARM = '#fefbf2';
const PLATE_MID = '#f5ead1';
const PLATE_EDGE = '#e8d9b3';
const PLATE_SHADOW = 'rgba(60, 30, 10, 0.12)';

type Palette = [string, string];
type DishProps = { palette: Palette; garnishIds?: string[]; slug?: string };

// --- shared building blocks --------------------------------------------------

function RoundPlate({ cx = 200, cy = 220, r = 158 }: { cx?: number; cy?: number; r?: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy + 8} rx={r + 4} ry={r} fill={PLATE_SHADOW} />
      <circle cx={cx} cy={cy} r={r} fill={PLATE_WARM} stroke={PLATE_EDGE} strokeWidth={2} strokeOpacity={0.5} />
      <circle cx={cx} cy={cy} r={r - 14} fill={PLATE_MID} opacity={0.5} />
      <circle cx={cx} cy={cy} r={r - 28} fill="none" stroke={PLATE_EDGE} strokeWidth={0.8} strokeOpacity={0.35} />
    </>
  );
}

function Bowl({ cx = 200, cy = 220, r = 152, fill }: { cx?: number; cy?: number; r?: number; fill?: string }) {
  return (
    <>
      <ellipse cx={cx} cy={cy + 10} rx={r + 4} ry={r - 6} fill={PLATE_SHADOW} />
      <circle cx={cx} cy={cy} r={r} fill={PLATE_WARM} stroke={PLATE_EDGE} strokeWidth={2} strokeOpacity={0.55} />
      <circle cx={cx} cy={cy} r={r - 22} fill={fill ?? PLATE_MID} stroke={PLATE_EDGE} strokeWidth={1} strokeOpacity={0.3} />
    </>
  );
}

/** a little pile of scattered garnish ingredient icons on top of the dish */
function Garnishes({ ids, cx = 200, cy = 220, radius = 100, size = 44, max = 3 }: { ids?: string[]; cx?: number; cy?: number; radius?: number; size?: number; max?: number }) {
  if (!ids || !ids.length) return null;
  const picks = ids.slice(0, max);
  return (
    <>
      {picks.map((id, i) => {
        // evenly distributed around a ring but with asymmetric vertical bias (lower = more natural)
        const angle = -Math.PI / 2 + (i + 0.5) * ((Math.PI * 1.4) / Math.max(picks.length, 1));
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * 0.7;
        const rot = (i * 37) % 40 - 20;
        return (
          <g key={i} transform={`translate(${x - size / 2} ${y - size / 2}) rotate(${rot} ${size / 2} ${size / 2}) scale(${size / 100})`}>
            {ingredientIcon(id)}
          </g>
        );
      })}
    </>
  );
}

// --- dish templates ----------------------------------------------------------

function PastaBowl({ palette, garnishIds }: DishProps): ReactNode {
  const sauce = palette[0];
  const isCream = ['#ca8a04', '#eab308', '#facc15', '#fef08a'].includes(sauce);
  return (
    <>
      <Bowl />
      {/* pasta nest — layered curved ribbons */}
      <g transform="translate(200 220)">
        <ellipse rx="116" ry="78" fill={isCream ? '#fef3c7' : '#fde68a'} opacity={0.6} />
        {[...Array(9)].map((_, i) => {
          const offset = (i - 4) * 12;
          return (
            <path
              key={i}
              d={`M-108 ${offset} Q 0 ${offset - 40}, 108 ${offset} Q 0 ${offset + 40}, -108 ${offset} Z`}
              fill="none"
              stroke="#fef3c7"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.85}
              transform={`rotate(${i * 4 - 16})`}
            />
          );
        })}
        {/* sauce blobs */}
        <path
          d="M-70 -10 Q -40 -40, 10 -30 Q 60 -10, 70 20 Q 40 50, -20 45 Q -70 30, -70 -10 Z"
          fill={sauce}
          opacity={0.82}
        />
        <ellipse cx="20" cy="-20" rx="18" ry="10" fill={sauce} opacity={0.6} />
      </g>
      <Garnishes ids={garnishIds} cy={180} radius={75} size={38} />
    </>
  );
}

function CurryBowl({ palette, garnishIds }: DishProps): ReactNode {
  const sauce = palette[0];
  return (
    <>
      <Bowl fill="#fff8e7" />
      <g transform="translate(200 220)">
        {/* rice mound on left */}
        <path
          d="M-130 10 Q -120 -60, -50 -65 Q 10 -60, 20 -10 Q 10 40, -50 50 Q -120 50, -130 10 Z"
          fill="#fefbf2"
          stroke="#ead8b3"
          strokeWidth={1.2}
        />
        {/* individual grain hints */}
        {[[-100, -20], [-75, -40], [-60, 0], [-30, -10], [-85, 20], [-40, 30], [-110, -10], [0, -30]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={3} ry={2} fill="#e8d9b3" />
        ))}
        {/* curry pool on right */}
        <path
          d="M0 -20 Q 30 -70, 90 -60 Q 140 -30, 130 20 Q 120 60, 50 60 Q -10 50, 0 -20 Z"
          fill={sauce}
          opacity={0.9}
        />
        <path
          d="M30 -30 Q 60 -50, 100 -40 Q 120 -10, 100 10 Q 60 20, 30 -30 Z"
          fill="#fff"
          opacity={0.12}
        />
        {/* protein chunks floating */}
        <ellipse cx="50" cy="-10" rx="16" ry="11" fill="#f4c89b" stroke={INK} strokeWidth={1} opacity={0.9} />
        <ellipse cx="90" cy="10" rx="14" ry="10" fill="#f4c89b" stroke={INK} strokeWidth={1} opacity={0.9} />
        <ellipse cx="65" cy="30" rx="12" ry="9" fill="#f4c89b" stroke={INK} strokeWidth={1} opacity={0.9} />
      </g>
      <Garnishes ids={garnishIds} cy={180} radius={105} size={36} max={3} />
    </>
  );
}

function SoupBowl({ palette, garnishIds }: DishProps): ReactNode {
  const broth = palette[0];
  return (
    <>
      <Bowl />
      <g transform="translate(200 220)">
        <circle r="128" fill={broth} opacity={0.85} />
        <circle r="128" fill="#fff" opacity={0.08} />
        {/* floating pieces */}
        {[[-60, -20], [20, -50], [60, 30], [-30, 50], [50, -10], [-70, 40]].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={14} ry={10} fill="#f4c89b" stroke={INK} strokeWidth={0.8} opacity={0.85} />
          </g>
        ))}
        {/* oil droplets */}
        {[[0, -30], [-40, 10], [30, 50], [50, -30], [-60, 30]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill="#facc15" opacity={0.55} />
        ))}
        {/* steam */}
        <path d="M-40 -100 Q -30 -130, -50 -150" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
        <path d="M10 -110 Q 20 -140, 0 -160" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      </g>
      <Garnishes ids={garnishIds} cy={180} radius={60} size={30} max={2} />
    </>
  );
}

function SaladPlate({ palette, garnishIds }: DishProps): ReactNode {
  const accent = palette[0];
  return (
    <>
      <RoundPlate />
      {/* bed of leaves */}
      <g transform="translate(200 220)">
        {[[-60, -20, '#65a30d', 22], [-10, -50, '#4d7c0f', 26], [40, -30, '#84cc16', 24], [60, 10, '#65a30d', 20], [-40, 30, '#4d7c0f', 24], [20, 40, '#84cc16', 22], [0, 0, '#2d4a0a', 28]].map(([x, y, c, r], i) => (
          <ellipse key={i} cx={x as number} cy={y as number} rx={r as number} ry={(r as number) * 0.7} fill={c as string} opacity={0.85} transform={`rotate(${(i * 41) % 360} ${x} ${y})`} />
        ))}
        {/* chunky toppings in palette colour */}
        <circle cx="-30" cy="-10" r={10} fill={accent} opacity={0.9} />
        <circle cx="30" cy="20" r={8} fill={accent} opacity={0.9} />
        <circle cx="10" cy="-30" r={7} fill={accent} opacity={0.85} />
        {/* dressing drizzle */}
        <path d="M-80 -40 Q -30 -10, 40 -30 Q 80 -10, 70 30" fill="none" stroke="#facc15" strokeWidth={2.5} strokeLinecap="round" opacity={0.55} />
      </g>
      <Garnishes ids={garnishIds} cy={200} radius={95} size={34} max={3} />
    </>
  );
}

function SandwichStack({ palette, garnishIds }: DishProps): ReactNode {
  const filling = palette[0];
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 220)">
        {/* bottom bread slice */}
        <rect x="-110" y="10" width="220" height="48" rx="14" fill="#e8c497" stroke={INK} strokeWidth={2} />
        <rect x="-100" y="14" width="200" height="14" rx="6" fill="#f4e1cb" />
        {/* filling */}
        <rect x="-100" y="-18" width="200" height="30" rx="4" fill={filling} opacity={0.85} stroke={INK} strokeWidth={1.5} />
        {/* lettuce frill peeking out */}
        <path d="M-100 -6 Q -90 -14, -80 -6 Q -70 -16, -60 -6 Q -50 -14, -40 -6 Q -30 -16, -20 -6 Q -10 -14, 0 -6 Q 10 -16, 20 -6 Q 30 -14, 40 -6 Q 50 -16, 60 -6 Q 70 -14, 80 -6 Q 90 -16, 100 -6" fill="none" stroke="#65a30d" strokeWidth={3} strokeLinecap="round" />
        {/* top slice */}
        <rect x="-110" y="-60" width="220" height="46" rx="14" fill="#d4a373" stroke={INK} strokeWidth={2} />
        <path d="M-110 -60 Q -60 -78, 0 -72 Q 60 -78, 110 -60" fill="#e8c497" stroke={INK} strokeWidth={2} />
        {/* seeds */}
        {[[-70, -70], [-20, -72], [30, -70], [70, -72]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.5} fill="#78350f" />
        ))}
      </g>
      <Garnishes ids={garnishIds} cy={320} radius={90} size={36} max={2} />
    </>
  );
}

function Tacos({ palette, garnishIds }: DishProps): ReactNode {
  const filling = palette[0];
  return (
    <>
      <RoundPlate />
      {/* two folded tortillas */}
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${150 + i * 110} 220) rotate(${i === 0 ? -8 : 10})`}>
          <path d="M-60 0 Q -60 -60, 0 -70 Q 60 -60, 60 0 Q 30 30, 0 20 Q -30 30, -60 0 Z" fill="#fef3c7" stroke={INK} strokeWidth={2} />
          <path d="M-55 -5 Q -55 -50, 0 -55 Q 55 -50, 55 -5 L 55 15 Q 0 35, -55 15 Z" fill="#fde68a" opacity={0.5} />
          {/* filling peeking from the top */}
          <ellipse cx="0" cy="-30" rx="38" ry="12" fill={filling} opacity={0.9} />
          <circle cx="-18" cy="-34" r="5" fill="#65a30d" opacity={0.9} />
          <circle cx="12" cy="-38" r="4" fill="#65a30d" opacity={0.9} />
          <circle cx="0" cy="-30" r="4" fill="#dc2626" opacity={0.85} />
          <circle cx="20" cy="-28" r="3" fill="#faf2e3" />
          {/* char marks */}
          <path d="M-40 -20 Q -35 -10, -28 -22" stroke="#a16207" strokeWidth={1.4} fill="none" opacity={0.5} />
          <path d="M20 -10 Q 28 -18, 30 -8" stroke="#a16207" strokeWidth={1.4} fill="none" opacity={0.5} />
        </g>
      ))}
      <Garnishes ids={garnishIds} cy={330} radius={60} size={32} max={2} />
    </>
  );
}

function StirFry({ palette, garnishIds }: DishProps): ReactNode {
  const sauce = palette[0];
  return (
    <>
      <Bowl />
      <g transform="translate(200 220)">
        {/* glossy sauce base */}
        <circle r="110" fill={sauce} opacity={0.25} />
        {/* sliced veg pieces in warm colours */}
        {[[-60, -20, '#dc2626'], [-30, 10, '#ea580c'], [30, -20, '#65a30d'], [60, 10, '#4d7c0f'], [0, -30, '#f59e0b'], [-20, -50, '#65a30d'], [20, 40, '#dc2626'], [-40, 40, '#a16207'], [40, 30, '#4d7c0f'], [0, 20, '#c2410c']].map(([x, y, c], i) => {
          const rot = (i * 47) % 180;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
              <rect x={-16} y={-5} width={32} height={10} rx={5} fill={c as string} stroke={INK} strokeWidth={1.2} />
            </g>
          );
        })}
        {/* protein chunks */}
        <rect x="-70" y="15" width="28" height="14" rx="5" fill="#92400e" stroke={INK} strokeWidth={1.2} />
        <rect x="45" y="-35" width="28" height="14" rx="5" fill="#92400e" stroke={INK} strokeWidth={1.2} />
        {/* sesame seeds */}
        {[[-20, -10], [10, -20], [30, 15], [-10, 30], [50, 0]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={2} ry={1.2} fill="#fef3c7" stroke={INK} strokeWidth={0.4} />
        ))}
      </g>
      <Garnishes ids={garnishIds} cy={180} radius={80} size={32} max={2} />
    </>
  );
}

function RoastPlate({ palette, garnishIds, protein = 'generic' }: DishProps & { protein?: 'chicken' | 'steak' | 'fish' | 'lamb' | 'generic' }): ReactNode {
  const proteinFills = {
    chicken: '#e8c497',
    steak: '#7f1d1d',
    fish: '#f4a6a6',
    lamb: '#991b1b',
    generic: palette[0],
  };
  const pf = proteinFills[protein];
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 220)">
        {/* protein main */}
        <path d="M-90 -10 Q -60 -50, -10 -50 Q 40 -40, 50 0 Q 40 30, -10 30 Q -70 20, -90 -10 Z" fill={pf} stroke={INK} strokeWidth={2} />
        {/* char marks */}
        <path d="M-70 -20 Q -50 -25, -30 -18 M-40 5 Q -20 0, 10 10 M10 -25 Q 30 -20, 40 -5" stroke={INK} strokeWidth={1.2} fill="none" opacity={0.4} />
        {/* side: roast potato chunks */}
        {[[60, -30], [80, -5], [95, 25], [70, 40]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={18} ry={14} fill="#d4a373" stroke={INK} strokeWidth={1.5} transform={`rotate(${i * 25})`} />
        ))}
        {/* gravy pool */}
        <path d="M-50 35 Q 0 50, 50 35 Q 60 45, 20 55 Q -30 55, -50 35 Z" fill={palette[0]} opacity={0.55} />
      </g>
      <Garnishes ids={garnishIds} cy={200} radius={115} size={36} max={2} />
    </>
  );
}

function RoastChicken({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 215)">
        {/* whole chook body */}
        <ellipse rx="110" ry="82" fill="#e8c497" stroke={INK} strokeWidth={2.2} />
        <ellipse cx="-10" cy="-10" rx="85" ry="60" fill="#f4d0a0" opacity={0.8} />
        {/* crispy skin patches */}
        <path d="M-50 -20 Q -30 -40, 0 -30 Q 30 -40, 60 -20 Q 40 -5, 0 -10 Q -40 -5, -50 -20 Z" fill="#c2410c" opacity={0.45} />
        {/* wing */}
        <path d="M80 0 Q 110 -10, 115 20 Q 100 35, 75 25 Z" fill="#d4a373" stroke={INK} strokeWidth={2} />
        {/* drumstick end */}
        <ellipse cx="-90" cy="30" rx="16" ry="10" fill="#fefbf2" stroke={INK} strokeWidth={1.5} />
        {/* lemon wedge */}
        <path d="M70 50 Q 90 40, 100 60 Q 85 70, 70 50 Z" fill="#facc15" stroke={INK} strokeWidth={1.5} />
        {/* char */}
        <circle cx="-20" cy="-25" r="4" fill="#78350f" opacity={0.5} />
        <circle cx="20" cy="-30" r="3" fill="#78350f" opacity={0.5} />
      </g>
      <Garnishes ids={garnishIds} cy={320} radius={85} size={36} max={2} />
    </>
  );
}

function Risotto({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <Bowl />
      <g transform="translate(200 220)">
        {/* creamy rice — lots of grain specks */}
        <circle r="125" fill="#fffbe8" stroke="#e8d9b3" strokeWidth={1.5} />
        <circle r="100" fill="#fef3c7" opacity={0.7} />
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i * 37) % 360;
          const d = 20 + (i % 8) * 12;
          const x = Math.cos((a * Math.PI) / 180) * d;
          const y = Math.sin((a * Math.PI) / 180) * d;
          return <ellipse key={i} cx={x} cy={y} rx={2.5} ry={1.2} fill="#e8d9b3" transform={`rotate(${a} ${x} ${y})`} />;
        })}
        {/* texture blob of palette colour */}
        <path d="M-70 -40 Q -30 -60, 30 -50 Q 70 -20, 50 20 Q 20 40, -30 30 Q -80 20, -70 -40 Z" fill={palette[0]} opacity={0.35} />
        {/* chunks of protein/mushroom */}
        <ellipse cx="-20" cy="-10" rx="14" ry="9" fill="#a16207" stroke={INK} strokeWidth={1.2} />
        <ellipse cx="30" cy="15" rx="12" ry="8" fill="#a16207" stroke={INK} strokeWidth={1.2} />
        <ellipse cx="10" cy="-35" rx="10" ry="7" fill="#a16207" stroke={INK} strokeWidth={1.2} />
      </g>
      <Garnishes ids={garnishIds} cy={170} radius={85} size={30} max={3} />
    </>
  );
}

function EggBrunch({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 220)">
        {/* toast triangles */}
        <g transform="translate(-80 20) rotate(-12)">
          <path d="M-50 -40 L 50 -40 L 0 60 Z" fill="#e8c497" stroke={INK} strokeWidth={2} />
          <path d="M-45 -35 L 45 -35 L 0 50 Z" fill="#f4e1cb" />
        </g>
        {/* egg white */}
        <ellipse cx="40" cy="-10" rx="65" ry="50" fill="#fff" stroke={INK} strokeWidth={2} />
        <ellipse cx="40" cy="-10" rx="55" ry="42" fill="#fffdf7" />
        {/* yolk */}
        <circle cx="40" cy="-10" r="22" fill="#facc15" stroke={INK} strokeWidth={1.8} />
        <circle cx="34" cy="-16" r="8" fill="#fde68a" />
        {/* sauce drizzle */}
        <path d="M-20 40 Q 30 50, 80 40 Q 70 60, 20 55 Q -10 55, -20 40 Z" fill={palette[0]} opacity={0.6} />
      </g>
      <Garnishes ids={garnishIds} cy={150} radius={70} size={30} max={2} />
    </>
  );
}

function Shakshuka({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      {/* cast-iron pan */}
      <ellipse cx="200" cy="228" rx="168" ry="158" fill={PLATE_SHADOW} />
      <circle cx="200" cy="220" r="160" fill="#2d2d2d" />
      <circle cx="200" cy="220" r="150" fill="#1f2937" stroke="#111" strokeWidth={2} />
      {/* pan handle */}
      <rect x="360" y="205" width="32" height="30" rx="4" fill="#2d2d2d" stroke="#111" strokeWidth={1.5} />
      {/* tomato sauce */}
      <circle cx="200" cy="220" r="130" fill={palette[0]} opacity={0.95} />
      <circle cx="200" cy="220" r="130" fill="#fff" opacity={0.06} />
      {/* eggs nestled */}
      {[[-40, -20], [30, 30], [-30, 40], [40, -30]].map(([x, y], i) => (
        <g key={i} transform={`translate(${200 + x} ${220 + y})`}>
          <ellipse rx="32" ry="26" fill="#fff" stroke={INK} strokeWidth={1.5} opacity={0.95} />
          <circle r="11" fill="#facc15" stroke={INK} strokeWidth={1.2} />
        </g>
      ))}
      <Garnishes ids={garnishIds} cy={220} radius={40} size={26} max={2} />
    </>
  );
}

function Pancakes({ palette, garnishIds }: DishProps): ReactNode {
  const stack = 3;
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 240)">
        {[...Array(stack)].map((_, i) => {
          const y = -i * 26;
          return (
            <g key={i}>
              <ellipse cx={0} cy={y + 6} rx="110" ry="22" fill="rgba(60,30,10,0.12)" />
              <ellipse cx={0} cy={y} rx="110" ry="26" fill="#d4a373" stroke={INK} strokeWidth={2} />
              <ellipse cx={0} cy={y - 3} rx="100" ry="20" fill="#e8c497" />
            </g>
          );
        })}
        {/* butter square */}
        <rect x="-22" y="-90" width="44" height="20" rx="2" fill="#fef08a" stroke={INK} strokeWidth={1.5} />
        {/* syrup drip */}
        <path d="M-30 -70 Q 0 -55, 30 -70 Q 50 -40, 70 -10 Q 60 20, 30 15 Q -10 15, -30 -70 Z" fill={palette[0]} opacity={0.8} />
        {/* berries */}
        <circle cx="-40" cy="-95" r="8" fill="#1e40af" stroke={INK} strokeWidth={1.2} />
        <circle cx="25" cy="-100" r="7" fill="#1e40af" stroke={INK} strokeWidth={1.2} />
        <circle cx="-10" cy="-105" r="6" fill="#1e40af" stroke={INK} strokeWidth={1.2} />
      </g>
    </>
  );
}

function BakedSlice({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 220)">
        {/* cake slab from a cross-section */}
        <rect x="-90" y="-40" width="180" height="80" rx="6" fill="#a16207" stroke={INK} strokeWidth={2} />
        <rect x="-90" y="-40" width="180" height="18" fill={palette[0]} stroke={INK} strokeWidth={2} />
        {/* crumb marks */}
        {[[-60, 0], [-20, 10], [40, -10], [0, 20], [60, 10], [-40, -10]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="#78350f" opacity={0.4} />
        ))}
        {/* a few scattered crumbs on plate */}
        <circle cx="-110" cy="60" r="3" fill="#a16207" />
        <circle cx="100" cy="60" r="2" fill="#a16207" />
        <circle cx="-100" cy="50" r="2" fill="#a16207" />
      </g>
      <Garnishes ids={garnishIds} cy={300} radius={85} size={32} max={2} />
    </>
  );
}

function Skewers({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <RoundPlate />
      {[0, 1].map((row) => (
        <g key={row} transform={`translate(${100} ${row === 0 ? 195 : 250}) rotate(${row === 0 ? -4 : 4})`}>
          {/* stick */}
          <rect x="0" y="-2" width="200" height="4" rx="2" fill="#78350f" />
          {/* cubes */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${30 + i * 40} 0)`}>
              <rect x={-14} y={-16} width={28} height={32} rx={3} fill={palette[0]} stroke={INK} strokeWidth={1.5} />
              {/* char */}
              <rect x={-10} y={-12} width={20} height={4} rx={1} fill={INK} opacity={0.35} />
              <rect x={-10} y={4} width={20} height={4} rx={1} fill={INK} opacity={0.35} />
            </g>
          ))}
        </g>
      ))}
      <Garnishes ids={garnishIds} cy={330} radius={90} size={32} max={2} />
    </>
  );
}

function GrainBowl({ palette, garnishIds }: DishProps): ReactNode {
  const sauce = palette[0];
  return (
    <>
      <Bowl />
      {/* divided quadrants */}
      <g transform="translate(200 220)">
        <circle r="128" fill="#fefbf2" />
        {/* grain base */}
        <path d="M-128 -8 A 128 128 0 0 1 0 -128 L 0 0 Z" fill="#fde68a" />
        {/* roast veg */}
        <path d="M0 -128 A 128 128 0 0 1 128 -8 L 0 0 Z" fill={sauce} opacity={0.85} />
        {/* greens */}
        <path d="M128 -8 A 128 128 0 0 1 8 128 L 0 0 Z" fill="#65a30d" opacity={0.85} />
        {/* protein */}
        <path d="M8 128 A 128 128 0 0 1 -128 -8 L 0 0 Z" fill="#c89e6b" />
        {/* centre dollop */}
        <circle r="22" fill="#fff" stroke={INK} strokeWidth={1.5} />
        {/* grain specks */}
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i * 31) % 360;
          const d = 50 + (i % 5) * 15;
          const x = Math.cos((a * Math.PI) / 180) * d;
          const y = Math.sin((a * Math.PI) / 180) * d;
          return <ellipse key={i} cx={x} cy={y} rx={2} ry={1} fill="#e8d9b3" opacity={0.8} />;
        })}
      </g>
      <Garnishes ids={garnishIds} cy={180} radius={60} size={28} max={2} />
    </>
  );
}

function DipPlate({ palette, garnishIds }: DishProps): ReactNode {
  const dip = palette[0];
  return (
    <>
      <RoundPlate />
      {/* dip bowl in centre */}
      <g transform="translate(200 220)">
        <circle r="70" fill={PLATE_MID} stroke={PLATE_EDGE} strokeWidth={2} />
        <circle r="58" fill={dip} opacity={0.9} />
        <path d="M-30 -20 Q 0 -40, 30 -20 Q 20 10, -20 10 Z" fill="#fff" opacity={0.2} />
        {/* oil drizzle */}
        <circle cx="-15" cy="0" r="4" fill="#ca8a04" opacity={0.7} />
        <circle cx="15" cy="-10" r="3" fill="#ca8a04" opacity={0.7} />
      </g>
      {/* flatbread wedges around */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = 200 + Math.cos(a) * 110;
        const y = 220 + Math.sin(a) * 110;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`}>
            <path d="M-24 -12 L 24 -12 L 20 12 L -20 12 Z" fill="#e8c497" stroke={INK} strokeWidth={1.5} />
            <path d="M-20 -10 L 20 -10 L 17 5 L -17 5 Z" fill="#f4e1cb" />
          </g>
        );
      })}
    </>
  );
}

function FriedRice({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <Bowl />
      <g transform="translate(200 220)">
        <circle r="128" fill="#fde68a" />
        {/* grain hints */}
        {Array.from({ length: 90 }).map((_, i) => {
          const a = (i * 19) % 360;
          const d = 10 + (i % 12) * 9;
          const x = Math.cos((a * Math.PI) / 180) * d;
          const y = Math.sin((a * Math.PI) / 180) * d;
          return <ellipse key={i} cx={x} cy={y} rx={2.5} ry={1.2} fill="#fef3c7" transform={`rotate(${a} ${x} ${y})`} />;
        })}
        {/* peas, carrot cubes, egg bits */}
        {[[-60, -20, '#4d7c0f'], [-30, 10, '#4d7c0f'], [20, -30, '#4d7c0f'], [50, 20, '#4d7c0f'], [-20, 40, '#4d7c0f']].map(([x, y, c], i) => (
          <circle key={`p${i}`} cx={x as number} cy={y as number} r={5} fill={c as string} stroke={INK} strokeWidth={0.6} />
        ))}
        {[[40, -20], [-40, 30], [60, -40], [-60, 10]].map(([x, y], i) => (
          <rect key={`c${i}`} x={(x as number) - 5} y={(y as number) - 5} width={10} height={10} fill="#ea580c" stroke={INK} strokeWidth={0.6} />
        ))}
        {/* egg bits */}
        {[[0, -40], [-10, 20], [30, 40]].map(([x, y], i) => (
          <circle key={`e${i}`} cx={x} cy={y} r={6} fill="#facc15" stroke={INK} strokeWidth={0.8} opacity={0.9} />
        ))}
      </g>
      <Garnishes ids={garnishIds} cy={170} radius={70} size={28} max={2} />
    </>
  );
}

function FishChips({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 220)">
        {/* battered fish */}
        <path d="M-100 -10 Q -60 -50, 0 -45 Q 60 -35, 80 0 Q 60 30, 0 25 Q -80 20, -100 -10 Z" fill="#d4a373" stroke={INK} strokeWidth={2} />
        <path d="M-90 -5 Q -50 -40, 0 -36 Q 55 -28, 70 0 Q 55 22, 0 18 Q -80 14, -90 -5 Z" fill="#f4e1cb" opacity={0.6} />
        {/* crumb texture */}
        {[[-60, -20], [-20, -30], [20, -25], [40, -5], [-30, 10]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill="#a16207" />
        ))}
        {/* chips pile */}
        {[[55, 30], [70, 45], [85, 25], [65, 55], [50, 45], [80, 55], [95, 45]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 23})`}>
            <rect x={-6} y={-22} width={12} height={44} rx={2} fill="#facc15" stroke={INK} strokeWidth={1.2} />
          </g>
        ))}
        {/* lemon wedge */}
        <path d="M-90 40 Q -70 25, -50 40 Q -60 60, -90 40 Z" fill="#facc15" stroke={INK} strokeWidth={1.5} />
        <path d="M-82 40 L -60 40" stroke={INK} strokeWidth={0.6} />
      </g>
    </>
  );
}

function DefaultPlate({ palette, garnishIds }: DishProps): ReactNode {
  return (
    <>
      <RoundPlate />
      <g transform="translate(200 220)">
        <circle r="100" fill={palette[0]} opacity={0.7} />
        <circle r="80" fill="#fff" opacity={0.15} />
      </g>
      <Garnishes ids={garnishIds} cy={220} radius={80} size={40} max={4} />
    </>
  );
}

// --- registry ----------------------------------------------------------------

type Template = (p: DishProps) => ReactNode;

// Form token → template. This is the authoritative, data-driven source: a recipe's
// `dish_form` (stored in recipes.json / the DB and returned by the API) selects its
// art here, so a NEW recipe declares its form in data with no code edit. The
// slug-keyed RECIPE_ARTWORK below is retained only as a fallback for recipe objects
// that don't carry dish_form (e.g. the landing mosaic, pre-dish_form custom recipes).
const FORM_TEMPLATES: Record<string, Template> = {
  'pasta-bowl': (p) => <PastaBowl {...p} />,
  'curry-bowl': (p) => <CurryBowl {...p} />,
  'soup-bowl': (p) => <SoupBowl {...p} />,
  'salad-plate': (p) => <SaladPlate {...p} />,
  'sandwich-stack': (p) => <SandwichStack {...p} />,
  tacos: (p) => <Tacos {...p} />,
  'stir-fry': (p) => <StirFry {...p} />,
  'fried-rice': (p) => <FriedRice {...p} />,
  'roast-chicken': (p) => <RoastChicken {...p} />,
  'roast-plate': (p) => <RoastPlate {...p} />,
  'roast-plate-steak': (p) => <RoastPlate {...p} protein="steak" />,
  'roast-plate-chicken': (p) => <RoastPlate {...p} protein="chicken" />,
  'roast-plate-lamb': (p) => <RoastPlate {...p} protein="lamb" />,
  'roast-plate-fish': (p) => <RoastPlate {...p} protein="fish" />,
  risotto: (p) => <Risotto {...p} />,
  shakshuka: (p) => <Shakshuka {...p} />,
  'egg-brunch': (p) => <EggBrunch {...p} />,
  pancakes: (p) => <Pancakes {...p} />,
  'baked-slice': (p) => <BakedSlice {...p} />,
  skewers: (p) => <Skewers {...p} />,
  'grain-bowl': (p) => <GrainBowl {...p} />,
  'dip-plate': (p) => <DipPlate {...p} />,
  'fish-chips': (p) => <FishChips {...p} />,
  'default-plate': (p) => <DefaultPlate {...p} />,
};

/** The set of valid dish_form tokens — also asserted by scripts/validate-recipes.mjs. */
export const DISH_FORMS = Object.keys(FORM_TEMPLATES);

const RECIPE_ARTWORK: Record<string, Template> = {
  // pasta bowls
  'spaghetti-bolognese': (p) => <PastaBowl {...p} />,
  'sausage-pasta-bake': (p) => <PastaBowl {...p} />,
  'pesto-pasta': (p) => <PastaBowl {...p} />,
  'carbonara': (p) => <PastaBowl {...p} />,
  'tuna-pasta': (p) => <PastaBowl {...p} />,
  'prawn-linguine': (p) => <PastaBowl {...p} />,
  'lentil-bolognese': (p) => <PastaBowl {...p} />,
  'mac-cheese': (p) => <PastaBowl {...p} />,
  'chorizo-pasta': (p) => <PastaBowl {...p} />,
  'lasagna': (p) => <PastaBowl {...p} />,
  'gnocchi-pomodoro': (p) => <PastaBowl {...p} />,

  // curry rice
  'green-thai-curry': (p) => <CurryBowl {...p} />,
  'chicken-tikka-masala': (p) => <CurryBowl {...p} />,
  'pumpkin-chickpea-curry': (p) => <CurryBowl {...p} />,
  'red-lentil-dahl': (p) => <CurryBowl {...p} />,
  'butter-chicken': (p) => <CurryBowl {...p} />,
  'eggplant-curry': (p) => <CurryBowl {...p} />,
  'thai-basil-chicken': (p) => <CurryBowl {...p} />,
  'salmon-teriyaki': (p) => <CurryBowl {...p} />,
  'lemon-chicken-rice': (p) => <CurryBowl {...p} />,
  'palak-paneer': (p) => <CurryBowl {...p} />,
  'chana-masala': (p) => <CurryBowl {...p} />,
  'chicken-biryani': (p) => <CurryBowl {...p} />,
  'chicken-katsu': (p) => <CurryBowl {...p} />,

  // soups
  'sweet-potato-soup': (p) => <SoupBowl {...p} />,
  'minestrone': (p) => <SoupBowl {...p} />,
  'chicken-noodle-soup': (p) => <SoupBowl {...p} />,
  'pumpkin-soup': (p) => <SoupBowl {...p} />,
  'duck-noodle-soup': (p) => <SoupBowl {...p} />,
  'pho': (p) => <SoupBowl {...p} />,
  'miso-ramen': (p) => <SoupBowl {...p} />,

  // salads
  'chicken-caesar-salad': (p) => <SaladPlate {...p} />,
  'greek-salad': (p) => <SaladPlate {...p} />,
  'thai-beef-salad': (p) => <SaladPlate {...p} />,
  'quinoa-salad': (p) => <SaladPlate {...p} />,
  'beetroot-salad': (p) => <SaladPlate {...p} />,
  'potato-salad': (p) => <SaladPlate {...p} />,
  'pork-larb': (p) => <SaladPlate {...p} />,
  'caprese-salad': (p) => <SaladPlate {...p} />,
  'tabouleh': (p) => <SaladPlate {...p} />,

  // sandwiches / wraps / burgers
  'smashed-avo-toast': (p) => <SandwichStack {...p} />,
  'bbq-snag-sanga': (p) => <SandwichStack {...p} />,
  'veggie-wrap': (p) => <SandwichStack {...p} />,
  'fried-egg-sandwich': (p) => <SandwichStack {...p} />,
  'pork-banh-mi': (p) => <SandwichStack {...p} />,
  'breakfast-burrito': (p) => <SandwichStack {...p} />,
  'chicken-shawarma': (p) => <SandwichStack {...p} />,
  'greek-lamb-souva': (p) => <SandwichStack {...p} />,
  'classic-beef-burger': (p) => <SandwichStack {...p} />,
  'bruschetta': (p) => <SandwichStack {...p} />,

  // tacos
  'beef-tacos': (p) => <Tacos {...p} />,
  'fish-tacos': (p) => <Tacos {...p} />,
  'chicken-fajitas': (p) => <Tacos {...p} />,
  'cheesy-quesadillas': (p) => <Tacos {...p} />,

  // stir-fry
  'veggie-fried-rice': (p) => <FriedRice {...p} />,
  'stir-fry-beef': (p) => <StirFry {...p} />,
  'beef-stir-fry': (p) => <StirFry {...p} />,
  'tofu-stir-fry': (p) => <StirFry {...p} />,

  // roast plates
  'sunday-roast-chook': (p) => <RoastChicken {...p} />,
  'steak-chips': (p) => <RoastPlate {...p} protein="steak" />,
  'fish-chips': (p) => <FishChips {...p} />,
  'chicken-schnitty': (p) => <RoastPlate {...p} protein="chicken" />,
  'chicken-parma': (p) => <RoastPlate {...p} protein="chicken" />,
  'chilli-con-carne': (p) => <RoastPlate {...p} />,
  'moroccan-lamb': (p) => <RoastPlate {...p} protein="lamb" />,
  'zucchini-slice': (p) => <RoastPlate {...p} />,
  'fish-pie': (p) => <RoastPlate {...p} protein="fish" />,
  'meat-pie': (p) => <RoastPlate {...p} />,
  'cottage-pie': (p) => <RoastPlate {...p} />,
  'beef-stroganoff': (p) => <PastaBowl {...p} />,
  'pork-ribs': (p) => <RoastPlate {...p} />,
  'eggplant-parma': (p) => <RoastPlate {...p} />,
  'ratatouille': (p) => <SaladPlate {...p} />,

  // risotto
  'mushroom-risotto': (p) => <Risotto {...p} />,
  'pumpkin-risotto': (p) => <Risotto {...p} />,

  // brunch/eggs
  'shakshuka': (p) => <Shakshuka {...p} />,
  'poached-eggs': (p) => <EggBrunch {...p} />,
  'breakfast-frittata': (p) => <EggBrunch {...p} />,
  'eggs-benedict': (p) => <EggBrunch {...p} />,
  'pancakes': (p) => <Pancakes {...p} />,
  'pancakes-fluffy': (p) => <Pancakes {...p} />,
  'french-toast': (p) => <Pancakes {...p} />,
  'overnight-oats': (p) => <GrainBowl {...p} />,
  'granola-bowl': (p) => <GrainBowl {...p} />,

  // baked goods / desserts
  'banana-bread': (p) => <BakedSlice {...p} />,
  'zucchini-bread': (p) => <BakedSlice {...p} />,
  'chocolate-brownies': (p) => <BakedSlice {...p} />,
  'sticky-date-pudding': (p) => <BakedSlice {...p} />,
  'tiramisu': (p) => <BakedSlice {...p} />,
  'lemon-tart': (p) => <BakedSlice {...p} />,
  'anzac-biscuits': (p) => <BakedSlice {...p} />,
  'lamingtons': (p) => <BakedSlice {...p} />,
  'apple-crumble': (p) => <BakedSlice {...p} />,
  'damper': (p) => <BakedSlice {...p} />,
  'pavlova': (p) => <Pancakes {...p} />,

  // skewers
  'lamb-kofta': (p) => <Skewers {...p} />,

  // dip + bread / grain bowls
  'hummus-flatbread': (p) => <DipPlate {...p} />,
  'haloumi-grain-bowl': (p) => <GrainBowl {...p} />,
  'roast-veg-couscous': (p) => <GrainBowl {...p} />,
  'bibimbap': (p) => <GrainBowl {...p} />,
  'falafel-bowl': (p) => <GrainBowl {...p} />,
  'scallops-peas': (p) => <DipPlate {...p} />,

  // gyoza + dumplings
  'gyoza': (p) => <DipPlate {...p} />,

  // snacks / parties
  'loaded-nachos': (p) => <DipPlate {...p} />,
  'buffalo-wings': (p) => <Skewers {...p} />,
  'satay-skewers': (p) => <Skewers {...p} />,
  'san-choy-bow': (p) => <Tacos {...p} />,
  'cheese-toastie': (p) => <SandwichStack {...p} />,
  'ham-cheese-jaffle': (p) => <SandwichStack {...p} />,

  // asian
  'pad-see-ew': (p) => <PastaBowl {...p} />,
  'korean-beef-bowl': (p) => <GrainBowl {...p} />,

  // curries / slow
  'chicken-tagine': (p) => <CurryBowl {...p} />,
  'paella': (p) => <CurryBowl {...p} />,
  'pulled-pork': (p) => <SandwichStack {...p} />,

  // soups
  'tom-yum': (p) => <SoupBowl {...p} />,
  'french-onion-soup': (p) => <SoupBowl {...p} />,
  'mushroom-soup': (p) => <SoupBowl {...p} />,

  // baked / sweet
  'choc-chip-cookies': (p) => <BakedSlice {...p} />,
  'nyc-cheesecake': (p) => <BakedSlice {...p} />,
  'lemon-delicious': (p) => <BakedSlice {...p} />,
  'rocky-road': (p) => <BakedSlice {...p} />,
  'apple-pie': (p) => <BakedSlice {...p} />,
  'garlic-bread': (p) => <BakedSlice {...p} />,
  'yorkshire-puddings': (p) => <BakedSlice {...p} />,
  'focaccia': (p) => <BakedSlice {...p} />,

  // breakfast / sides
  'berry-smoothie-bowl': (p) => <GrainBowl {...p} />,
  'hash-browns': (p) => <RoastPlate {...p} />,
  'omelette': (p) => <EggBrunch {...p} />,
  'bircher-muesli': (p) => <GrainBowl {...p} />,
  'coleslaw': (p) => <SaladPlate {...p} />,
  'mashed-potato': (p) => <Risotto {...p} />,

  // grill
  'chimichurri-steak': (p) => <RoastPlate {...p} protein="steak" />,

  // added this round
  'pork-chops-apple': (p) => <RoastPlate {...p} />,
  'smoked-salmon-bagel': (p) => <SandwichStack {...p} />,
  'slow-beef-brisket': (p) => <RoastPlate {...p} protein="steak" />,
  'aloo-gobi': (p) => <CurryBowl {...p} />,
  'kung-pao-chicken': (p) => <StirFry {...p} />,
  'mongolian-beef': (p) => <StirFry {...p} />,
  'cacio-e-pepe': (p) => <PastaBowl {...p} />,
  'aglio-e-olio': (p) => <PastaBowl {...p} />,
  'pasta-puttanesca': (p) => <PastaBowl {...p} />,
  'nicoise-salad': (p) => <SaladPlate {...p} />,
  'cobb-salad': (p) => <SaladPlate {...p} />,
  'tomato-basil-soup': (p) => <SoupBowl {...p} />,
  'wonton-soup': (p) => <SoupBowl {...p} />,
  'summer-rolls': (p) => <Tacos {...p} />,
  'carrot-cake': (p) => <BakedSlice {...p} />,
  'chocolate-mousse': (p) => <DipPlate {...p} />,
  'creme-brulee': (p) => <DipPlate {...p} />,
  'eton-mess': (p) => <Pancakes {...p} />,
  'margherita-pizza': (p) => <BakedSlice {...p} />,
  'quiche-lorraine': (p) => <BakedSlice {...p} />,
  'chicken-mushroom-pie': (p) => <BakedSlice {...p} />,
  'bread-butter-pudding': (p) => <BakedSlice {...p} />,
  'tandoori-chicken': (p) => <Skewers {...p} />,
  'honey-soy-wings': (p) => <Skewers {...p} />,
};

export function dishArtworkFor(
  slug: string | undefined,
  palette: Palette,
  garnishIds: string[] = [],
  form?: string | null
): ReactNode {
  // Data-driven first (recipe.dish_form), then the legacy slug map, then a generic plate.
  const template = (form && FORM_TEMPLATES[form]) || (slug ? RECIPE_ARTWORK[slug] : undefined);
  if (template) return template({ palette, garnishIds, slug });
  return <DefaultPlate palette={palette} garnishIds={garnishIds} slug={slug} />;
}
