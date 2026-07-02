import { ReactNode } from 'react';
import { ICON_OVERRIDES } from './icons';

/**
 * Flat illustrated SVG for every ingredient in the dictionary.
 *
 * Design rules:
 *  - viewBox 0 0 100 100
 *  - Warm flat palette, inked outline (#3f2410), legible at 24–100px
 *  - 3–8 shapes each, no gradients/filters
 *  - Returns a <g> so callers can position/scale it inside a MealPlate SVG
 */

const INK = '#3f2410';
const S = 1.6; // standard stroke width

// shared template helpers -----------------------------------------------------

/** a generic leaf — curved teardrop. translate/rotate via parent <g>. */
const Leaf = ({ fill, vein = '#4d7c0f' }: { fill: string; vein?: string }) => (
  <>
    <path d="M50 22 C30 30, 22 50, 30 72 C40 66, 60 66, 70 72 C78 50, 70 30, 50 22 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M50 24 L50 70" stroke={vein} strokeWidth={1.2} fill="none" />
  </>
);

const Pepper = ({ fill, stem = '#4d7c0f' }: { fill: string; stem?: string }) => (
  <>
    <path d="M35 30 C30 50, 30 75, 50 82 C70 75, 70 50, 65 30 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M45 30 L45 18 L55 15 L55 30" fill={stem} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
  </>
);

const Tin = ({ body, label, letter }: { body: string; label?: string; letter?: string }) => (
  <>
    <rect x="25" y="22" width="50" height="60" rx="4" fill={body} stroke={INK} strokeWidth={S} />
    <rect x="25" y="26" width="50" height="4" fill="none" stroke={INK} strokeWidth={1} opacity={0.4} />
    <rect x="25" y="74" width="50" height="4" fill="none" stroke={INK} strokeWidth={1} opacity={0.4} />
    {label && <rect x="29" y="40" width="42" height="22" fill={label} stroke={INK} strokeWidth={1} />}
    {letter && <text x="50" y="56" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fontWeight="400" fill={INK} style={{ fontStyle: 'italic' }}>{letter}</text>}
  </>
);

const Bottle = ({ body, cap = '#3f2410', label, letter }: { body: string; cap?: string; label?: string; letter?: string }) => (
  <>
    <rect x="42" y="10" width="16" height="10" fill={cap} stroke={INK} strokeWidth={S} />
    <path d="M42 20 L40 32 L36 38 L36 82 Q36 88 42 88 L58 88 Q64 88 64 82 L64 38 L60 32 L58 20 Z" fill={body} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    {label && <rect x="38" y="52" width="24" height="22" fill={label} stroke={INK} strokeWidth={1} />}
    {letter && <text x="50" y="68" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fill={INK} style={{ fontStyle: 'italic' }}>{letter}</text>}
  </>
);

const Packet = ({ body, label, letter }: { body: string; label?: string; letter?: string }) => (
  <>
    <path d="M28 22 L72 22 L74 82 Q74 86 70 86 L30 86 Q26 86 26 82 Z" fill={body} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M28 22 L38 16 L62 16 L72 22" fill={body} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    {label && <rect x="32" y="44" width="36" height="28" fill={label} stroke={INK} strokeWidth={1} />}
    {letter && <text x="50" y="62" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill={INK} style={{ fontStyle: 'italic' }}>{letter}</text>}
  </>
);

const Sachet = ({ body, letter }: { body: string; letter?: string }) => (
  <>
    <path d="M30 24 L70 24 L72 82 L28 82 Z" fill={body} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M30 24 L34 18 L66 18 L70 24" fill={body} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    {letter && <text x="50" y="58" textAnchor="middle" fontFamily="Georgia, serif" fontSize="14" fill={INK} style={{ fontStyle: 'italic' }}>{letter}</text>}
  </>
);

const Berry = ({ fill, dark }: { fill: string; dark: string }) => (
  <>
    <circle cx="40" cy="62" r="18" fill={fill} stroke={INK} strokeWidth={S} />
    <circle cx="62" cy="58" r="16" fill={fill} stroke={INK} strokeWidth={S} />
    <circle cx="52" cy="72" r="16" fill={dark} stroke={INK} strokeWidth={S} />
    <path d="M52 42 L55 30 L62 28" fill="none" stroke="#4d7c0f" strokeWidth={S} strokeLinecap="round" />
  </>
);

const Blob = ({ fill, darkerFill }: { fill: string; darkerFill?: string }) => (
  <>
    <path d="M24 52 C20 30, 48 14, 70 24 C88 32, 86 60, 74 76 C58 90, 28 82, 24 52 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    {darkerFill && <path d="M38 40 Q50 34, 62 40 Q60 52, 48 54 Q40 50, 38 40 Z" fill={darkerFill} opacity={0.55} />}
  </>
);

const Bulb = ({ fill, skin }: { fill: string; skin?: string }) => (
  <>
    <path d="M50 18 Q40 20, 34 34 Q28 52, 40 72 Q50 86, 60 72 Q72 52, 66 34 Q60 20, 50 18 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    {skin && <path d="M50 20 L50 72" stroke={skin} strokeWidth={0.8} fill="none" />}
    {skin && <path d="M42 26 L44 70" stroke={skin} strokeWidth={0.6} fill="none" />}
    {skin && <path d="M58 26 L56 70" stroke={skin} strokeWidth={0.6} fill="none" />}
  </>
);

// pantry-section cans/jars with distinct labels
const LabelText = ({ children, y = 62 }: { children: string; y?: number }) => (
  <text x="50" y={y} textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={INK} style={{ fontStyle: 'italic' }}>{children}</text>
);

// ---------------------------------------------------------------------------
// icon registry
// ---------------------------------------------------------------------------

type Icon = () => ReactNode;

