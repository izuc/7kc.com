import { ReactNode } from 'react';
import { INK, HERB_GREEN, LEAF_DARK } from './tokens';
import { rngFor, scatter } from './seed';

/**
 * Ingredient-derived topping stamps. Each stamp draws inside a 100×100 box
 * centred on (50,50) and is scaled to ~30–44px when placed in the 400-box, so
 * stamp strokes use S (≈4.2 effective) to match the topping stroke hierarchy.
 *
 * kinds: 'scatter' — small bits repeated 2–4×; 'chunk' — a bigger piece placed
 * 1–2×; 'rim' — docked once on the vessel rim (citrus wedges).
 */

const S = 11; // stamp-space stroke ≈ 4.2 in dish space at 38% scale

export type StampKind = 'scatter' | 'chunk' | 'rim';

interface Stamp {
  kind: StampKind;
  /** higher = picked first when a recipe offers many stampable ingredients */
  priority: number;
  draw: (v: number) => ReactNode; // v in [0,1) — stable per-placement variant
}

// ---- shared shape helpers (stamp space) ----

const leaf = (fill: string, vein = LEAF_DARK) => (
  <>
    <path d="M50 16 C28 26, 20 50, 30 76 C42 68, 62 68, 72 76 C82 50, 72 26, 50 16 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M50 20 L50 70" stroke={vein} strokeWidth={6} fill="none" strokeLinecap="round" />
  </>
);

const flecks = (fill: string) => (
  <g fill={fill}>
    <rect x="18" y="34" width="26" height="11" rx="5.5" transform="rotate(24 31 39)" />
    <rect x="52" y="24" width="26" height="11" rx="5.5" transform="rotate(-18 65 29)" />
    <rect x="38" y="58" width="26" height="11" rx="5.5" transform="rotate(6 51 63)" />
  </g>
);

const cube = (fill: string, edge = INK) => (
  <rect x="24" y="24" width="52" height="52" rx="8" fill={fill} stroke={edge} strokeWidth={S} transform="rotate(12 50 50)" />
);

const disc = (fill: string, r = 26, pit?: string) => (
  <>
    <circle cx="50" cy="50" r={r} fill={fill} stroke={INK} strokeWidth={S} />
    {pit && <circle cx="44" cy="44" r={r * 0.32} fill={pit} />}
  </>
);

const wheel = (rind: string, face: string, seeds = true) => (
  <>
    <circle cx="50" cy="50" r="30" fill={rind} stroke={INK} strokeWidth={S} />
    <circle cx="50" cy="50" r="22" fill={face} />
    {seeds && (
      <g fill={rind}>
        <circle cx="50" cy="40" r="4" /><circle cx="42" cy="56" r="4" /><circle cx="58" cy="56" r="4" />
      </g>
    )}
  </>
);

const crumb = (fill: string) => (
  <g fill={fill}>
    <rect x="20" y="36" width="30" height="19" rx="9" transform="rotate(18 35 45)" />
    <rect x="50" y="28" width="28" height="18" rx="9" transform="rotate(-14 64 37)" />
    <rect x="40" y="56" width="27" height="17" rx="8.5" transform="rotate(30 53 64)" />
  </g>
);

const chunkShape = (fill: string, light: string) => (
  <>
    <path d="M24 42 Q 30 24, 52 24 Q 74 26, 76 46 Q 74 68, 50 70 Q 28 68, 24 42 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M34 40 Q 40 30, 54 32" fill="none" stroke={light} strokeWidth={7} strokeLinecap="round" />
  </>
);

const ribbon = (fill: string) => (
  <path d="M20 56 Q 46 30, 80 42 Q 56 66, 20 56 Z" fill={fill} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
);

const berryShape = (fill: string, dark: string) => (
  <>
    <circle cx="40" cy="56" r="20" fill={fill} stroke={INK} strokeWidth={S} />
    <circle cx="62" cy="48" r="17" fill={dark} stroke={INK} strokeWidth={S} />
  </>
);

const sliceCrescent = (skin: string, flesh: string) => (
  <>
    <path d="M22 62 Q 50 18, 78 62 Q 50 50, 22 62 Z" fill={flesh} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M22 62 Q 50 46, 78 62" fill="none" stroke={skin} strokeWidth={8} strokeLinecap="round" />
  </>
);

