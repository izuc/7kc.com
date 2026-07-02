import { ReactNode } from 'react';
import { INK } from '../dishArt/tokens';

/**
 * Icon v2 overrides — dry pantry goods ("Ink & Cream" language).
 *
 * Grammar: 100×100 box, one dominant silhouette (~65–80%), ink outline ≈4.2
 * with round joins/caps, exactly one lighter highlight shape, ≤2 small
 * accessory marks, flat colour only. Containers are drawn where the good IS
 * packaged (spice jars, flour bags, sugar sacks, rice sacks) but each is
 * distinguished by silhouette + content motif + colour — never labels.
 */

const SW = 4.2; // main outline
const O = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

// ---- shared silhouettes -----------------------------------------------------

/** Spice jar: wooden lid + content-coloured body + pale highlight stripe. */
const jar = (body: string, hi: string, motif: ReactNode) => (
  <>
    <rect x="33" y="12" width="34" height="15" rx="5" fill="#6b4218" {...O} />
    <path d="M28 36 Q28 26 38 26 L62 26 Q72 26 72 36 L72 78 Q72 88 61 88 L39 88 Q28 88 28 78 Z" fill={body} {...O} />
    <path d="M36 36 L36 76" stroke={hi} strokeWidth={5.5} strokeLinecap="round" fill="none" />
    {motif}
  </>
);

/** Paper flour bag: body + folded top flap; the motif sits on the belly. */
const bag = (body: string, flap: string, motif: ReactNode) => (
  <>
    <path d="M29 36 L29 82 Q29 88 35 88 L65 88 Q71 88 71 82 L71 36 Z" fill={body} {...O} />
    <path d="M23 20 L77 20 L71 38 L29 38 Z" fill={flap} {...O} />
    {motif}
  </>
);

/** Cinched sugar sack: soft belly, neck flare, coloured tie band. */
const sack = (body: string, tie: string, hi: string, motif: ReactNode) => (
  <>
    <path d="M39 24 Q50 18 61 24 L64 33 Q76 43 76 62 Q76 88 50 88 Q24 88 24 62 Q24 43 36 33 Z" fill={body} {...O} />
    <path d="M35 32 Q50 39 65 32" stroke={tie} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M34 50 Q29 62 35 74" stroke={hi} strokeWidth={5} fill="none" strokeLinecap="round" />
    {motif}
  </>
);

/** Open rice sack: rolled rim (the highlight) + grain spill + a marker band. */
const riceSack = (jute: string, rim: string, grains: ReactNode, mark: ReactNode) => (
  <>
    <path d="M31 42 Q24 47 25 60 Q26 82 33 87 Q40 91 50 91 Q60 91 67 87 Q74 82 75 60 Q76 47 69 42 Z" fill={jute} {...O} />
    {mark}
    {grains}
    <rect x="27" y="28" width="46" height="15" rx="7.5" fill={rim} {...O} />
  </>
);

const grainCluster = (shapes: ReactNode) => (
  <g fill="#fffdf6" stroke={INK} strokeWidth={2.4}>{shapes}</g>
);

// ---- the registry -----------------------------------------------------------