const ICONS: Record<string, Icon> = {
  // -------- PRODUCE --------
  banana: () => (
    <>
      <path d="M20 72 C20 48, 36 22, 68 22 C66 30, 62 34, 60 38 C68 34, 76 26, 82 22 C84 48, 72 78, 44 82 C30 82, 22 80, 20 72 Z" fill="#facc15" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M22 72 C34 62, 52 56, 74 40" fill="none" stroke="#a16207" strokeWidth={1.2} />
      <rect x="62" y="18" width="6" height="8" fill="#3f2410" />
    </>
  ),
  apple: () => (
    <>
      <path d="M34 30 Q30 52, 38 74 Q48 88, 62 74 Q72 52, 66 30 Q52 20, 34 30 Z" fill="#dc2626" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M46 28 L48 16 L42 12" fill="none" stroke="#4d2d0f" strokeWidth={S} strokeLinecap="round" />
      <path d="M50 26 Q58 18, 68 20 Q62 28, 50 28" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  lemon: () => (
    <>
      <path d="M22 50 Q22 26, 48 22 Q72 22, 78 42 Q82 58, 70 74 Q48 82, 28 72 Q18 62, 22 50 Z" fill="#facc15" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M16 46 L22 50 M78 42 L84 38" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </>
  ),
  lime: () => (
    <>
      <path d="M22 50 Q22 26, 48 22 Q72 22, 78 42 Q82 58, 70 74 Q48 82, 28 72 Q18 62, 22 50 Z" fill="#84cc16" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="50" cy="50" r="16" fill="none" stroke="#4d7c0f" strokeWidth={0.8} opacity={0.6} />
    </>
  ),
  avocado: () => (
    <>
      <path d="M38 24 Q26 36, 28 58 Q32 80, 50 82 Q68 80, 72 58 Q74 36, 62 24 Q50 18, 38 24 Z" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M40 40 Q34 54, 36 68 Q42 78, 50 78 Q58 78, 64 68 Q66 54, 60 40 Q50 36, 40 40 Z" fill="#d9f0d3" />
      <circle cx="50" cy="56" r="10" fill="#4d2d0f" stroke={INK} strokeWidth={S} />
    </>
  ),
  tomato: () => (
    <>
      <circle cx="50" cy="56" r="28" fill="#dc2626" stroke={INK} strokeWidth={S} />
      <path d="M42 30 L44 22 L56 22 L58 30 M40 30 L48 32 M60 30 L52 32" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  cherry_tomato: () => (
    <>
      <circle cx="36" cy="58" r="18" fill="#dc2626" stroke={INK} strokeWidth={S} />
      <circle cx="62" cy="60" r="18" fill="#dc2626" stroke={INK} strokeWidth={S} />
      <path d="M36 40 Q48 22, 62 42" fill="none" stroke="#65a30d" strokeWidth={S} />
    </>
  ),
  roma_tomato: () => (
    <>
      <ellipse cx="50" cy="56" rx="18" ry="26" fill="#dc2626" stroke={INK} strokeWidth={S} />
      <path d="M44 30 L46 22 L54 22 L56 30 M42 30 L50 32 M58 30 L50 32" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  onion_brown: () => <Bulb fill="#f4a261" skin="#a16207" />,
  onion_red: () => <Bulb fill="#a855f7" skin="#6b21a8" />,
  spring_onion: () => (
    <>
      <path d="M36 82 Q30 60, 38 40 L38 20 M52 82 Q46 60, 52 40 L52 18 M64 82 Q58 60, 62 40 L62 22" stroke="#65a30d" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M36 82 L40 76 L44 82 L48 74 L52 82 L56 74 L60 82" fill="#faf2e3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  garlic: () => (
    <>
      <path d="M40 30 Q34 60, 46 82 Q58 84, 60 80 M60 30 Q66 60, 54 82" fill="#faf2e3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M40 30 Q50 16, 60 30 Q56 40, 50 42 Q44 40, 40 30 Z" fill="#faf2e3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M50 36 L50 82" stroke={INK} strokeWidth={0.6} opacity={0.5} />
    </>
  ),
  ginger: () => (
    <>
      <path d="M22 50 Q24 36, 40 34 Q54 32, 58 42 Q74 40, 78 54 Q76 72, 60 74 Q48 78, 36 72 Q20 70, 22 50 Z" fill="#d4a373" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M34 46 Q40 52, 38 60 M54 48 Q50 54, 56 62 M66 52 Q60 60, 68 66" stroke="#a16207" strokeWidth={0.8} fill="none" />
    </>
  ),
  capsicum_red: () => <Pepper fill="#dc2626" />,
  capsicum_green: () => <Pepper fill="#65a30d" />,
  chilli: () => (
    <>
      <path d="M22 30 Q30 26, 34 32 L34 40 Q56 46, 72 76 Q76 82, 70 84 Q48 82, 32 46 L24 44 Q20 40, 22 30 Z" fill="#dc2626" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M22 30 L18 22 L26 22" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  carrot: () => (
    <>
      <path d="M30 30 L70 30 L56 82 L44 82 Z" fill="#ea580c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M35 30 Q32 18, 40 12 M45 28 Q44 14, 52 10 M55 30 Q58 14, 66 14 M65 30 Q70 18, 78 16" stroke="#65a30d" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  ),
  potato: () => <Blob fill="#c89e6b" darkerFill="#8b5a2b" />,
  sweet_potato: () => <Blob fill="#c2410c" darkerFill="#78350f" />,
  broccoli: () => (
    <>
      <rect x="44" y="60" width="12" height="22" fill="#9ca88a" stroke={INK} strokeWidth={S} />
      <circle cx="34" cy="46" r="14" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="34" r="16" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
      <circle cx="66" cy="46" r="14" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="52" r="12" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
    </>
  ),
  cauliflower: () => (
    <>
      <rect x="44" y="60" width="12" height="22" fill="#b6c892" stroke={INK} strokeWidth={S} />
      <circle cx="34" cy="46" r="14" fill="#faf2e3" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="34" r="16" fill="#faf2e3" stroke={INK} strokeWidth={S} />
      <circle cx="66" cy="46" r="14" fill="#faf2e3" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="52" r="12" fill="#faf2e3" stroke={INK} strokeWidth={S} />
    </>
  ),
  spinach: () => (
    <>
      <path d="M30 70 Q20 50, 32 34 Q44 24, 50 38 Q58 22, 68 36 Q80 52, 70 70 Q50 84, 30 70 Z" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M34 64 Q44 56, 50 48 M54 64 Q60 56, 66 48" stroke="#2d4a0a" strokeWidth={0.8} fill="none" />
    </>
  ),
  rocket: () => (
    <g transform="translate(0,4)"><Leaf fill="#65a30d" vein="#2d4a0a" /><g transform="translate(-14,6) scale(0.7) rotate(-20 50 50)"><Leaf fill="#65a30d" vein="#2d4a0a" /></g><g transform="translate(14,6) scale(0.7) rotate(20 50 50)"><Leaf fill="#65a30d" vein="#2d4a0a" /></g></g>
  ),
  lettuce: () => (
    <>
      <path d="M20 58 Q18 34, 40 30 Q50 22, 58 30 Q80 32, 82 56 Q80 80, 50 82 Q20 80, 20 58 Z" fill="#a3b18a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M32 42 Q38 36, 48 40 M54 34 Q62 34, 70 42 M34 66 Q44 72, 54 66" stroke="#4d7c0f" strokeWidth={0.8} fill="none" />
    </>
  ),
  cucumber: () => (
    <>
      <path d="M20 34 Q22 28, 30 26 L70 70 Q74 76, 70 82 Q64 84, 60 80 L22 40 Q18 38, 20 34 Z" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="30" cy="34" r="1" fill="#faf2e3" /><circle cx="40" cy="46" r="1" fill="#faf2e3" /><circle cx="52" cy="58" r="1" fill="#faf2e3" /><circle cx="62" cy="70" r="1" fill="#faf2e3" />
    </>
  ),
  zucchini: () => (
    <>
      <path d="M18 38 Q20 30, 28 28 L74 72 Q80 78, 74 82 Q66 84, 60 80 L20 44 Q16 42, 18 38 Z" fill="#84cc16" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M18 30 L22 22" stroke="#4d7c0f" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  mushroom: () => (
    <>
      <path d="M20 52 Q22 28, 50 22 Q78 28, 80 52 Q50 60, 20 52 Z" fill="#8b5a2b" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M40 52 L38 82 Q40 86, 50 86 Q60 86, 62 82 L60 52 Z" fill="#faf2e3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="36" cy="42" r="2" fill="#f4e1cb" /><circle cx="50" cy="34" r="3" fill="#f4e1cb" /><circle cx="64" cy="44" r="2" fill="#f4e1cb" />
    </>
  ),
  coriander: () => (
    <g transform="translate(0,10) scale(0.9)"><path d="M50 60 L50 90" stroke="#4d7c0f" strokeWidth={2} /><g transform="translate(-12,0)"><Leaf fill="#65a30d" vein="#2d4a0a" /></g><g transform="translate(12,0)"><Leaf fill="#65a30d" vein="#2d4a0a" /></g><g transform="translate(0,-14) scale(0.85)"><Leaf fill="#65a30d" vein="#2d4a0a" /></g></g>
  ),
  parsley: () => (
    <g transform="translate(0,8) scale(0.85)"><path d="M50 70 L50 94" stroke="#4d7c0f" strokeWidth={2} /><circle cx="36" cy="46" r="10" fill="#4d7c0f" stroke={INK} strokeWidth={S} /><circle cx="50" cy="34" r="11" fill="#4d7c0f" stroke={INK} strokeWidth={S} /><circle cx="64" cy="46" r="10" fill="#4d7c0f" stroke={INK} strokeWidth={S} /><circle cx="44" cy="56" r="9" fill="#4d7c0f" stroke={INK} strokeWidth={S} /><circle cx="56" cy="56" r="9" fill="#4d7c0f" stroke={INK} strokeWidth={S} /></g>
  ),
  basil: () => (
    <g transform="translate(0,4)"><Leaf fill="#4d7c0f" vein="#2d4a0a" /><g transform="translate(-10,10) scale(0.65) rotate(-30 50 50)"><Leaf fill="#4d7c0f" vein="#2d4a0a" /></g><g transform="translate(10,10) scale(0.65) rotate(30 50 50)"><Leaf fill="#4d7c0f" vein="#2d4a0a" /></g></g>
  ),
  mint: () => (
    <g transform="translate(0,4)"><Leaf fill="#16a34a" vein="#14532d" /><g transform="translate(-14,8) scale(0.6) rotate(-40 50 50)"><Leaf fill="#16a34a" vein="#14532d" /></g><g transform="translate(14,8) scale(0.6) rotate(40 50 50)"><Leaf fill="#16a34a" vein="#14532d" /></g></g>
  ),
  sage: () => (
    <g transform="translate(0,4)"><Leaf fill="#9ca88a" vein="#4d7c0f" /><g transform="translate(-12,6) scale(0.65)"><Leaf fill="#9ca88a" vein="#4d7c0f" /></g><g transform="translate(12,6) scale(0.65)"><Leaf fill="#9ca88a" vein="#4d7c0f" /></g></g>
  ),
  corn: () => (
    <>
      <path d="M40 16 Q34 32, 36 56 Q38 82, 50 84 Q62 82, 64 56 Q66 32, 60 16 Q50 10, 40 16 Z" fill="#facc15" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {[0,1,2,3,4,5,6,7].map(i => (<circle key={i} cx={42 + (i%2)*6} cy={22 + (Math.floor(i/2))*14} r={2} fill="#a16207" />))}
      <path d="M40 18 Q30 8, 22 14 Q28 28, 40 24" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  pumpkin: () => (
    <>
      <ellipse cx="36" cy="56" rx="18" ry="24" fill="#ea580c" stroke={INK} strokeWidth={S} />
      <ellipse cx="50" cy="56" rx="22" ry="26" fill="#ea580c" stroke={INK} strokeWidth={S} />
      <ellipse cx="64" cy="56" rx="18" ry="24" fill="#ea580c" stroke={INK} strokeWidth={S} />
      <path d="M50 32 L50 22 L54 16 L60 20" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  eggplant: () => (
    <>
      <path d="M30 46 Q26 78, 54 82 Q78 80, 74 56 Q68 38, 50 34 Q36 36, 30 46 Z" fill="#6b21a8" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M42 32 L46 22 L56 20 L60 26 L52 38" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M42 56 Q46 50, 50 56" stroke="#a855f7" strokeWidth={0.8} fill="none" opacity={0.6} />
    </>
  ),
  green_bean: () => (
    <>
      <path d="M20 56 Q22 46, 36 44 Q50 44, 62 52 Q76 56, 80 48" fill="none" stroke="#65a30d" strokeWidth={6} strokeLinecap="round" />
      <path d="M24 58 Q26 48, 38 46 Q52 46, 64 54 Q78 58, 82 50" fill="none" stroke="#4d7c0f" strokeWidth={2} strokeLinecap="round" />
      <circle cx="32" cy="56" r="2" fill="#4d7c0f" /><circle cx="44" cy="50" r="2" fill="#4d7c0f" /><circle cx="56" cy="52" r="2" fill="#4d7c0f" />
    </>
  ),
  celery: () => (
    <>
      <path d="M40 24 L44 84 M50 20 L50 84 M60 24 L56 84" stroke={INK} strokeWidth={S} fill="none" />
      <path d="M36 24 L64 24 L60 84 L40 84 Z" fill="#a3b18a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M36 24 L44 16 L56 16 L64 24" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  kale: () => (
    <g transform="translate(0,2)"><path d="M30 80 Q20 56, 28 38 Q40 24, 50 38 Q60 22, 72 36 Q82 56, 70 80 Q50 88, 30 80 Z" fill="#2d4a0a" stroke={INK} strokeWidth={S} strokeLinejoin="round" /><path d="M30 70 Q38 56, 44 44 M56 44 Q62 56, 70 70 M50 42 L50 80" stroke="#65a30d" strokeWidth={0.8} fill="none" /></g>
  ),
  leek: () => (
    <>
      <rect x="42" y="12" width="16" height="48" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
      <rect x="42" y="60" width="16" height="28" fill="#faf2e3" stroke={INK} strokeWidth={S} />
      <path d="M42 12 L46 4 L54 4 L58 12" stroke={INK} strokeWidth={S} fill="#4d7c0f" strokeLinejoin="round" />
    </>
  ),
  asparagus: () => (
    <>
      <path d="M34 88 L38 30 Q38 18, 42 16 Q46 18, 46 30 L42 88 Z" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M46 88 L50 26 Q50 14, 54 12 Q58 14, 58 26 L54 88 Z" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M58 88 L62 30 Q62 18, 66 16 Q70 18, 70 30 L66 88 Z" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  beetroot: () => (
    <>
      <path d="M28 54 Q22 76, 50 82 Q78 76, 72 54 Q66 38, 50 36 Q34 38, 28 54 Z" fill="#7c2d12" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M42 36 L44 22 M50 34 L50 14 M58 36 L56 20" stroke="#65a30d" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M42 22 Q38 16, 36 20 M50 14 Q44 12, 46 18 M56 20 Q62 14, 64 20" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  snow_pea: () => (
    <>
      <path d="M18 54 Q18 40, 34 40 Q54 36, 74 46 Q84 52, 78 62 Q60 64, 42 62 Q22 66, 18 54 Z" fill="#84cc16" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="36" cy="52" r="3" fill="#4d7c0f" /><circle cx="48" cy="50" r="3" fill="#4d7c0f" /><circle cx="60" cy="52" r="3" fill="#4d7c0f" />
    </>
  ),
  cabbage: () => (
    <>
      <circle cx="50" cy="54" r="30" fill="#a3b18a" stroke={INK} strokeWidth={S} />
      <path d="M32 40 Q40 30, 50 30 Q60 30, 68 40 M28 54 Q40 48, 50 48 Q60 48, 72 54 M32 70 Q40 76, 50 76 Q60 76, 68 70" stroke="#4d7c0f" strokeWidth={1} fill="none" />
      <circle cx="50" cy="54" r="10" fill="#bbcc99" stroke={INK} strokeWidth={1} opacity={0.6} />
    </>
  ),
  bok_choy: () => (
    <>
      <path d="M30 82 Q20 50, 40 32 Q48 24, 50 32 Q52 24, 60 32 Q80 50, 70 82 Q50 84, 30 82 Z" fill="#2d4a0a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M40 82 Q36 60, 44 44 L48 82 Z M52 82 L56 44 Q64 60, 60 82 Z" fill="#faf2e3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  strawberry: () => (
    <>
      <path d="M30 34 L70 34 L58 82 Q50 88, 42 82 Z" fill="#dc2626" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M30 34 L38 20 L46 28 L50 18 L54 28 L62 20 L70 34" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {[[42,48],[50,54],[58,48],[46,62],[54,62],[48,74]].map(([x,y],i) => (<circle key={i} cx={x} cy={y} r={1.5} fill="#facc15" />))}
    </>
  ),
  blueberry: () => <Berry fill="#1e40af" dark="#172554" />,
  orange: () => (
    <>
      <circle cx="50" cy="54" r="28" fill="#f97316" stroke={INK} strokeWidth={S} />
      <path d="M44 28 L46 20 L54 20 L56 28" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="54" r="22" fill="none" stroke="#c2410c" strokeWidth={0.6} opacity={0.6} />
    </>
  ),
  grape: () => (
    <>
      <circle cx="40" cy="46" r="10" fill="#6b21a8" stroke={INK} strokeWidth={S} />
      <circle cx="56" cy="42" r="10" fill="#6b21a8" stroke={INK} strokeWidth={S} />
      <circle cx="48" cy="56" r="10" fill="#6b21a8" stroke={INK} strokeWidth={S} />
      <circle cx="62" cy="56" r="10" fill="#6b21a8" stroke={INK} strokeWidth={S} />
      <circle cx="42" cy="66" r="10" fill="#6b21a8" stroke={INK} strokeWidth={S} />
      <circle cx="56" cy="72" r="10" fill="#6b21a8" stroke={INK} strokeWidth={S} />
      <path d="M46 28 Q54 22, 60 30" fill="none" stroke="#4d7c0f" strokeWidth={S} />
    </>
  ),
  mango: () => (
    <>
      <path d="M20 48 Q22 28, 42 26 Q64 22, 76 38 Q86 58, 70 74 Q44 84, 24 72 Q16 60, 20 48 Z" fill="#f59e0b" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M42 28 Q50 20, 60 24" fill="none" stroke="#dc2626" strokeWidth={2} />
    </>
  ),
  pineapple: () => (
    <>
      <ellipse cx="50" cy="56" rx="22" ry="28" fill="#eab308" stroke={INK} strokeWidth={S} />
      <path d="M28 22 L34 10 L38 20 L44 8 L50 22 L56 8 L62 20 L66 10 L72 22" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {[[40,42],[52,42],[64,42],[44,54],[56,54],[40,66],[52,66],[64,66]].map(([x,y],i) => (<path key={i} d={`M${x-3} ${y} L${x} ${y-3} L${x+3} ${y} L${x} ${y+3} Z`} fill="#a16207" />))}
    </>
  ),

  // -------- MEAT --------
  chicken_breast: () => <Blob fill="#f4d0c3" darkerFill="#e8b9a5" />,
  chicken_thigh: () => <Blob fill="#f4a261" darkerFill="#d97706" />,
  chicken_whole: () => (
    <>
      <path d="M30 60 Q20 40, 40 30 Q68 22, 78 40 Q82 58, 72 72 Q50 84, 32 78 Q26 72, 30 60 Z" fill="#f4e1cb" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <ellipse cx="42" cy="40" rx="8" ry="6" fill="#e8b9a5" />
      <path d="M66 78 L72 90 M76 74 L84 86" stroke={INK} strokeWidth={S} strokeLinecap="round" />
    </>
  ),
  beef_mince: () => (
    <>
      <path d="M20 58 Q24 42, 44 40 Q62 36, 78 48 Q84 62, 76 74 Q56 82, 38 78 Q22 72, 20 58 Z" fill="#7f1d1d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {[[34,54],[46,50],[58,58],[40,66],[52,68],[64,64]].map(([x,y],i) => (<circle key={i} cx={x} cy={y} r={3} fill="#991b1b" />))}
    </>
  ),
  pork_mince: () => (
    <>
      <path d="M20 58 Q24 42, 44 40 Q62 36, 78 48 Q84 62, 76 74 Q56 82, 38 78 Q22 72, 20 58 Z" fill="#f4a6a6" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {[[34,54],[46,50],[58,58],[40,66],[52,68],[64,64]].map(([x,y],i) => (<circle key={i} cx={x} cy={y} r={3} fill="#e11d48" opacity={0.6} />))}
    </>
  ),
  lamb_mince: () => (
    <>
      <path d="M20 58 Q24 42, 44 40 Q62 36, 78 48 Q84 62, 76 74 Q56 82, 38 78 Q22 72, 20 58 Z" fill="#b91c1c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      {[[34,54],[46,50],[58,58],[40,66],[52,68],[64,64]].map(([x,y],i) => (<circle key={i} cx={x} cy={y} r={3} fill="#fae7e7" opacity={0.8} />))}
    </>
  ),
  beef_steak: () => (
    <>
      <path d="M18 46 Q22 30, 48 28 Q76 30, 82 50 Q78 70, 48 72 Q20 70, 18 46 Z" fill="#991b1b" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M30 40 Q40 36, 56 44 M40 56 Q50 52, 62 58" stroke="#fae7e7" strokeWidth={1.5} fill="none" />
      <path d="M18 46 Q22 44, 30 46 Q34 50, 30 52 Q22 50, 18 46 Z" fill="#faf2e3" stroke={INK} strokeWidth={S} />
    </>
  ),
  lamb_cutlet: () => (
    <>
      <circle cx="58" cy="50" r="22" fill="#b91c1c" stroke={INK} strokeWidth={S} />
      <path d="M46 50 Q50 44, 50 50 Q50 56, 46 50 Z" fill="#fae7e7" />
      <path d="M38 50 L18 44 L18 56 Z" fill="#faf2e3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  snags: () => (
    <>
      <path d="M20 50 Q18 42, 26 40 L74 40 Q82 42, 80 50 Q82 58, 74 60 L26 60 Q18 58, 20 50 Z" fill="#c2410c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M24 48 L26 52 M34 48 L36 52 M44 48 L46 52 M54 48 L56 52 M64 48 L66 52 M74 48 L76 52" stroke="#78350f" strokeWidth={1} />
    </>
  ),
  bacon: () => (
    <>
      <path d="M14 34 L86 44 L86 56 L14 46 Z" fill="#f4a6a6" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M14 46 L86 56 L86 68 L14 58 Z" fill="#b91c1c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  prawns: () => (
    <>
      <path d="M30 40 Q20 50, 24 62 Q32 72, 48 70 Q66 62, 76 50 Q72 38, 60 36 Q44 34, 30 40 Z" fill="#ef4444" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M26 62 L18 70 M76 50 L84 42" stroke={INK} strokeWidth={S} strokeLinecap="round" />
      <circle cx="40" cy="46" r="2" fill={INK} />
    </>
  ),
  salmon: () => (
    <>
      <path d="M20 56 Q28 38, 52 38 Q72 40, 80 50 Q78 60, 66 66 Q44 72, 28 66 Q20 60, 20 56 Z" fill="#fb923c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M28 50 Q36 48, 42 52 M46 52 Q54 50, 60 54 M66 52 Q72 52, 74 56" stroke="#fef3c7" strokeWidth={1.2} fill="none" />
      <path d="M80 50 L90 42 L88 62 Z" fill="#fb923c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  barramundi: () => (
    <>
      <path d="M18 50 Q24 32, 50 30 Q72 32, 82 50 Q74 66, 50 70 Q26 68, 18 50 Z" fill="#94a3b8" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="36" cy="46" r="2.5" fill={INK} />
      <path d="M82 50 L90 40 L90 60 Z" fill="#94a3b8" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M50 36 Q52 40, 50 44 M58 38 Q60 44, 58 50" stroke={INK} strokeWidth={0.8} fill="none" opacity={0.5} />
    </>
  ),
  ham_sliced: () => (
    <>
      <circle cx="50" cy="54" r="28" fill="#f4a6a6" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="54" r="22" fill="none" stroke="#dc2626" strokeWidth={0.6} opacity={0.5} />
      <path d="M30 40 Q50 60, 70 40" stroke="#e11d48" strokeWidth={1.2} fill="none" opacity={0.6} />
    </>
  ),
  pork_belly: () => (
    <>
      <path d="M14 34 L86 44 L86 70 L14 60 Z" fill="#f4a6a6" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M14 44 L86 54" stroke="#e11d48" strokeWidth={2} />
      <path d="M14 52 L86 62" stroke="#e11d48" strokeWidth={2} />
    </>
  ),
  chorizo: () => (
    <>
      <rect x="18" y="42" width="64" height="18" rx="9" fill="#b91c1c" stroke={INK} strokeWidth={S} />
      {[24,36,48,60,72].map(x => (<circle key={x} cx={x} cy={51} r={2.5} fill="#fff" opacity={0.5} />))}
      <path d="M18 51 Q14 46, 12 50" stroke={INK} strokeWidth={S} fill="none" />
    </>
  ),
  duck: () => (
    <>
      <path d="M22 60 Q24 40, 48 38 Q70 40, 78 52 Q76 64, 60 68 Q38 72, 24 68 Q20 64, 22 60 Z" fill="#78350f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M22 60 Q18 64, 20 70" stroke={INK} strokeWidth={S} fill="none" />
    </>
  ),
  scallop: () => (
    <>
      <path d="M20 64 Q22 44, 50 32 Q78 44, 80 64 Z" fill="#fef3c7" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M30 64 L28 44 M40 64 L38 40 M50 64 L50 34 M60 64 L62 40 M70 64 L72 44" stroke={INK} strokeWidth={0.8} fill="none" />
    </>
  ),
  mussel: () => (
    <>
      <path d="M24 40 Q40 30, 70 44 Q82 56, 80 68 Q60 74, 36 66 Q20 54, 24 40 Z" fill="#1e3a5f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M32 48 Q48 52, 68 58" stroke="#3b5998" strokeWidth={0.8} fill="none" />
    </>
  ),
  calamari: () => (
    <>
      <path d="M30 30 Q20 46, 28 64 Q40 72, 50 64 Q60 72, 72 64 Q80 46, 70 30 Q50 26, 30 30 Z" fill="#f4e1cb" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M32 66 Q30 80, 36 86 M42 68 Q40 82, 46 88 M52 68 Q54 82, 48 88 M60 66 Q62 80, 56 86 M66 64 Q70 80, 64 86" stroke={INK} strokeWidth={S} fill="none" strokeLinecap="round" />
    </>
  ),

  // -------- DAIRY --------
  milk: () => (
    <>
      <path d="M36 12 L36 20 L30 30 L30 86 Q30 90, 34 90 L66 90 Q70 90, 70 86 L70 30 L64 20 L64 12 Z" fill="#fff" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <rect x="38" y="50" width="24" height="20" fill="#0ea5e9" stroke={INK} strokeWidth={1} />
      <text x="50" y="65" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fill="#fff" style={{ fontStyle: 'italic' }}>M</text>
    </>
  ),
  butter: () => (
    <>
      <path d="M14 40 L86 30 L86 60 L14 70 Z" fill="#facc15" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M14 40 L20 34 L86 26 L90 32 Z" fill="#fef08a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    </>
  ),
  eggs: () => (
    <>
      <ellipse cx="38" cy="58" rx="16" ry="22" fill="#fef3c7" stroke={INK} strokeWidth={S} />
      <ellipse cx="62" cy="52" rx="16" ry="22" fill="#fef3c7" stroke={INK} strokeWidth={S} />
      <circle cx="38" cy="54" r="3" fill="#fbbf24" opacity={0.5} />
      <circle cx="62" cy="48" r="3" fill="#fbbf24" opacity={0.5} />
    </>
  ),
  cheddar: () => (
    <>
      <path d="M20 34 L80 30 L78 70 L22 66 Z" fill="#facc15" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M20 34 L30 26 L78 24 L80 30" fill="#fde68a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <circle cx="38" cy="46" r="2" fill="#fef3c7" /><circle cx="54" cy="52" r="3" fill="#fef3c7" /><circle cx="66" cy="44" r="2" fill="#fef3c7" />
    </>
  ),
  parmesan: () => (
    <>
      <path d="M22 72 L50 22 L78 72 Z" fill="#fde68a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M34 60 L66 60" stroke={INK} strokeWidth={0.8} opacity={0.5} />
      <circle cx="44" cy="50" r="1" fill="#a16207" /><circle cx="54" cy="46" r="1" fill="#a16207" /><circle cx="60" cy="56" r="1" fill="#a16207" />
    </>
  ),
  feta: () => (
    <>
      <path d="M24 36 L76 36 L72 74 L28 74 Z" fill="#fff" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M36 42 L44 42 M52 46 L66 46 M32 52 L42 52 M56 56 L70 56 M40 64 L58 64" stroke={INK} strokeWidth={0.6} opacity={0.4} />
    </>
  ),
  yoghurt: () => <Tin body="#fff" label="#fecaca" letter="Y" />,
  cream: () => <Tin body="#fef9c3" label="#fef08a" letter="C" />,
  mozzarella: () => (
    <>
      <circle cx="50" cy="50" r="28" fill="#fff" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="50" r="20" fill="none" stroke="#e5e7eb" strokeWidth={1} />
      <circle cx="44" cy="46" r="2" fill="#e5e7eb" opacity={0.5} />
    </>
  ),
  haloumi: () => (
    <>
      <rect x="24" y="36" width="52" height="30" fill="#fde68a" stroke={INK} strokeWidth={S} />
      <path d="M30 42 L70 42 M30 50 L70 50 M30 58 L70 58" stroke={INK} strokeWidth={0.6} opacity={0.5} />
    </>
  ),
  ricotta: () => <Tin body="#fff" label="#fef3c7" letter="R" />,
  brie: () => (
    <>
      <path d="M22 66 L50 22 L78 66 Z" fill="#fef9c3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M22 66 L50 56 L78 66" stroke={INK} strokeWidth={S} fill="none" />
      <ellipse cx="50" cy="40" rx="6" ry="2" fill="#fef08a" opacity={0.6} />
    </>
  ),
  mascarpone: () => <Tin body="#fff" label="#fef9c3" letter="M" />,
  sour_cream: () => <Tin body="#fff" label="#f3f4f6" letter="S" />,

  // -------- PANTRY (jars, bottles, packets, cans) --------
  pasta: () => <Packet body="#fde68a" label="#facc15" letter="P" />,
  spaghetti: () => (
    <>
      <rect x="30" y="18" width="40" height="72" rx="4" fill="#fef3c7" stroke={INK} strokeWidth={S} />
      {[36,42,48,54,60,66].map(x => (<line key={x} x1={x} y1={22} x2={x} y2={86} stroke="#fbbf24" strokeWidth={1.4} />))}
    </>
  ),
  rice_jasmine: () => <Packet body="#fff" label="#fef9c3" letter="J" />,
  rice_basmati: () => <Packet body="#fff" label="#fef3c7" letter="B" />,
  bread: () => (
    <>
      <path d="M14 44 Q14 34, 26 34 L74 34 Q86 34, 86 44 L86 68 Q84 74, 76 74 L24 74 Q16 74, 14 68 Z" fill="#d4a373" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M14 44 Q30 24, 50 28 Q70 24, 86 44" fill="#e8c497" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
      <path d="M30 44 L28 74 M50 44 L50 74 M70 44 L72 74" stroke={INK} strokeWidth={0.6} opacity={0.3} />
    </>
  ),
  wrap: () => (
    <>
      <circle cx="50" cy="54" r="28" fill="#f4e1cb" stroke={INK} strokeWidth={S} />
      <circle cx="50" cy="54" r="28" fill="url(#w)" opacity={0.3} />
      <circle cx="42" cy="48" r="1.5" fill="#a16207" /><circle cx="58" cy="44" r="1" fill="#a16207" /><circle cx="60" cy="58" r="1.5" fill="#a16207" /><circle cx="40" cy="62" r="1" fill="#a16207" />
    </>
  ),
  olive_oil: () => <Bottle body="#84cc16" cap="#4d2d0f" label="#65a30d" letter="O" />,
  vegetable_oil: () => <Bottle body="#fde68a" cap="#4d2d0f" label="#facc15" letter="V" />,
  soy_sauce: () => <Bottle body="#3f2410" cap="#dc2626" label="#dc2626" letter="S" />,
  fish_sauce: () => <Bottle body="#c2410c" cap="#3f2410" label="#fde68a" letter="F" />,
  oyster_sauce: () => <Bottle body="#78350f" cap="#3f2410" label="#fef3c7" letter="O" />,
  vinegar_balsamic: () => <Bottle body="#3f2410" cap="#7c2d12" label="#a16207" letter="B" />,
  salt: () => <Tin body="#fff" label="#e5e7eb" letter="S" />,
  pepper: () => <Tin body="#3f2410" label="#78350f" letter="P" />,
  sugar: () => <Packet body="#fff" label="#fef9c3" letter="Sug" />,
  flour: () => <Packet body="#fff" label="#f3f4f6" letter="F" />,
  tinned_tomato: () => <Tin body="#dc2626" label="#fef3c7" letter="T" />,
  tinned_chickpea: () => <Tin body="#a16207" label="#fef3c7" letter="Ch" />,
  tinned_bean: () => <Tin body="#7c2d12" label="#fef3c7" letter="B" />,
  tinned_tuna: () => (<>
    <ellipse cx="50" cy="58" rx="28" ry="8" fill="#0891b2" stroke={INK} strokeWidth={S} />
    <rect x="22" y="36" width="56" height="22" fill="#0891b2" stroke={INK} strokeWidth={S} />
    <ellipse cx="50" cy="36" rx="28" ry="6" fill="#67e8f9" stroke={INK} strokeWidth={S} />
    <rect x="26" y="42" width="48" height="10" fill="#fef3c7" />
    <text x="50" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={INK} style={{ fontStyle: 'italic' }}>Tuna</text>
  </>),
  tinned_black_bean: () => <Tin body="#1f2937" label="#fef3c7" letter="BB" />,
  coconut_milk: () => <Tin body="#fff" label="#0891b2" letter="Co" />,
  curry_paste_red: () => <Tin body="#dc2626" label="#7f1d1d" letter="R" />,
  curry_paste_green: () => <Tin body="#65a30d" label="#4d7c0f" letter="G" />,
  stock_chicken: () => <Tin body="#fef3c7" label="#eab308" letter="K" />,
  stock_veg: () => <Tin body="#65a30d" label="#4d7c0f" letter="V" />,
  honey: () => <Bottle body="#f59e0b" cap="#78350f" label="#fef3c7" letter="H" />,
  peanut_butter: () => <Tin body="#a16207" label="#fde68a" letter="PB" />,
  vegemite: () => (<>
    <rect x="30" y="22" width="40" height="56" rx="2" fill="#3f2410" stroke={INK} strokeWidth={S} />
    <rect x="32" y="36" width="36" height="26" fill="#eab308" />
    <text x="50" y="54" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fontWeight="700" fill="#3f2410">V</text>
  </>),
  weetbix: () => <Packet body="#a16207" label="#dc2626" letter="W" />,
  oats: () => <Packet body="#fde68a" label="#eab308" letter="O" />,
  muesli: () => <Packet body="#a16207" label="#fef3c7" letter="M" />,
  cumin: () => <Tin body="#a16207" label="#78350f" letter="Cu" />,
  paprika: () => <Tin body="#dc2626" label="#7f1d1d" letter="Pp" />,
  chilli_powder: () => <Tin body="#b91c1c" label="#7f1d1d" letter="Ch" />,
  cinnamon: () => <Tin body="#78350f" label="#a16207" letter="Ci" />,
  curry_powder: () => <Tin body="#eab308" label="#a16207" letter="Cy" />,
  chickpea_dry: () => <Packet body="#fde68a" label="#a16207" letter="Cp" />,
  lentil_red: () => <Packet body="#dc2626" label="#f4a261" letter="L" />,
  breadcrumbs: () => <Tin body="#fef3c7" label="#d4a373" letter="Bc" />,
  tortilla: () => (<>
    <circle cx="50" cy="54" r="28" fill="#fef3c7" stroke={INK} strokeWidth={S} />
    <circle cx="40" cy="48" r="1" fill="#a16207" /><circle cx="56" cy="44" r="1.5" fill="#a16207" /><circle cx="60" cy="60" r="1" fill="#a16207" />
  </>),
  couscous: () => <Packet body="#fde68a" label="#facc15" letter="Cs" />,
  quinoa: () => <Packet body="#fff" label="#fde68a" letter="Q" />,
  noodle_egg: () => (<>
    <Packet body="#fde68a" label="#facc15" letter="N" />
  </>),
  noodle_rice: () => <Packet body="#fff" label="#f3f4f6" letter="N" />,
  polenta: () => <Packet body="#facc15" label="#eab308" letter="Pl" />,
  baking_powder: () => <Tin body="#fff" label="#e5e7eb" letter="B" />,
  yeast: () => <Sachet body="#fde68a" letter="Y" />,
  vanilla: () => <Bottle body="#a16207" cap="#3f2410" label="#fef3c7" letter="V" />,
  turmeric: () => <Tin body="#facc15" label="#a16207" letter="Tu" />,
  sesame_oil: () => <Bottle body="#a16207" cap="#3f2410" label="#fde68a" letter="S" />,
  dijon: () => <Tin body="#fde68a" label="#a16207" letter="D" />,
  mayo: () => <Tin body="#fff" label="#facc15" letter="My" />,
  sriracha: () => <Bottle body="#dc2626" cap="#65a30d" label="#dc2626" letter="Sr" />,
  maple_syrup: () => <Bottle body="#a16207" cap="#3f2410" label="#d4a373" letter="Mp" />,
  dark_chocolate: () => (<>
    <rect x="22" y="28" width="56" height="44" rx="2" fill="#3f2410" stroke={INK} strokeWidth={S} />
    <path d="M22 44 L78 44 M22 56 L78 56 M36 28 L36 72 M50 28 L50 72 M64 28 L64 72" stroke="#78350f" strokeWidth={S} />
  </>),
  cocoa: () => <Tin body="#78350f" label="#3f2410" letter="Co" />,
  almond: () => (<>
    <ellipse cx="38" cy="52" rx="10" ry="16" fill="#d4a373" stroke={INK} strokeWidth={S} transform="rotate(-10 38 52)" />
    <ellipse cx="58" cy="56" rx="10" ry="16" fill="#d4a373" stroke={INK} strokeWidth={S} transform="rotate(15 58 56)" />
    <ellipse cx="48" cy="68" rx="10" ry="16" fill="#d4a373" stroke={INK} strokeWidth={S} transform="rotate(-5 48 68)" />
  </>),
  cashew: () => (<>
    <path d="M30 60 Q26 44, 42 40 Q58 42, 56 50 Q52 44, 48 46 Q54 54, 62 52 Q74 50, 78 58 Q76 72, 62 74 Q44 72, 30 60 Z" fill="#f4e1cb" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
  </>),
  walnut: () => (<>
    <circle cx="50" cy="54" r="24" fill="#a16207" stroke={INK} strokeWidth={S} />
    <path d="M50 30 L50 78 M30 54 L70 54 M36 38 Q50 48, 64 38 M36 70 Q50 60, 64 70" stroke="#78350f" strokeWidth={1.2} fill="none" />
  </>),
  raisin: () => (<>
    {[[34,40],[46,36],[58,42],[36,54],[50,52],[62,56],[40,68],[54,66]].map(([x,y],i) => (<ellipse key={i} cx={x} cy={y} rx={5} ry={4} fill="#4d2d0f" stroke={INK} strokeWidth={1} />))}
  </>),

  // -------- FROZEN --------
  peas_frozen: () => (<>
    {[[30,40],[44,36],[58,40],[68,48],[34,54],[48,52],[62,54],[40,66],[54,64],[64,68],[30,72]].map(([x,y],i) => (<circle key={i} cx={x} cy={y} r={5} fill="#4d7c0f" stroke={INK} strokeWidth={1} />))}
  </>),
  berries_frozen: () => (<>
    <Berry fill="#1e40af" dark="#172554" />
  </>),
  pastry_puff: () => (<>
    <path d="M18 42 L82 42 L78 74 L22 74 Z" fill="#fde68a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M18 42 Q24 32, 36 34 Q44 26, 54 34 Q66 28, 74 36 Q82 34, 82 42" fill="#facc15" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M30 48 L30 68 M44 48 L44 68 M58 48 L58 68 M72 48 L72 68" stroke={INK} strokeWidth={0.6} opacity={0.3} />
  </>),
  ice_cream: () => (<>
    <path d="M34 58 L50 90 L66 58 Z" fill="#d4a373" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <circle cx="40" cy="46" r="10" fill="#f4a6a6" stroke={INK} strokeWidth={S} />
    <circle cx="60" cy="46" r="10" fill="#fef3c7" stroke={INK} strokeWidth={S} />
    <circle cx="50" cy="34" r="10" fill="#d4a373" stroke={INK} strokeWidth={S} />
  </>),
  corn_frozen: () => (<g><g transform="scale(0.9) translate(5,5)">{ICONS.corn ? ICONS.corn() : null}</g><rect x="12" y="12" width="16" height="16" fill="#e0f2fe" stroke={INK} strokeWidth={1} opacity={0.7} /><text x="20" y="24" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill={INK}>❄</text></g>),
  pastry_filo: () => <Packet body="#fde68a" label="#eab308" letter="Ph" />,

  // -------- OTHER --------
  coffee: () => (<>
    <rect x="32" y="30" width="36" height="50" rx="4" fill="#78350f" stroke={INK} strokeWidth={S} />
    <rect x="36" y="46" width="28" height="18" fill="#fef3c7" />
    <text x="50" y="58" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill={INK} style={{ fontStyle: 'italic' }}>Coffee</text>
    <path d="M40 30 L40 22 L60 22 L60 30" fill="none" stroke={INK} strokeWidth={S} />
  </>),
  tea: () => (<>
    <rect x="28" y="30" width="44" height="50" fill="#fef3c7" stroke={INK} strokeWidth={S} />
    <rect x="28" y="30" width="44" height="14" fill="#dc2626" stroke={INK} strokeWidth={S} />
    <text x="50" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#fff" style={{ fontStyle: 'italic' }}>TEA</text>
    <path d="M40 48 L60 48 M40 54 L60 54 M40 60 L60 60 M40 66 L60 66" stroke={INK} strokeWidth={0.6} />
  </>),
  wine_white: () => <Bottle body="#fef3c7" cap="#a16207" label="#eab308" letter="W" />,
  wine_red: () => <Bottle body="#7f1d1d" cap="#3f2410" label="#a16207" letter="R" />,
  beer: () => (<>
    <rect x="34" y="24" width="32" height="66" rx="4" fill="#92400e" stroke={INK} strokeWidth={S} />
    <rect x="38" y="44" width="24" height="30" fill="#facc15" />
    <path d="M38 24 L38 18 L62 18 L62 24" fill="none" stroke={INK} strokeWidth={S} />
  </>),
  tofu: () => (<>
    <rect x="24" y="36" width="52" height="34" rx="3" fill="#fefbf2" stroke={INK} strokeWidth={S} />
    <path d="M24 46 L76 46 M24 58 L76 58" stroke={INK} strokeWidth={0.5} opacity={0.3} />
    <path d="M32 36 L32 70 M44 36 L44 70 M56 36 L56 70 M68 36 L68 70" stroke={INK} strokeWidth={0.5} opacity={0.3} />
  </>),
  miso: () => <Tin body="#a16207" label="#78350f" letter="Mi" />,
  nori: () => (<>
    <rect x="26" y="22" width="48" height="58" fill="#1f2937" stroke={INK} strokeWidth={S} />
    <rect x="26" y="22" width="48" height="58" fill="url(#noriTex)" opacity={0.3} />
    <path d="M30 30 L70 30 M30 40 L70 40 M30 50 L70 50 M30 60 L70 60 M30 70 L70 70" stroke="#065f46" strokeWidth={0.8} opacity={0.4} />
  </>),
  kimchi: () => <Tin body="#dc2626" label="#7f1d1d" letter="Ki" />,
  gochujang: () => <Tin body="#b91c1c" label="#7f1d1d" letter="G" />,
  cream_cheese: () => <Tin body="#fff" label="#fef3c7" letter="CC" />,
  worcestershire: () => <Bottle body="#3f2410" cap="#dc2626" label="#fef3c7" letter="W" />,
  stock_beef: () => <Tin body="#78350f" label="#92400e" letter="Bf" />,
  passionfruit: () => (<>
    <circle cx="50" cy="54" r="24" fill="#7c2d12" stroke={INK} strokeWidth={S} />
    <ellipse cx="50" cy="54" rx="18" ry="14" fill="#fde68a" />
    {[[46,50],[54,52],[50,58],[44,56],[56,58],[48,48]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={1.5} ry={2} fill="#1f2937" />)}
  </>),
  paneer: () => (<>
    <rect x="24" y="36" width="52" height="34" rx="2" fill="#fffbf2" stroke={INK} strokeWidth={S} />
    <path d="M30 44 L70 44 M30 52 L70 52 M30 60 L70 60" stroke={INK} strokeWidth={0.4} opacity={0.4} />
  </>),
  chicken_wing: () => (<>
    <path d="M28 60 Q26 46, 36 36 Q50 30, 66 34 Q78 42, 76 54 Q72 70, 54 74 Q36 74, 28 60 Z" fill="#d4a373" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M30 62 Q40 52, 56 50 Q66 50, 68 56" stroke="#a16207" strokeWidth={0.8} fill="none" opacity={0.7} />
    <ellipse cx="22" cy="62" rx="6" ry="4" fill="#faf2e3" stroke={INK} strokeWidth={S} />
    <path d="M34 40 Q38 32, 48 34 M48 32 Q54 28, 60 34" stroke={INK} strokeWidth={1} fill="none" opacity={0.4} />
  </>),
  pork_shoulder: () => (<>
    <path d="M18 58 Q20 36, 44 32 Q68 28, 80 46 Q86 64, 72 76 Q48 82, 26 74 Q16 68, 18 58 Z" fill="#f4a6a6" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M36 48 Q48 46, 60 50 M30 58 Q50 56, 68 60" stroke="#e11d48" strokeWidth={1.4} fill="none" opacity={0.5} />
    <path d="M18 58 Q12 54, 14 48" stroke={INK} strokeWidth={S} fill="none" />
  </>),
  tomato_paste: () => <Tin body="#7f1d1d" label="#dc2626" letter="T" />,
  rosemary: () => (
    <g><path d="M50 90 L50 18" stroke="#4d7c0f" strokeWidth={2.5} strokeLinecap="round" />{Array.from({length:10}).map((_, i) => { const y = 24 + i * 6; const side = i % 2 === 0 ? 1 : -1; return (<line key={i} x1={50} y1={y} x2={50 + side * 14} y2={y - 3} stroke="#4d7c0f" strokeWidth={2} strokeLinecap="round" />); })}</g>
  ),
  thyme: () => (
    <g><path d="M50 88 L50 22" stroke="#4d7c0f" strokeWidth={1.5} />{Array.from({length:14}).map((_, i) => { const y = 26 + i * 4.5; const side = i % 2 === 0 ? 1 : -1; return (<circle key={i} cx={50 + side * 6} cy={y} r={2.5} fill="#4d7c0f" stroke={INK} strokeWidth={0.5} />); })}</g>
  ),
  oregano: () => <Tin body="#4d7c0f" label="#2d4a0a" letter="Or" />,
  olive: () => (<>
    <ellipse cx="34" cy="54" rx="10" ry="13" fill="#2d4a0a" stroke={INK} strokeWidth={S} />
    <ellipse cx="50" cy="60" rx="10" ry="13" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
    <ellipse cx="66" cy="54" rx="10" ry="13" fill="#2d4a0a" stroke={INK} strokeWidth={S} />
    <circle cx="34" cy="52" r="2" fill="#bbcc99" />
    <circle cx="50" cy="58" r="2" fill="#bbcc99" />
    <circle cx="66" cy="52" r="2" fill="#bbcc99" />
  </>),
  caper: () => (<>
    {[[36,52],[46,48],[58,50],[40,62],[52,66],[62,60],[46,74],[58,74]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={4} fill="#4d7c0f" stroke={INK} strokeWidth={1} />)}
  </>),
  chocolate_chip: () => (<>
    {[[32,42],[48,38],[62,44],[36,56],[52,52],[66,58],[42,68],[58,70]].map(([x,y],i)=>(<path key={i} d={`M${x} ${y-5} L${x+5} ${y+4} L${x-5} ${y+4} Z`} fill="#3f2410" stroke={INK} strokeWidth={0.8} />))}
  </>),
  tea_chai: () => <Packet body="#92400e" label="#fde68a" letter="Ch" />,
  ice_cream_vanilla: () => (<>
    <path d="M34 58 L50 90 L66 58 Z" fill="#d4a373" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <circle cx="50" cy="42" r="18" fill="#fef9c3" stroke={INK} strokeWidth={S} />
    <circle cx="44" cy="36" r="4" fill="#fef08a" opacity={0.7} />
  </>),
  banana_frozen: () => (<>
    <path d="M20 72 C20 48, 36 22, 68 22 C66 30, 62 34, 60 38 C68 34, 76 26, 82 22 C84 48, 72 78, 44 82 C30 82, 22 80, 20 72 Z" fill="#fef9c3" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M22 72 C34 62, 52 56, 74 40" fill="none" stroke="#a16207" strokeWidth={1.2} opacity={0.4} />
    <text x="78" y="18" fontFamily="Georgia, serif" fontSize="14" fill="#0891b2">❄</text>
  </>),
  smoked_salmon: () => (<>
    <path d="M14 56 Q18 44, 36 42 Q58 44, 74 54 Q80 58, 72 64 Q56 70, 34 66 Q16 64, 14 56 Z" fill="#fb923c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M20 55 Q35 50, 55 55 Q65 58, 55 60 Q35 62, 20 57" fill="#fecaca" opacity={0.8} />
    <path d="M20 59 Q40 55, 62 58" stroke="#fef3c7" strokeWidth={1} fill="none" />
    <text x="80" y="36" fontFamily="Georgia, serif" fontSize="9" fill={INK} style={{fontStyle:'italic'}}>s.</text>
  </>),
  pork_chop: () => (<>
    <path d="M18 54 Q20 34, 48 32 Q74 34, 82 50 Q80 68, 58 74 Q28 76, 20 64 Q14 58, 18 54 Z" fill="#f4a6a6" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M28 46 Q48 42, 66 48 M26 58 Q48 56, 68 60" stroke="#e11d48" strokeWidth={1.2} fill="none" opacity={0.5} />
    <path d="M14 52 L8 48 L14 44 L10 42" stroke={INK} strokeWidth={S} fill="none" />
  </>),
  beef_brisket: () => (<>
    <path d="M12 44 L88 36 L88 68 L12 60 Z" fill="#7f1d1d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M12 52 L88 48" stroke="#fbbf24" strokeWidth={3} opacity={0.7} />
    <path d="M12 58 L88 56" stroke="#991b1b" strokeWidth={1.5} opacity={0.6} />
  </>),
  tahini: () => <Tin body="#d4a373" label="#78350f" letter="Ta" />,
  preserved_lemon: () => <Tin body="#eab308" label="#facc15" letter="PL" />,
  sumac: () => <Tin body="#b91c1c" label="#7f1d1d" letter="Su" />,
  pine_nut: () => (<>
    {[[34,50],[46,46],[58,50],[50,60],[38,64],[60,64],[44,74],[54,74]].map(([x,y],i)=>(<ellipse key={i} cx={x} cy={y} rx={3.5} ry={5} fill="#fde68a" stroke={INK} strokeWidth={0.8} />))}
  </>),
  pecan: () => (<>
    <ellipse cx="50" cy="55" rx="22" ry="18" fill="#a16207" stroke={INK} strokeWidth={S} />
    <path d="M50 40 L50 70 M32 55 Q50 50, 68 55 M36 42 Q50 52, 64 42 M36 68 Q50 58, 64 68" stroke="#78350f" strokeWidth={1.2} fill="none" />
  </>),
  hazelnut: () => (<>
    <circle cx="50" cy="58" r="20" fill="#c89e6b" stroke={INK} strokeWidth={S} />
    <path d="M40 40 L44 28 L56 28 L60 40" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <circle cx="50" cy="58" r="12" fill="#a16207" opacity={0.5} />
  </>),
  fig: () => (<>
    <path d="M34 34 Q40 26, 50 26 Q60 26, 66 34 L58 42 Q68 50, 64 66 Q50 82, 36 66 Q32 50, 42 42 Z" fill="#6b21a8" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M44 32 L50 20 L56 32" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
    <circle cx="45" cy="60" r="2" fill="#fecaca" /><circle cx="52" cy="58" r="1.5" fill="#fecaca" /><circle cx="50" cy="66" r="2" fill="#fecaca" />
  </>),
  pear: () => (<>
    <path d="M38 40 Q38 58, 32 70 Q40 84, 50 84 Q60 84, 68 70 Q62 58, 62 40 Q50 28, 38 40 Z" fill="#a3e635" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M50 26 L48 16" stroke="#4d2d0f" strokeWidth={S} strokeLinecap="round" />
    <path d="M52 20 Q58 14, 66 18" fill="#65a30d" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
  </>),
  peach: () => (<>
    <circle cx="50" cy="54" r="26" fill="#fb923c" stroke={INK} strokeWidth={S} />
    <path d="M50 28 Q42 32, 38 42 Q42 34, 50 32" fill="#c2410c" opacity={0.4} />
    <path d="M50 28 L50 54" stroke="#c2410c" strokeWidth={1} opacity={0.5} fill="none" />
    <path d="M48 28 L46 18 L56 20" fill="#4d7c0f" stroke={INK} strokeWidth={S} />
  </>),
  cherry: () => (<>
    <path d="M36 24 Q50 20, 62 26 L50 46 Z" fill="none" stroke="#4d2d0f" strokeWidth={2} strokeLinejoin="round" />
    <circle cx="38" cy="60" r="14" fill="#dc2626" stroke={INK} strokeWidth={S} />
    <circle cx="62" cy="64" r="14" fill="#991b1b" stroke={INK} strokeWidth={S} />
    <circle cx="34" cy="55" r="3" fill="#fecaca" opacity={0.8} />
  </>),
  kiwi: () => (<>
    <circle cx="50" cy="54" r="28" fill="#8b5a2b" stroke={INK} strokeWidth={S} />
    <circle cx="50" cy="54" r="22" fill="#84cc16" stroke={INK} strokeWidth={S} />
    <circle cx="50" cy="54" r="6" fill="#fef3c7" />
    {Array.from({length:8}).map((_,i)=>{const a=i/8*Math.PI*2; return <ellipse key={i} cx={50+Math.cos(a)*12} cy={54+Math.sin(a)*12} rx={1.5} ry={2.5} fill={INK} />})}
  </>),
  buttermilk: () => (<>
    <path d="M36 12 L36 20 L30 30 L30 86 Q30 90, 34 90 L66 90 Q70 90, 70 86 L70 30 L64 20 L64 12 Z" fill="#fefbf2" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <rect x="38" y="50" width="24" height="20" fill="#fef9c3" stroke={INK} strokeWidth={1} />
    <text x="50" y="65" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill={INK} style={{fontStyle:'italic'}}>Bm</text>
  </>),
  saffron: () => (<>
    <path d="M30 48 Q40 30, 50 56 Q38 50, 30 48 Z M50 32 Q58 48, 50 64 Q42 48, 50 32 Z M70 50 Q58 32, 50 60 Q64 54, 70 50 Z M35 72 Q48 60, 58 76 Q44 72, 35 72 Z" fill="#dc2626" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
    <circle cx="50" cy="54" r="8" fill="#991b1b" opacity={0.5} />
  </>),
  bay_leaf: () => (<>
    <g transform="translate(0,0) rotate(-20 50 50)"><path d="M50 20 Q30 30, 30 55 Q40 75, 50 80 Q60 75, 70 55 Q70 30, 50 20 Z" fill="#4d7c0f" stroke={INK} strokeWidth={S} strokeLinejoin="round" /><path d="M50 22 L50 78" stroke="#2d4a0a" strokeWidth={1} /></g>
  </>),
  star_anise: () => (<>
    {Array.from({length:8}).map((_,i)=>{const a=i*Math.PI/4; const x1=50; const y1=50; const x2=50+Math.cos(a)*24; const y2=50+Math.sin(a)*24; return (<g key={i}><path d={`M${x1} ${y1} L${x2-3} ${y2-3} L${x2} ${y2} L${x2+3} ${y2+3} Z`} fill="#7c2d12" stroke={INK} strokeWidth={S} strokeLinejoin="round" /><ellipse cx={50+Math.cos(a)*14} cy={50+Math.sin(a)*14} rx={3} ry={2} fill="#fef3c7" /></g>);})}
    <circle cx="50" cy="50" r="5" fill="#78350f" stroke={INK} strokeWidth={1} />
  </>),
};

// ---------------------------------------------------------------------------
// fallback by section — used if an ingredient id has no explicit icon
// ---------------------------------------------------------------------------

function fallbackFor(section: string): ReactNode {
  switch (section) {
    case 'produce': return <Leaf fill="#65a30d" />;
    case 'meat': return <Blob fill="#f4a6a6" darkerFill="#dc2626" />;
    case 'dairy': return <Tin body="#fff" label="#f3f4f6" letter="·" />;
    case 'pantry': return <Sachet body="#d4a373" letter="·" />;
    case 'frozen': return <Sachet body="#bae6fd" letter="❄" />;
    default: return <Tin body="#e5e7eb" letter="·" />;
  }
}

/**
 * Render the ingredient inside a 0..100 viewBox group. The caller supplies the
 * outer <svg> so multiple ingredients can be stamped into one plate.
 * Icon v2 overrides (lib/icons/) win over this file's legacy ICONS map.
 */
export function ingredientIcon(id: string, section: string = 'other'): ReactNode {
  const builder = ICON_OVERRIDES[id] ?? ICONS[id];
  return builder ? builder() : fallbackFor(section);
}

/** Standalone <svg> wrapper — for single-ingredient display. */
export function IngredientIcon({
  id,
  section,
  size = 40,
  title,
}: {
  id: string;
  section?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={title}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {ingredientIcon(id, section || 'other')}
    </svg>
  );
}