/** Citrus half-wheel: rind arc + pale flesh + segment lines — reads at any size. */
const wedgeQuarter = (skin: string, flesh: string, segs = true) => (
  <g transform="rotate(-24 50 50)">
    <path d="M18 50 A 32 32 0 0 1 82 50 Z" fill={flesh} stroke={INK} strokeWidth={S} strokeLinejoin="round" />
    <path d="M18 50 A 32 32 0 0 1 82 50" fill="none" stroke={skin} strokeWidth={9} />
    {segs && (
      <g stroke={skin} strokeWidth={4.5} opacity={0.85}>
        <path d="M50 48 L50 22" /><path d="M50 48 L28 34" /><path d="M50 48 L72 34" />
      </g>
    )}
  </g>
);

// ---- the stamp registry (real ingredient ids) ----

const R = '#d23c30'; // tomato/chilli red
const STAMPS: Record<string, Stamp> = {
  // herbs & leaves
  basil: { kind: 'scatter', priority: 90, draw: () => leaf('#4d7a1f') },
  mint: { kind: 'scatter', priority: 88, draw: () => leaf('#5d9a3a') },
  spinach: { kind: 'scatter', priority: 70, draw: () => leaf('#3f6c1d') },
  rocket: { kind: 'scatter', priority: 70, draw: () => leaf('#4c7d24') },
  kale: { kind: 'scatter', priority: 68, draw: () => leaf('#33591b') },
  bok_choy: { kind: 'chunk', priority: 66, draw: () => leaf('#6aa348', '#e9f3d8') },
  sage: { kind: 'scatter', priority: 72, draw: () => leaf('#7d9a6a') },
  bay_leaf: { kind: 'scatter', priority: 40, draw: () => leaf('#556b3a') },
  parsley: { kind: 'scatter', priority: 86, draw: () => flecks(HERB_GREEN) },
  coriander: { kind: 'scatter', priority: 86, draw: () => flecks('#4c8027') },
  oregano: { kind: 'scatter', priority: 78, draw: () => flecks('#5c7a3a') },
  thyme: { kind: 'scatter', priority: 76, draw: () => flecks('#6b8256') },
  rosemary: {
    kind: 'scatter', priority: 76,
    draw: () => (
      <g stroke={LEAF_DARK} strokeWidth={6} strokeLinecap="round">
        <path d="M30 70 L70 30" />
        <path d="M38 54 L28 44 M46 46 L36 36 M54 38 L44 28 M46 62 L58 52 M54 70 L66 60" strokeWidth={5} />
      </g>
    ),
  },
  spring_onion: {
    kind: 'scatter', priority: 84,
    draw: (v) => (
      <g>
        <circle cx="36" cy="42" r="11" fill="#c9e5a2" stroke="#4d7a1f" strokeWidth={7} />
        <circle cx="62" cy="56" r="9" fill="#dff0c2" stroke="#5d9a3a" strokeWidth={6} />
        {v > 0.5 && <circle cx="56" cy="30" r="7" fill="#c9e5a2" stroke="#4d7a1f" strokeWidth={5} />}
      </g>
    ),
  },

  // heat & citrus
  chilli: {
    kind: 'scatter', priority: 85,
    draw: () => (
      <>
        <circle cx="50" cy="50" r="20" fill={R} stroke={INK} strokeWidth={S} />
        <circle cx="50" cy="50" r="10" fill="#f6bfb2" />
        <circle cx="46" cy="47" r="3" fill={R} /><circle cx="55" cy="52" r="3" fill={R} />
      </>
    ),
  },
  chilli_flakes: { kind: 'scatter', priority: 60, draw: () => flecks('#c22e1f') },
  lemon: { kind: 'rim', priority: 95, draw: () => wedgeQuarter('#e8b820', '#fbe98c') },
  lime: { kind: 'rim', priority: 95, draw: () => wedgeQuarter('#6b9a2a', '#d9ecab') },
  orange: { kind: 'rim', priority: 80, draw: () => wedgeQuarter('#d97e1e', '#f8c471') },
  preserved_lemon: { kind: 'scatter', priority: 70, draw: () => wedgeQuarter('#c99a18', '#f0d878', false) },

  // cheese & soft whites
  parmesan: { kind: 'scatter', priority: 82, draw: () => ribbon('#fdf6e2') },
  feta: { kind: 'scatter', priority: 82, draw: () => cube('#fffdf6') },
  paneer: { kind: 'chunk', priority: 78, draw: () => cube('#fff8ec') },
  haloumi: { kind: 'chunk', priority: 78, draw: () => cube('#f7ecd2') },
  tofu: { kind: 'chunk', priority: 74, draw: () => cube('#fffcf2') },
  mozzarella: { kind: 'scatter', priority: 82, draw: () => disc('#fffdf6', 24) },
  ricotta: { kind: 'scatter', priority: 68, draw: () => disc('#fffaf0', 22) },
  cheddar: { kind: 'scatter', priority: 66, draw: () => ribbon('#f3c04a') },
  blue_cheese: {
    kind: 'scatter', priority: 66,
    draw: () => (
      <>
        {cube('#fbf7ea')}
        <circle cx="42" cy="44" r="4" fill="#5b7a9a" /><circle cx="58" cy="56" r="4" fill="#5b7a9a" />
      </>
    ),
  },
  yoghurt: { kind: 'scatter', priority: 40, draw: () => disc('#fffdf6', 24) },
  sour_cream: { kind: 'scatter', priority: 40, draw: () => disc('#fffdf6', 24) },

  // vegetables
  olive: { kind: 'scatter', priority: 80, draw: (v) => disc(v > 0.5 ? '#3a3a2c' : '#4a5232', 18, '#6b7350') },
  caper: { kind: 'scatter', priority: 62, draw: () => disc('#5a6b35', 12) },
  tomato: { kind: 'scatter', priority: 78, draw: () => wedgeQuarter('#a82818', '#e0503c') },
  cherry_tomato: {
    kind: 'scatter', priority: 80,
    draw: () => (
      <>
        <circle cx="50" cy="50" r="24" fill={R} stroke={INK} strokeWidth={S} />
        <circle cx="43" cy="43" r="8" fill="#ef8070" />
      </>
    ),
  },
  roma_tomato: { kind: 'scatter', priority: 76, draw: () => wedgeQuarter('#a82818', '#e0503c') },
  cucumber: { kind: 'scatter', priority: 74, draw: () => wheel('#4c7d24', '#e4f0c8') },
  zucchini: { kind: 'scatter', priority: 68, draw: () => wheel('#3f6c1d', '#eef4d8', false) },
  onion_red: {
    kind: 'scatter', priority: 72,
    draw: () => (
      <g fill="none" strokeLinecap="round">
        <path d="M24 58 A 30 30 0 0 1 76 56" stroke="#8d4a8a" strokeWidth={12} />
        <path d="M32 44 A 22 22 0 0 1 70 44" stroke="#b57ab2" strokeWidth={8} />
      </g>
    ),
  },
  capsicum_red: {
    kind: 'scatter', priority: 72,
    draw: () => <path d="M22 60 Q 50 24, 78 60 Q 50 46, 22 60 Z" fill="#cf3a22" stroke={INK} strokeWidth={S} strokeLinejoin="round" />,
  },
  capsicum_green: {
    kind: 'scatter', priority: 70,
    draw: () => <path d="M22 60 Q 50 24, 78 60 Q 50 46, 22 60 Z" fill="#4c7d24" stroke={INK} strokeWidth={S} strokeLinejoin="round" />,
  },
  carrot: { kind: 'scatter', priority: 66, draw: () => wheel('#c05a14', '#eda05c', false) },
  peas_frozen: {
    kind: 'scatter', priority: 68,
    draw: () => (
      <g>
        <circle cx="38" cy="44" r="13" fill="#5d9a3a" stroke={INK} strokeWidth={7} />
        <circle cx="62" cy="40" r="12" fill="#6fae4a" stroke={INK} strokeWidth={7} />
        <circle cx="50" cy="62" r="12" fill="#4d8a2d" stroke={INK} strokeWidth={7} />
      </g>
    ),
  },
  snow_pea: { kind: 'scatter', priority: 64, draw: () => <path d="M22 58 Q 50 34, 78 52 Q 50 66, 22 58 Z" fill="#7ab653" stroke={INK} strokeWidth={S} strokeLinejoin="round" /> },
  green_bean: {
    kind: 'scatter', priority: 64,
    draw: () => <path d="M24 62 Q 40 34, 72 32" fill="none" stroke="#4c7d24" strokeWidth={13} strokeLinecap="round" />,
  },
  corn: { kind: 'scatter', priority: 66, draw: () => (
    <g fill="#f2c230" stroke={INK} strokeWidth={5}>
      <circle cx="40" cy="44" r="10" /><circle cx="60" cy="40" r="9" /><circle cx="52" cy="60" r="9" />
    </g>
  ) },
  corn_frozen: { kind: 'scatter', priority: 62, draw: () => (
    <g fill="#f2c230" stroke={INK} strokeWidth={5}>
      <circle cx="40" cy="44" r="10" /><circle cx="60" cy="40" r="9" /><circle cx="52" cy="60" r="9" />
    </g>
  ) },
  mushroom: {
    kind: 'scatter', priority: 74,
    draw: () => (
      <>
        <path d="M24 52 Q 26 28, 50 26 Q 74 28, 76 52 L 62 52 L 62 70 Q 50 76, 38 70 L 38 52 Z" fill="#c9a06a" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
        <path d="M32 46 Q 36 34, 50 32" fill="none" stroke="#e8cba0" strokeWidth={6} strokeLinecap="round" />
      </>
    ),
  },
  avocado: { kind: 'scatter', priority: 76, draw: () => sliceCrescent('#3f6016', '#c6dc7e') },
  beetroot: { kind: 'scatter', priority: 68, draw: () => wheel('#7a1f42', '#b24a6e', false) },
  eggplant: { kind: 'chunk', priority: 66, draw: () => sliceCrescent('#4a2454', '#e8d9b8') },
  broccoli: {
    kind: 'chunk', priority: 68,
    draw: () => (
      <>
        <circle cx="38" cy="40" r="16" fill="#3f6c1d" stroke={INK} strokeWidth={7} />
        <circle cx="60" cy="36" r="14" fill="#4c7d24" stroke={INK} strokeWidth={7} />
        <circle cx="50" cy="52" r="15" fill="#33591b" stroke={INK} strokeWidth={7} />
        <rect x="44" y="58" width="12" height="18" rx="5" fill="#b9cc8e" stroke={INK} strokeWidth={6} />
      </>
    ),
  },
  cauliflower: {
    kind: 'chunk', priority: 64,
    draw: () => (
      <>
        <circle cx="38" cy="42" r="16" fill="#f6efdb" stroke={INK} strokeWidth={7} />
        <circle cx="60" cy="38" r="14" fill="#fdf6e2" stroke={INK} strokeWidth={7} />
        <circle cx="50" cy="54" r="15" fill="#efe4c8" stroke={INK} strokeWidth={7} />
      </>
    ),
  },
  pumpkin: { kind: 'chunk', priority: 70, draw: () => cube('#dd7a26') },
  sweet_potato: { kind: 'chunk', priority: 68, draw: () => cube('#d9702a') },
  potato: { kind: 'chunk', priority: 56, draw: () => chunkShape('#e8c88a', '#f6e2b8') },
  asparagus: {
    kind: 'scatter', priority: 66,
    draw: () => (
      <g strokeLinecap="round">
        <path d="M30 72 L62 30" stroke="#5d8a3a" strokeWidth={11} fill="none" />
        <path d="M62 30 L70 20" stroke="#3f6c1d" strokeWidth={12} fill="none" />
      </g>
    ),
  },
  celery: { kind: 'scatter', priority: 50, draw: () => <path d="M26 60 Q 50 40, 74 58" fill="none" stroke="#a4c25e" strokeWidth={12} strokeLinecap="round" /> },
  leek: { kind: 'scatter', priority: 54, draw: () => wheel('#6aa348', '#f0f6da', false) },
  kimchi: { kind: 'scatter', priority: 70, draw: () => <path d="M24 58 Q 38 34, 56 46 Q 72 32, 78 52 Q 58 70, 36 66 Z" fill="#cf4a22" stroke={INK} strokeWidth={7} strokeLinejoin="round" /> },
  cabbage: { kind: 'scatter', priority: 56, draw: () => <path d="M24 58 Q 40 38, 58 48 Q 72 38, 76 54 Q 58 68, 36 64 Z" fill="#cfe2a8" stroke={INK} strokeWidth={7} strokeLinejoin="round" /> },

  // proteins
  beef_mince: { kind: 'scatter', priority: 58, draw: () => crumb('#8c3c1c') },
  pork_mince: { kind: 'scatter', priority: 58, draw: () => crumb('#b06a4a') },
  lamb_mince: { kind: 'scatter', priority: 58, draw: () => crumb('#8a3a24') },
  bacon: {
    kind: 'scatter', priority: 72,
    draw: () => (
      <g>
        <rect x="22" y="38" width="56" height="22" rx="8" fill="#b13a2a" stroke={INK} strokeWidth={7} transform="rotate(-10 50 49)" />
        <path d="M28 46 Q 50 40, 72 44" stroke="#f2c9a8" strokeWidth={6} fill="none" transform="rotate(-10 50 49)" />
      </g>
    ),
  },
  ham_sliced: { kind: 'scatter', priority: 60, draw: () => disc('#e89a94', 24) },
  chorizo: { kind: 'scatter', priority: 72, draw: () => wheel('#8a2418', '#c05038', false) },
  prawns: {
    kind: 'chunk', priority: 84,
    draw: () => (
      <>
        <path d="M30 34 Q 66 26, 72 52 Q 74 72, 52 72 Q 56 58, 46 52 Q 32 46, 30 34 Z" fill="#ef8a5e" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
        <path d="M42 40 Q 56 38, 60 50" fill="none" stroke="#f8c4a4" strokeWidth={6} strokeLinecap="round" />
      </>
    ),
  },
  salmon: { kind: 'chunk', priority: 76, draw: () => chunkShape('#ef8a72', '#fbd0bd') },
  smoked_salmon: { kind: 'scatter', priority: 76, draw: () => ribbon('#ef8a72') },
  barramundi: { kind: 'chunk', priority: 70, draw: () => chunkShape('#f2e2c8', '#fdf6e2') },
  tinned_tuna: { kind: 'scatter', priority: 60, draw: () => crumb('#c98a72') },
  anchovy: { kind: 'scatter', priority: 58, draw: () => <path d="M24 56 Q 50 42, 76 50" fill="none" stroke="#8a7a5c" strokeWidth={9} strokeLinecap="round" /> },
  chicken_thigh: { kind: 'chunk', priority: 62, draw: () => chunkShape('#e8b26a', '#f6d8a8') },
  chicken_breast: { kind: 'chunk', priority: 62, draw: () => chunkShape('#eec084', '#f8e0b8') },
  eggs: {
    kind: 'chunk', priority: 64,
    draw: () => (
      <>
        <ellipse cx="50" cy="50" rx="28" ry="22" fill="#fffdf6" stroke={INK} strokeWidth={S} />
        <circle cx="50" cy="50" r="11" fill="#f2b41e" stroke={INK} strokeWidth={5} />
      </>
    ),
  },
  scallop: { kind: 'chunk', priority: 74, draw: () => disc('#f8ecd8', 22) },
  mussel: { kind: 'chunk', priority: 72, draw: () => <path d="M28 62 Q 30 30, 50 24 Q 72 30, 72 62 Q 50 74, 28 62 Z" fill="#2e2a3a" stroke={INK} strokeWidth={S} strokeLinejoin="round" /> },
  calamari: { kind: 'scatter', priority: 70, draw: () => wheel('#f0e2ce', '#fdf8ec', false) },
  beef_steak: { kind: 'chunk', priority: 60, draw: () => (
    <g>
      <rect x="22" y="34" width="56" height="30" rx="10" fill="#8a3a24" stroke={INK} strokeWidth={7} transform="rotate(-6 50 49)" />
      <path d="M30 48 L70 44" stroke="#c26a4c" strokeWidth={5} transform="rotate(-6 50 49)" />
    </g>
  ) },

  // nuts, seeds, dried
  walnut: {
    kind: 'scatter', priority: 62,
    draw: () => (
      <>
        <path d="M28 52 Q 28 30, 50 28 Q 72 30, 72 52 Q 70 70, 50 72 Q 30 70, 28 52 Z" fill="#c99a5c" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
        <path d="M50 32 Q 46 50, 50 68 M38 38 Q 42 50, 38 62 M62 38 Q 58 50, 62 62" fill="none" stroke="#8a5a28" strokeWidth={4.5} />
      </>
    ),
  },
  pecan: { kind: 'scatter', priority: 60, draw: () => <ellipse cx="50" cy="50" rx="26" ry="18" fill="#a86a34" stroke={INK} strokeWidth={S} /> },
  almond: { kind: 'scatter', priority: 58, draw: () => <ellipse cx="50" cy="50" rx="24" ry="13" fill="#e8cba0" stroke={INK} strokeWidth={7} transform="rotate(-24 50 50)" /> },
  peanut: { kind: 'scatter', priority: 60, draw: () => disc('#dfb271', 16) },
  cashew: { kind: 'scatter', priority: 60, draw: () => <path d="M30 42 Q 54 30, 70 46 Q 74 60, 60 62 Q 58 50, 44 50 Q 32 50, 30 42 Z" fill="#eed9a8" stroke={INK} strokeWidth={7} strokeLinejoin="round" /> },
  hazelnut: { kind: 'scatter', priority: 56, draw: () => disc('#b07a3c', 16) },
  pine_nut: { kind: 'scatter', priority: 56, draw: () => <ellipse cx="50" cy="50" rx="14" ry="9" fill="#f0dfba" stroke={INK} strokeWidth={5} transform="rotate(20 50 50)" /> },

  // fruit & sweet
  blueberry: { kind: 'scatter', priority: 74, draw: () => berryShape('#3a4a8c', '#2c3a72') },
  strawberry: {
    kind: 'scatter', priority: 76,
    draw: () => (
      <>
        <path d="M50 24 Q 76 30, 72 52 Q 66 72, 50 78 Q 34 72, 28 52 Q 24 30, 50 24 Z" fill="#d23c30" stroke={INK} strokeWidth={S} strokeLinejoin="round" />
        <path d="M40 20 L50 28 L60 20" fill="none" stroke="#4d7a1f" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        <g fill="#f8d8c0"><circle cx="42" cy="44" r="3" /><circle cx="58" cy="46" r="3" /><circle cx="50" cy="60" r="3" /></g>
      </>
    ),
  },
  berries_frozen: { kind: 'scatter', priority: 70, draw: () => berryShape('#6e2a52', '#3a4a8c') },
  banana: { kind: 'scatter', priority: 68, draw: () => wheel('#e8cc6a', '#fbf0c4', false) },
  banana_frozen: { kind: 'scatter', priority: 62, draw: () => wheel('#e8cc6a', '#fbf0c4', false) },
  apple: { kind: 'scatter', priority: 64, draw: () => sliceCrescent('#c23a2c', '#fbf0d4') },
  pear: { kind: 'scatter', priority: 62, draw: () => sliceCrescent('#b8c25e', '#fbf4d8') },
  peach: { kind: 'scatter', priority: 64, draw: () => sliceCrescent('#e8862e', '#fbd8a0') },
  mango: { kind: 'chunk', priority: 68, draw: () => cube('#f2b430') },
  pineapple: { kind: 'scatter', priority: 64, draw: () => wedgeQuarter('#d9a41e', '#f6dd7c', false) },
  grape: { kind: 'scatter', priority: 60, draw: () => berryShape('#6e2a52', '#8a3a68') },
  cherry: { kind: 'scatter', priority: 64, draw: () => disc('#8a1c2e', 18, '#b24a5c') },
  fig: { kind: 'scatter', priority: 64, draw: () => wheel('#5c2a4a', '#c26a8a', false) },
  kiwi: { kind: 'scatter', priority: 62, draw: () => wheel('#7a5a34', '#b6d068') },
  passionfruit: { kind: 'scatter', priority: 62, draw: () => wheel('#5c2a4a', '#e8a824') },
  dates: { kind: 'scatter', priority: 54, draw: () => <ellipse cx="50" cy="50" rx="24" ry="15" fill="#6e4322" stroke={INK} strokeWidth={7} transform="rotate(-14 50 50)" /> },
  raisin: { kind: 'scatter', priority: 48, draw: () => disc('#4a3050', 12) },
  dark_chocolate: { kind: 'scatter', priority: 66, draw: () => cube('#4a2c18') },
  chocolate_chip: { kind: 'scatter', priority: 66, draw: () => (
    <g fill="#4a2c18"><circle cx="38" cy="44" r="9" /><circle cx="60" cy="38" r="8" /><circle cx="52" cy="60" r="8" /></g>
  ) },
  marshmallow: { kind: 'scatter', priority: 58, draw: () => <rect x="30" y="32" width="40" height="36" rx="12" fill="#fff4f0" stroke={INK} strokeWidth={7} /> },
  coconut_desiccated: { kind: 'scatter', priority: 52, draw: () => flecks('#fdf6e2') },
  meringue: { kind: 'scatter', priority: 56, draw: () => <path d="M30 66 Q 26 44, 42 40 Q 40 26, 54 28 Q 68 28, 66 44 Q 78 50, 68 64 Q 50 72, 30 66 Z" fill="#fffaf0" stroke={INK} strokeWidth={7} strokeLinejoin="round" /> },
  nori: { kind: 'scatter', priority: 58, draw: () => <rect x="28" y="30" width="44" height="40" rx="4" fill="#243424" stroke={INK} strokeWidth={6} transform="rotate(8 50 50)" /> },
};