export const PANTRY_ICONS: Record<string, () => ReactNode> = {
  // ---- flours & raising ----
  flour: () =>
    bag('#f0dfbc', '#fbf0d8', (
      <>
        <path d="M50 52 L50 78" stroke="#a87414" strokeWidth={3.2} strokeLinecap="round" fill="none" />
        <g fill="#d9a41e">
          <ellipse cx="50" cy="49" rx="4.5" ry="7" />
          <ellipse cx="43" cy="58" rx="4" ry="6.5" transform="rotate(-42 43 58)" />
          <ellipse cx="57" cy="58" rx="4" ry="6.5" transform="rotate(42 57 58)" />
          <ellipse cx="44" cy="68" rx="4" ry="6.5" transform="rotate(-42 44 68)" />
          <ellipse cx="56" cy="68" rx="4" ry="6.5" transform="rotate(42 56 68)" />
        </g>
      </>
    )),
  flour_self_raising: () => (
    <>
      {/* rising puff escaping the bag = the lighter highlight */}
      <path d="M32 24 Q26 12 38 11 Q41 2 52 5 Q63 1 66 11 Q77 13 69 24 Z" fill="#fdf6e2" {...O} />
      <path d="M29 36 L29 82 Q29 88 35 88 L65 88 Q71 88 71 82 L71 36 Z" fill="#f0dfbc" {...O} />
      <path d="M23 22 L77 22 L71 38 L29 38 Z" fill="#e2cda2" {...O} />
      <path d="M50 78 L50 52 M41 61 L50 52 L59 61" stroke="#b5811c" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  cornflour: () =>
    bag('#f6e49c', '#fbf0c4', (
      <>
        <ellipse cx="50" cy="61" rx="9" ry="16" fill="#e8b820" stroke={INK} strokeWidth={3} />
        <path d="M50 47 L50 75 M43 55 Q50 58 57 55 M43 66 Q50 69 57 66" stroke="#b5811c" strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d="M40 74 Q35 64 39 52 M60 74 Q65 64 61 52" stroke="#557c1e" strokeWidth={3.4} fill="none" strokeLinecap="round" />
      </>
    )),
  baking_powder: () => (
    <>
      <path d="M28 40 L72 40 L72 78 Q72 86 62 86 L38 86 Q28 86 28 78 Z" fill="#f6ead0" {...O} />
      <rect x="24" y="25" width="52" height="17" rx="6" fill="#b5401c" {...O} />
      <path d="M35 48 L35 78" stroke="#fdf6e2" strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* leavening bubbles rising across the tin */}
      <g fill="#d9a41e">
        <circle cx="47" cy="72" r="5" />
        <circle cx="57" cy="61" r="4" />
        <circle cx="63" cy="50" r="3" />
      </g>
    </>
  ),

  // ---- sugars ----
  sugar: () =>
    sack('#f2e6cc', '#b5401c', '#fdf6e2', (
      <g stroke="#fffdf6" strokeWidth={3.2} strokeLinecap="round">
        <path d="M55 52 L55 64 M49 58 L61 58" />
        <path d="M64 70 L64 78 M60 74 L68 74" />
      </g>
    )),
  brown_sugar: () =>
    sack('#b5813c', '#6b4310', '#d9a95c', (
      <g fill="#7c4a12" stroke={INK} strokeWidth={2.4}>
        <rect x="49" y="52" width="13" height="13" rx="3" transform="rotate(10 55.5 58.5)" />
        <rect x="57" y="66" width="11" height="11" rx="2.6" transform="rotate(-12 62.5 71.5)" />
      </g>
    )),
  icing_sugar: () =>
    sack('#faf4e6', '#c9b090', '#fffdf6', (
      // sifted drift falling past the shoulder
      <g fill="#fffdf6" stroke={INK} strokeWidth={1.8}>
        <circle cx="76" cy="22" r="3" />
        <circle cx="83" cy="34" r="2.4" />
        <circle cx="78" cy="46" r="2" />
      </g>
    )),

  // ---- spice jars (colour + motif carry them at 28px) ----
  chilli_flakes: () =>
    jar('#b02418', '#d85038', (
      <g fill="#f6dfc2">
        <rect x="46" y="46" width="12" height="5.5" rx="2.75" transform="rotate(24 52 49)" />
        <rect x="52" y="60" width="12" height="5.5" rx="2.75" transform="rotate(-18 58 63)" />
        <rect x="42" y="70" width="11" height="5" rx="2.5" transform="rotate(8 47 72)" />
      </g>
    )),
  paprika: () =>
    jar('#d1511f', '#e87c42', (
      <>
        <path d="M45 51 Q52 44 59 51 Q62 63 52 70 Q42 63 45 51 Z" fill="#7c1608" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M52 47 L52 42" stroke="#3f6016" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </>
    )),
  cumin: () =>
    jar('#bd9350', '#dab97e', (
      <g fill="#6b4310">
        <ellipse cx="48" cy="50" rx="6.5" ry="2.6" transform="rotate(-30 48 50)" />
        <ellipse cx="58" cy="60" rx="6.5" ry="2.6" transform="rotate(20 58 60)" />
        <ellipse cx="47" cy="70" rx="6.5" ry="2.6" transform="rotate(-15 47 70)" />
      </g>
    )),
  curry_powder: () =>
    jar('#d99c1e', '#ecbf58', (
      // curry-leaf sprig
      <>
        <path d="M52 76 L52 48" stroke="#3f6016" strokeWidth={3} strokeLinecap="round" fill="none" />
        <g fill="#3f6016">
          <ellipse cx="45" cy="52" rx="6" ry="3.2" transform="rotate(-32 45 52)" />
          <ellipse cx="59" cy="52" rx="6" ry="3.2" transform="rotate(32 59 52)" />
          <ellipse cx="44" cy="63" rx="6" ry="3.2" transform="rotate(-32 44 63)" />
          <ellipse cx="60" cy="63" rx="6" ry="3.2" transform="rotate(32 60 63)" />
        </g>
      </>
    )),
  turmeric: () =>
    jar('#e2ae10', '#f2cf58', (
      // heaped ground-spice mounds
      <>
        <path d="M34 72 Q45 52 56 72 Z" fill="#a06a0c" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <path d="M50 72 Q59 58 68 72 Z" fill="#8a5a0a" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      </>
    )),
  cinnamon: () => (
    <g transform="rotate(-36 50 50)">
      <rect x="16" y="36" width="68" height="12" rx="6" fill="#a05c20" {...O} />
      <rect x="18" y="52" width="68" height="12" rx="6" fill="#8a4a18" {...O} />
      <path d="M24 42 L74 42" stroke="#c98a4a" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <path d="M22 58 Q18 58 19 61 M80 58 Q84 58 83 61" stroke="#5c3410" strokeWidth={3} strokeLinecap="round" fill="none" />
    </g>
  ),
  nutmeg: () => (
    <>
      <ellipse cx="45" cy="50" rx="26" ry="32" fill="#8a5a30" {...O} />
      <path d="M38 24 Q32 50 38 78 M51 21 Q57 50 51 80" stroke="#c99a5c" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <circle cx="72" cy="70" r="15" fill="#e8cba0" {...O} />
      <path d="M66 66 Q78 63 76 73 Q68 78 66 70" stroke="#8a5a30" strokeWidth={3} strokeLinecap="round" fill="none" />
    </>
  ),
  pepper: () => (
    <>
      <circle cx="50" cy="17" r="9" fill="#7c4a12" {...O} />
      <path d="M40 27 L60 27 Q59 39 54 45 Q67 51 67 67 L67 86 L33 86 L33 67 Q33 51 46 45 Q41 39 40 27 Z" fill="#5c3a1c" {...O} />
      <path d="M41 52 Q39 66 40 80" stroke="#8a5e34" strokeWidth={4.6} strokeLinecap="round" fill="none" />
      <g fill="#2e2013" stroke={INK} strokeWidth={2}>
        <circle cx="78" cy="83" r="4.4" />
        <circle cx="85" cy="73" r="3.4" />
      </g>
    </>
  ),
  salt: () => (
    <>
      <path d="M34 36 L66 36 L66 79 Q66 88 50 88 Q34 88 34 79 Z" fill="#f6ead0" {...O} />
      <path d="M36 36 Q36 15 50 15 Q64 15 64 36 Z" fill="#a8a294" {...O} />
      <path d="M40 44 L40 78" stroke="#fffdf6" strokeWidth={5} strokeLinecap="round" fill="none" />
      <g fill={INK}>
        <circle cx="44" cy="26" r="2.2" />
        <circle cx="52" cy="23" r="2.2" />
        <circle cx="58" cy="28" r="2.2" />
      </g>
    </>
  ),
  vanilla: () => (
    <>
      <path d="M40 12 Q28 48 44 86" stroke={INK} strokeWidth={13} strokeLinecap="round" fill="none" />
      <path d="M40 12 Q28 48 44 86" stroke="#4a3018" strokeWidth={8} strokeLinecap="round" fill="none" />
      <path d="M60 12 Q48 48 64 86" stroke={INK} strokeWidth={13} strokeLinecap="round" fill="none" />
      <path d="M60 12 Q48 48 64 86" stroke="#4a3018" strokeWidth={8} strokeLinecap="round" fill="none" />
      {/* tie binding the pod pair */}
      <rect x="33" y="11" width="34" height="9" rx="4.5" fill="#c99a5c" stroke={INK} strokeWidth={3} />
      <path d="M38 20 Q30 48 42 80" stroke="#8a5e34" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <g fill="#20140a">
        <circle cx="72" cy="80" r="2.4" />
        <circle cx="78" cy="72" r="2" />
      </g>
    </>
  ),
  coconut_desiccated: () => (
    <>
      <circle cx="46" cy="48" r="32" fill="#6b4022" {...O} />
      <circle cx="46" cy="48" r="22" fill="#fffdf6" />
      <circle cx="46" cy="48" r="10" fill="#e8d9b8" stroke={INK} strokeWidth={3} />
      {/* husk fibres */}
      <path d="M18 33 Q14 38 13 44 M67 24 Q71 29 75 36 M29 74 Q24 70 20 64" stroke="#3d2410" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <g fill="#fffdf6" stroke={INK} strokeWidth={2}>
        <rect x="72" y="66" width="13" height="5.5" rx="2.75" transform="rotate(22 78.5 68.75)" />
        <rect x="66" y="78" width="12" height="5.5" rx="2.75" transform="rotate(-14 72 80.75)" />
        <rect x="78" y="86" width="11" height="5" rx="2.5" transform="rotate(10 83.5 88.5)" />
      </g>
    </>
  ),

  // ---- pasta, noodles, rice ----
  spaghetti: () => (
    <>
      <path d="M40 12 L60 12 L59 41 L64 46 L67 88 L33 88 L36 46 L41 41 Z" fill="#f4cf72" {...O} />
      <path d="M46 14 L44 86 M52 14 L52 86 M57 14 L59 86" stroke="#dfa93c" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path d="M42 15 L39 84" stroke="#fbe8b0" strokeWidth={3} strokeLinecap="round" fill="none" />
      <rect x="33" y="41" width="34" height="10" rx="5" fill="#b5401c" {...O} />
    </>
  ),
  pasta_linguine: () => (
    <>
      <path d="M16 34 Q33 20 50 34 Q67 48 84 34 L84 46 Q67 60 50 46 Q33 32 16 46 Z" fill="#f4cf72" {...O} />
      <path d="M16 56 Q33 42 50 56 Q67 70 84 56 L84 68 Q67 82 50 68 Q33 54 16 68 Z" fill="#e8bc54" {...O} />
      <path d="M16 78 Q33 64 50 78 Q67 92 84 78 L84 88 Q67 100 50 88 Q33 76 16 88 Z" fill="#f4cf72" {...O} />
      <path d="M20 38 Q33 27 46 36" stroke="#fbe8b0" strokeWidth={3.2} strokeLinecap="round" fill="none" />
    </>
  ),
  noodle_glass: () => (
    <>
      <path d="M50 8 Q33 8 33 20 Q33 29 42 31 Q29 43 29 61 Q29 85 50 88 Q71 85 71 61 Q71 43 58 31 Q67 29 67 20 Q67 8 50 8 Z" fill="#f2ecdc" {...O} />
      <path d="M42 36 Q36 56 40 80 M52 34 Q48 58 52 84 M60 38 Q64 58 60 80 M44 44 Q56 58 62 72" stroke="#c2b494" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <path d="M36 42 Q33 58 36 74" stroke="#fbf8ee" strokeWidth={3.6} strokeLinecap="round" fill="none" />
      <path d="M43 20 Q50 16 57 20" stroke="#cfc2a4" strokeWidth={2.6} strokeLinecap="round" fill="none" />
    </>
  ),
  rice_paper: () => (
    <>
      <circle cx="61" cy="61" r="28" fill="#e6d9ba" {...O} />
      <circle cx="41" cy="41" r="29" fill="#f6efdc" {...O} />
      {/* woven crosshatch on the top sheet */}
      <path d="M30 35 L52 35 M30 45 L52 45 M36 28 L36 52 M46 28 L46 52" stroke="#dccba2" strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <path d="M20 32 Q24 21 34 16" stroke="#fdf9ee" strokeWidth={3.6} strokeLinecap="round" fill="none" />
    </>
  ),
  rice_arborio: () =>
    riceSack(
      '#d9b878',
      '#f0d9a8',
      grainCluster(
        <>
          <ellipse cx="36" cy="24" rx="6.5" ry="5" />
          <ellipse cx="50" cy="19" rx="7" ry="5.4" />
          <ellipse cx="64" cy="24" rx="6.5" ry="5" />
        </>
      ),
      <rect x="26" y="60" width="48" height="10" fill="#b5401c" />
    ),
  rice_basmati: () =>
    riceSack(
      '#e0c48c',
      '#f2dfb4',
      grainCluster(
        <>
          <ellipse cx="36" cy="24" rx="9" ry="3.2" transform="rotate(-28 36 24)" />
          <ellipse cx="50" cy="19" rx="9.5" ry="3.2" transform="rotate(6 50 19)" />
          <ellipse cx="64" cy="24" rx="9" ry="3.2" transform="rotate(30 64 24)" />
        </>
      ),
      <rect x="26" y="60" width="48" height="10" fill="#557c1e" />
    ),
  rice_jasmine: () =>
    riceSack(
      '#d2ab6a',
      '#ecd2a0',
      grainCluster(
        <>
          <ellipse cx="38" cy="24" rx="7" ry="3.6" transform="rotate(-22 38 24)" />
          <ellipse cx="52" cy="19" rx="7.2" ry="3.6" transform="rotate(10 52 19)" />
          <ellipse cx="64" cy="25" rx="6.8" ry="3.6" transform="rotate(32 64 25)" />
        </>
      ),
      // jasmine blossom marks the sack
      <>
        <g fill="#fffdf6">
          <circle cx="50" cy="60" r="4.2" />
          <circle cx="43" cy="65" r="4.2" />
          <circle cx="57" cy="65" r="4.2" />
          <circle cx="45" cy="72" r="4.2" />
          <circle cx="55" cy="72" r="4.2" />
        </g>
        <circle cx="50" cy="66.5" r="3.2" fill="#d9a41e" />
      </>
    ),

  // ---- breakfast grains & meals ----
  oats: () => (
    <>
      {sack('#dcb26a', '#7c4a12', '#eed2a0', (
        // drooping oat spikelet
        <>
          <path d="M50 46 Q51 60 48 74" stroke="#8a5e34" strokeWidth={2.8} strokeLinecap="round" fill="none" />
          <g fill="#fdf3dc" stroke={INK} strokeWidth={2.2}>
            <ellipse cx="42" cy="56" rx="3.2" ry="6.5" transform="rotate(-34 42 56)" />
            <ellipse cx="58" cy="58" rx="3.2" ry="6.5" transform="rotate(32 58 58)" />
            <ellipse cx="44" cy="68" rx="3" ry="6" transform="rotate(-26 44 68)" />
            <ellipse cx="57" cy="70" rx="3" ry="6" transform="rotate(24 57 70)" />
          </g>
        </>
      ))}
      {/* rolled flakes spilling past the sack foot */}
      <g fill="#fdf3dc" stroke={INK} strokeWidth={2}>
        <ellipse cx="82" cy="78" rx="4.2" ry="3.2" transform="rotate(-18 82 78)" />
        <ellipse cx="87" cy="88" rx="3.4" ry="2.6" transform="rotate(14 87 88)" />
      </g>
    </>
  ),
  muesli: () => (
    <>
      <path d="M22 50 Q28 34 42 38 Q46 28 58 31 Q72 28 74 40 Q83 42 81 50 Z" fill="#e8c988" {...O} />
      <g fill="#b5813c">
        <rect x="32" y="40" width="9" height="5" rx="2.5" transform="rotate(-18 36.5 42.5)" />
        <rect x="52" y="35" width="9" height="5" rx="2.5" transform="rotate(12 56.5 37.5)" />
        <rect x="64" y="42" width="8" height="4.6" rx="2.3" transform="rotate(-10 68 44.3)" />
      </g>
      <g fill="#4a2c14">
        <circle cx="46" cy="44" r="3.2" />
        <circle cx="60" cy="45" r="3" />
      </g>
      <path d="M14 50 L86 50 Q86 72 66 84 L34 84 Q14 72 14 50 Z" fill="#c9622e" {...O} />
      <path d="M20 56 Q24 70 36 78" stroke="#e8935c" strokeWidth={4.6} strokeLinecap="round" fill="none" />
    </>
  ),
  weetbix: () => (
    <>
      <g transform="rotate(-5 50 38)">
        <rect x="16" y="25" width="68" height="26" rx="7" fill="#c98a4a" {...O} />
        <path d="M26 33 L32 31 M39 35 L45 33 M52 32 L58 34 M64 32 L70 34 M29 43 L35 45 M43 44 L49 42 M57 45 L63 43 M68 42 L74 44" stroke="#a2662c" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </g>
      <g transform="rotate(4 50 69)">
        <rect x="18" y="56" width="68" height="26" rx="7" fill="#d9a05b" {...O} />
        <path d="M26 62 Q42 58 58 60" stroke="#ecc28a" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d="M29 72 L35 74 M43 73 L49 71 M57 74 L63 72 M69 71 L75 73" stroke="#b5813c" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </g>
    </>
  ),
  couscous: () =>
    riceSack(
      '#c9a05c',
      '#e2c890',
      <g fill="#fdf3dc" stroke={INK} strokeWidth={1.6}>
        <circle cx="35" cy="24" r="2.6" />
        <circle cx="42" cy="20" r="2.6" />
        <circle cx="50" cy="23" r="2.6" />
        <circle cx="58" cy="19" r="2.6" />
        <circle cx="65" cy="24" r="2.6" />
        <circle cx="46" cy="26" r="2.2" />
        <circle cx="54" cy="25.5" r="2.2" />
      </g>,
      <rect x="26" y="60" width="48" height="10" fill="#8a3a24" />
    ),
  quinoa: () => (
    <>
      <path d="M24 50 Q30 36 44 40 Q50 32 60 36 Q74 34 76 50 Z" fill="#f2dfb4" {...O} />
      <g fill="#fdf3dc" stroke="#a87a2c" strokeWidth={2.2}>
        <circle cx="38" cy="44" r="3.4" />
        <circle cx="50" cy="39" r="3.4" />
        <circle cx="62" cy="44" r="3.4" />
        <circle cx="44" cy="47" r="3" />
        <circle cx="56" cy="46.5" r="3" />
      </g>
      <path d="M16 50 L84 50 Q84 73 64 84 L36 84 Q16 73 16 50 Z" fill="#8a5a30" {...O} />
      <path d="M22 56 Q26 70 38 78" stroke="#b5813c" strokeWidth={4.6} strokeLinecap="round" fill="none" />
    </>
  ),
  polenta: () =>
    bag('#f0c452', '#f8dc84', (
      <>
        <path d="M38 76 Q50 54 62 76 Z" fill="#c98a10" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <g fill="#c98a10">
          <circle cx="44" cy="49" r="2" />
          <circle cx="52" cy="44" r="2" />
          <circle cx="58" cy="50" r="2" />
        </g>
      </>
    )),

  // ---- noodles & pasta shapes ----
  noodle_egg: () => (
    <>
      <circle cx="48" cy="50" r="34" fill="#f4cf72" {...O} />
      <path d="M20 42 Q25 36 30 42 Q35 48 40 42 Q45 36 50 42 Q55 48 60 42 Q65 36 70 42 Q73 45 76 42" stroke="#c98a2e" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <path d="M18 55 Q23 49 28 55 Q33 61 38 55 Q43 49 48 55 Q53 61 58 55 Q63 49 68 55 Q73 61 78 55" stroke="#c98a2e" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <path d="M24 68 Q29 62 34 68 Q39 74 44 68 Q49 62 54 68 Q59 74 64 68 Q69 62 72 68" stroke="#c98a2e" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <path d="M26 29 Q32 23 38 29 Q44 35 50 29 Q56 23 62 29" stroke="#fbe8b0" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      {/* loose strand escaping the cake */}
      <path d="M76 66 Q92 70 88 80 Q85 88 74 85" stroke="#dfa93c" strokeWidth={4.4} strokeLinecap="round" fill="none" />
      <path d="M76 66 Q92 70 88 80 Q85 88 74 85" stroke="#f4cf72" strokeWidth={2} strokeLinecap="round" fill="none" />
    </>
  ),
  noodle_rice: () => (
    <>
      <path d="M34 12 Q50 4 66 12 L68 44 L72 88 L28 88 L32 44 Z" fill="#f6efdc" {...O} />
      <path d="M39 11 L37 86 M45.5 9 L45 86 M55 9 L55.5 86 M61 11 L63 86" stroke="#d8caa6" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <path d="M50.5 8.5 L50 44" stroke="#fffdf6" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <path d="M38 17 Q50 11 62 17" stroke="#d8caa6" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <rect x="30" y="46" width="40" height="11" rx="5.5" fill="#c9622e" {...O} />
    </>
  ),
  pasta: () => (
    <>
      {/* penne: slant-cut tube */}
      <g transform="rotate(-20 32 28)">
        <path d="M8 21 L44 21 L52 38 L16 38 Z" fill="#f4cf72" {...O} />
        <path d="M10.5 23.5 L17.5 35.5" stroke="#c98a2e" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d="M18 26 L46 26" stroke="#fbe8b0" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <path d="M22 32 L50 32" stroke="#dfa93c" strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </g>
      {/* farfalle */}
      <path d="M58 12 Q62 25 58 38 L72 31 L86 38 Q82 25 86 12 L72 19 Z" fill="#e8bc54" {...O} />
      <path d="M69 18 L69 32 M75 18 L75 32" stroke="#dfa93c" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      {/* elbow macaroni */}
      <path d="M30 86 Q30 56 50 56 Q70 56 70 86 L58 86 Q58 69 50 69 Q42 69 42 86 Z" fill="#f4cf72" {...O} />
      <path d="M36 74 Q38 63 46 60 M64 74 Q62 63 54 60" stroke="#dfa93c" strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </>
  ),

  // ---- crumbs, pulses & leavening ----
  breadcrumbs: () => (
    <>
      <path d="M30 32 L70 32 L70 79 Q70 88 60 88 L40 88 Q30 88 30 79 Z" fill="#f6ead0" {...O} />
      <path d="M33 46 L67 46 L67 78 Q67 84 59 84 L41 84 Q33 84 33 78 Z" fill="#e2a94e" />
      <g fill="#b5762a">
        <circle cx="43" cy="56" r="2.2" />
        <circle cx="53" cy="63" r="2.2" />
        <circle cx="60" cy="53" r="2.2" />
        <circle cx="45" cy="72" r="2.2" />
        <circle cx="58" cy="75" r="2.2" />
      </g>
      <path d="M37 51 L37 78" stroke="#fdf6e2" strokeWidth={4} strokeLinecap="round" fill="none" />
      <rect x="26" y="20" width="48" height="14" rx="6" fill="#b5401c" {...O} />
      <g fill="#e2a94e" stroke={INK} strokeWidth={1.8}>
        <circle cx="81" cy="44" r="3" />
        <circle cx="86" cy="56" r="2.6" />
        <circle cx="82" cy="67" r="2.2" />
      </g>
    </>
  ),
  chickpea_dry: () => {
    const pea = (
      <>
        <path d="M34 40 Q28 32 34 27 Q40 22 44 29 Q57 24 66 33 Q75 43 68 56 Q60 68 46 65 Q32 61 31 47 Q31 42 34 40 Z" fill="#e8c278" {...O} />
        <path d="M43 30 Q46 40 42 50" stroke="#c9a24c" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </>
    );
    return (
      <>
        <g transform="translate(-4 -4) scale(0.78)">{pea}</g>
        <g transform="translate(32 3) scale(0.72)">{pea}</g>
        <g transform="translate(8 27) scale(0.85)">{pea}</g>
        <path d="M42 56 Q47 51 54 51" stroke="#f6dfa8" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      </>
    );
  },
  lentil_red: () => (
    <>
      <path d="M15 79 Q18 46 50 42 Q82 46 85 79 Q68 85 50 85 Q32 85 15 79 Z" fill="#e8743a" {...O} />
      <g fill="#c9531f">
        <circle cx="38" cy="58" r="4.2" />
        <circle cx="54" cy="52" r="4.2" />
        <circle cx="66" cy="62" r="4.2" />
        <circle cx="46" cy="68" r="4.2" />
        <circle cx="60" cy="73" r="4.2" />
        <circle cx="30" cy="70" r="4.2" />
      </g>
      <path d="M26 60 Q30 50 40 47" stroke="#f6975c" strokeWidth={4.4} strokeLinecap="round" fill="none" />
      <g fill="#e8743a" stroke={INK} strokeWidth={2.4}>
        <circle cx="14" cy="89" r="4.4" />
        <circle cx="86" cy="90" r="4" />
      </g>
    </>
  ),
  yeast: () => (
    <>
      <g transform="rotate(-7 48 60)">
        <rect x="24" y="36" width="48" height="50" rx="4" fill="#f0dfbc" {...O} />
        <path d="M24 45 L72 45 M24 77 L72 77" stroke="#c9a86c" strokeWidth={2.6} fill="none" />
        <path d="M30 51 L30 71" stroke="#fdf6e2" strokeWidth={4.6} strokeLinecap="round" fill="none" />
        <g fill="#b5813c">
          <circle cx="42" cy="69" r="5.5" />
          <circle cx="52" cy="61" r="4" />
          <circle cx="60" cy="53" r="3" />
        </g>
      </g>
      {/* rising bubble trail escaping the torn corner */}
      <g fill="#fdf6e2" stroke={INK} strokeWidth={2.4}>
        <circle cx="74" cy="26" r="4.6" />
        <circle cx="81" cy="15" r="3.6" />
        <circle cx="88" cy="7" r="2.8" />
      </g>
    </>
  ),

  // ---- tins, spice jars & dried herbs ----
  cocoa: () => (
    <>
      <rect x="31" y="15" width="38" height="13" rx="4.5" fill="#4a2c14" {...O} />
      <path d="M26 28 L74 28 L74 79 Q74 88 63 88 L37 88 Q26 88 26 79 Z" fill="#6e4322" {...O} />
      <path d="M33 36 L33 78" stroke="#8a5e34" strokeWidth={5} strokeLinecap="round" fill="none" />
      <g transform="rotate(14 51 59)">
        <path d="M51 42 L51 37" stroke="#557c1e" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d="M51 42 Q60 49 59 60 Q58 72 51 77 Q44 72 43 60 Q42 49 51 42 Z" fill="#d97c2e" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <path d="M47.5 46 Q45.5 60 47.5 73 M51 43.5 L51 75.5 M54.5 46 Q56.5 60 54.5 73" stroke="#a85618" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </g>
    </>
  ),
  chilli_powder: () =>
    jar('#c22a14', '#e0512e', (
      <>
        <path d="M57 47 Q66 57 57 70 Q52 77 47 73 Q54 64 52 54 Q51 48 57 47 Z" fill="#f6dfc2" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
        <path d="M57 47 Q59 41 54 39" stroke="#3f6016" strokeWidth={3.2} strokeLinecap="round" fill="none" />
      </>
    )),
  sumac: () =>
    jar('#96283a', '#b8505e', (
      <>
        <path d="M38 74 Q52 54 66 74 Z" fill="#5c1220" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
        <g fill="#f2c4ca">
          <circle cx="60" cy="44" r="2.4" />
          <circle cx="53" cy="50" r="2" />
          <circle cx="47" cy="56" r="1.8" />
        </g>
      </>
    )),
  star_anise: () => (
    <>
      <g fill="#6b4022" stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(45 50 50)" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(90 50 50)" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(135 50 50)" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(180 50 50)" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(225 50 50)" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(270 50 50)" />
        <path d="M50 10 Q58 24 55 43 L45 43 Q42 24 50 10 Z" transform="rotate(315 50 50)" />
      </g>
      <circle cx="50" cy="50" r="9.5" fill="#8a5a30" stroke={INK} strokeWidth={3.2} />
      <ellipse cx="50" cy="25" rx="4.2" ry="7" fill="#c99a5c" />
      <circle cx="50" cy="25" r="2.8" fill="#2e1d12" />
    </>
  ),
  oregano: () => (
    <>
      <path d="M32 86 Q44 62 56 20" stroke="#8a6a2c" strokeWidth={3.6} strokeLinecap="round" fill="none" />
      <g fill="#748234" stroke={INK} strokeWidth={2.4}>
        <ellipse cx="30" cy="70" rx="6" ry="3.4" transform="rotate(-35 30 70)" />
        <ellipse cx="46" cy="69" rx="6" ry="3.4" transform="rotate(30 46 69)" />
        <ellipse cx="36" cy="54" rx="6" ry="3.4" transform="rotate(-35 36 54)" />
        <ellipse cx="52" cy="54" rx="6" ry="3.4" transform="rotate(30 52 54)" />
        <ellipse cx="42" cy="37" rx="6" ry="3.4" transform="rotate(-35 42 37)" />
        <ellipse cx="58" cy="38" rx="6" ry="3.4" transform="rotate(30 58 38)" />
        <ellipse cx="48" cy="24" rx="6" ry="3.4" transform="rotate(-40 48 24)" />
      </g>
      <ellipse cx="59" cy="15" rx="6" ry="3.4" transform="rotate(60 59 15)" fill="#a2b25c" stroke={INK} strokeWidth={2.4} />
      <g fill="#748234">
        <circle cx="72" cy="80" r="2.4" />
        <circle cx="79" cy="87" r="2" />
      </g>
    </>
  ),

  // ---- brews ----
  coffee: () => (
    <>
      <path d="M34 52 L31 18 L69 18 L66 52 Z" fill="#9a9280" {...O} />
      <path d="M31 24 L21 30 L31 38 Z" fill="#9a9280" {...O} />
      <path d="M69 24 Q83 25 81 38 Q80 46 67 45" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M27 88 L35 56 L65 56 L73 88 Z" fill="#8a8272" {...O} />
      <rect x="33" y="50" width="34" height="8" rx="3" fill="#6e6552" {...O} />
      <path d="M31 18 Q35 10 50 10 Q65 10 69 18 Z" fill="#8a8272" {...O} />
      <circle cx="50" cy="8" r="4" fill="#4a3018" stroke={INK} strokeWidth={2.6} />
      <path d="M41 24 L39 46" stroke="#c8c0ac" strokeWidth={4} strokeLinecap="round" fill="none" />
      <g fill="#5c3a1c" stroke={INK} strokeWidth={2.4}>
        <ellipse cx="83" cy="78" rx="7" ry="9" transform="rotate(18 83 78)" />
        <ellipse cx="88" cy="61" rx="5.5" ry="7" transform="rotate(-14 88 61)" />
      </g>
      <path d="M81 71 Q85 78 81 85" stroke="#c99a5c" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </>
  ),
  tea: () => (
    <>
      <path d="M50 26 Q56 14 68 11 Q78 9 81 14" stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <rect x="74" y="13" width="16" height="13" rx="3" fill="#b5401c" stroke={INK} strokeWidth={3} />
      <path d="M36 38 L42 26 L58 26 L64 38 Z" fill="#e2cda2" {...O} />
      <path d="M46 31 L54 31" stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path d="M30 38 L70 38 L70 72 Q70 86 50 86 Q30 86 30 72 Z" fill="#f0e2c2" {...O} />
      <path d="M33 64 L67 64 L67 72 Q67 83 50 83 Q33 83 33 72 Z" fill="#c9a05c" />
      <g fill="#8a5e34">
        <circle cx="44" cy="72" r="2" />
        <circle cx="52" cy="76" r="2" />
        <circle cx="59" cy="71" r="2" />
      </g>
      <path d="M37 44 L37 60" stroke="#fbf2dc" strokeWidth={4} strokeLinecap="round" fill="none" />
    </>
  ),
  tea_chai: () => (
    <>
      <path d="M42 22 Q38 14 44 7 M58 22 Q62 14 56 7" stroke="#c9b896" strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <path d="M32 30 L68 30 L64 86 Q64 90 58 90 L42 90 Q36 90 36 86 Z" fill="#fdf6e2" {...O} />
      <path d="M36.5 62 L63.5 62 L62.5 84 Q62.5 87 58 87 L42 87 Q37.5 87 37.5 84 Z" fill="#8a5230" />
      <path d="M35.5 48 L64.5 48 L63.5 62 L36.5 62 Z" fill="#c9862e" />
      <path d="M35 36 L65 36 L64.5 48 L35.5 48 Z" fill="#f2e0b8" />
      <path d="M40 39 L39 80" stroke="#f6e8c8" strokeWidth={3.4} strokeLinecap="round" fill="none" />
    </>
  ),
};