/** Stampable check + section fallbacks for ids without a bespoke stamp. */
const SECTION_FALLBACK: Record<string, Stamp> = {
  produce: { kind: 'scatter', priority: 30, draw: () => flecks('#5d8a3a') },
  meat: { kind: 'chunk', priority: 28, draw: () => chunkShape('#b06a4a', '#d9a078') },
  seafood: { kind: 'chunk', priority: 28, draw: () => chunkShape('#f2e2c8', '#fdf6e2') },
  dairy: { kind: 'scatter', priority: 24, draw: () => ribbon('#fdf6e2') },
};

export function stampFor(id: string, section?: string): Stamp | null {
  return STAMPS[id] ?? (section ? SECTION_FALLBACK[section] ?? null : null);
}

/**
 * Choose up to `max` visually expressive toppings from a recipe's ingredient
 * ids — pantry staples and invisible flavourings simply have no stamp, so the
 * filter is the registry itself. Rim stamps (citrus) are capped at one.
 */
export function pickToppings(ids: string[], max = 4): string[] {
  const seen = new Set<string>();
  const candidates = ids.filter((id) => {
    if (seen.has(id) || !STAMPS[id]) return false;
    seen.add(id);
    return true;
  });
  candidates.sort((a, b) => STAMPS[b].priority - STAMPS[a].priority);
  const out: string[] = [];
  let rimUsed = false;
  for (const id of candidates) {
    if (out.length >= max) break;
    if (STAMPS[id].kind === 'rim') {
      if (rimUsed) continue;
      rimUsed = true;
    }
    out.push(id);
  }
  return out;
}

/**
 * Stamp the picked toppings into a dish: 'rim' docks once on the vessel rim,
 * 'scatter' repeats 2–3×, 'chunk' 1–2×, all seeded from the slug. `clipR`
 * keeps scatter/chunk placements inside the food area.
 */
export function ToppingScatter({
  slug, ids, cx = 200, cy = 202, clipR = 92, rimR = 136, size = 38, simplified = false,
}: {
  slug: string; ids: string[]; cx?: number; cy?: number; clipR?: number; rimR?: number; size?: number; simplified?: boolean;
}) {
  const list = simplified ? ids.slice(0, 2) : ids;
  const rnd = rngFor(slug + ':toppings');
  const placed: ReactNode[] = [];
  let scatterIdx = 0;

  for (const id of list) {
    const stamp = STAMPS[id];
    if (!stamp) continue;
    if (stamp.kind === 'rim') {
      const a = (-58 + rnd() * 40) * (Math.PI / 180);
      const x = cx + Math.cos(a) * rimR;
      const y = cy + Math.sin(a) * rimR;
      const s = size * 1.35;
      placed.push(
        <g key={id} transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})`}>{stamp.draw(rnd())}</g>
      );
      continue;
    }
    const copies = simplified ? 1 : stamp.kind === 'scatter' ? 2 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 2);
    const pts = scatter(`${slug}:${id}`, copies, { cx, cy, rMin: clipR * 0.15, rMax: clipR * 0.85 });
    for (const p of pts) {
      const s = size * (0.8 + p.r01 * 0.4);
      placed.push(
        <g
          key={`${id}-${scatterIdx++}`}
          transform={`translate(${p.x - s / 2} ${p.y - s / 2}) rotate(${(p.rot % 50) - 25} ${s / 2} ${s / 2}) scale(${s / 100})`}
        >
          {stamp.draw(p.r01)}
        </g>
      );
    }
  }
  return <>{placed}</>;
}
