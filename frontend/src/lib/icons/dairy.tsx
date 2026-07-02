import { ReactNode } from 'react';
import { INK } from '../dishArt/tokens';

/**
 * Icon v2 overrides — dairy + red-meat proteins, "Ink & Cream" language.
 *
 * Grammar: viewBox 0 0 100 100, one dominant silhouette (~65–80% of box),
 * ink outline #3f2410 at 4–4.5 with round joins/caps, exactly one lighter
 * highlight shape, ≤2 small accessory marks, flat colour only.
 */

const SW = 4.25; // standard silhouette stroke
const line = { fill: 'none' as const, strokeLinecap: 'round' as const };
const solid = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const DAIRY_ICONS: Record<string, () => ReactNode> = {
  // ======================= CHEESE =======================

  /** dirA reference wedge, ported: 3-face cheddar with two crumbs. */
  cheddar: () => (
    <>
      <path d="M10 80 L90 80 L90 38 Z" fill="#f0a12e" {...solid} strokeWidth={4.5} />
      <path d="M10 80 L90 38 L82 26 L4 68 Z" fill="#f8c964" {...solid} strokeWidth={4.5} />
      <path d="M90 80 L90 38 L82 26 L82 68 Z" fill="#d98a1e" {...solid} strokeWidth={4.5} />
      <circle cx="16" cy="89" r="3.4" fill="#f0a12e" stroke={INK} strokeWidth={2.6} />
      <circle cx="28" cy="92" r="2.6" fill="#f0a12e" stroke={INK} strokeWidth={2.6} />
    </>
  ),

  /** Same wedge family, pale body, blue veins on the cut face. */
  blue_cheese: () => (
    <>
      <path d="M10 80 L90 80 L90 38 Z" fill="#f2ecd6" {...solid} strokeWidth={4.5} />
      <path d="M10 80 L90 38 L82 26 L4 68 Z" fill="#fdfaee" {...solid} strokeWidth={4.5} />
      <path d="M90 80 L90 38 L82 26 L82 68 Z" fill="#ded2b2" {...solid} strokeWidth={4.5} />
      <path
        d="M58 61 Q66 56 71 62 Q69 70 61 68 Q56 66 58 61 Z M74 50 Q80 47 83 53 Q80 59 75 57 Q72 54 74 50 Z M46 71 Q52 68 55 72 Q52 78 47 76 Q44 74 46 71 Z"
        fill="#5b7a9a"
      />
      <circle cx="79" cy="71" r="3.5" fill="#5b7a9a" />
    </>
  ),

  /** Hard straw wedge standing on its thick golden rind, shaved curl beside. */
  parmesan: () => (
    <>
      <path d="M12 64 L50 14 L88 64 Z" fill="#eed383" {...solid} strokeWidth={4.5} />
      <path d="M12 64 L88 64 L88 80 L12 80 Z" fill="#b5762a" {...solid} strokeWidth={4.5} />
      <path d="M50 26 L66 48 L34 48 Z" fill="#f9eab4" />
      <circle cx="42" cy="57" r="2" fill="#c49a45" />
      <circle cx="58" cy="55" r="2" fill="#c49a45" />
      <path d="M52 84 Q70 70 92 78 Q76 94 52 84 Z" fill="#fdf6e2" {...solid} strokeWidth={4} />
    </>
  ),

  /** White block with a broken-off corner chunk and a crumb. */
  feta: () => (
    <>
      <path d="M16 40 L50 26 L82 38 L50 52 Z" fill="#fffdf8" {...solid} strokeWidth={4.5} />
      <path d="M16 40 L50 52 L50 84 L16 72 Z" fill="#f6efdb" {...solid} strokeWidth={4.5} />
      <path d="M50 52 L82 38 L82 58 L72 56 L70 68 L50 84 Z" fill="#e7dab9" {...solid} strokeWidth={4.5} />
      <path d="M80 66 L92 62 L94 74 L84 78 Z" fill="#fffdf8" {...solid} strokeWidth={3.6} />
      <circle cx="74" cy="86" r="3" fill="#fffdf8" stroke={INK} strokeWidth={2.6} />
    </>
  ),

  /** Soft ball with the tied knot on top and a wet sheen. */
  mozzarella: () => (
    <>
      <circle cx="50" cy="58" r="33" fill="#f8efdb" {...solid} strokeWidth={4.5} />
      <path d="M36 30 Q38 16 50 16 Q64 16 64 28 Q64 34 56 36 Q48 38 40 36 Q36 34 36 30 Z" fill="#f8efdb" {...solid} strokeWidth={4.25} />
      <path d="M28 54 Q31 40 45 35" stroke="#ffffff" strokeWidth={7} {...line} />
      <path d="M42 37 Q50 43 58 37" stroke={INK} strokeWidth={3} {...line} />
    </>
  ),

  // ======================= DAIRY =======================

  /** Butter dish: cream plate under a golden 3-face pat. */
  butter: () => (
    <>
      <ellipse cx="50" cy="74" rx="40" ry="12" fill="#efdcc4" {...solid} strokeWidth={4.25} />
      <path d="M20 50 L66 50 L66 72 L20 72 Z" fill="#f2c93c" {...solid} strokeWidth={4.25} />
      <path d="M66 50 L82 42 L82 64 L66 72 Z" fill="#dfae24" {...solid} strokeWidth={4.25} />
      <path d="M20 50 L36 42 L82 42 L66 50 Z" fill="#fbe88a" {...solid} strokeWidth={4.25} />
      <path d="M42 50 L42 72" stroke={INK} strokeWidth={2.6} {...line} />
    </>
  ),

  /** Old-fashioned glass bottle, gold foil cap, milk fill inside. */
  milk: () => (
    <>
      <path
        d="M40 20 L40 30 Q28 38 28 52 L28 82 Q28 90 36 90 L64 90 Q72 90 72 82 L72 52 Q72 38 60 30 L60 20 Z"
        fill="#f4ecd8"
        {...solid}
        strokeWidth={4.5}
      />
      <path d="M32 50 Q50 42 68 50 L68 81 Q68 86 63 86 L37 86 Q32 86 32 81 Z" fill="#fffdf8" />
      <rect x="36" y="12" width="28" height="10" rx="3.5" fill="#e8b820" stroke={INK} strokeWidth={4} />
      <path d="M36 58 L36 76" stroke="#e4d8bc" strokeWidth={3.5} {...line} />
    </>
  ),

  /** Small jug tipped over, pouring a stream into a dollop. */
  cream: () => (
    <>
      <g transform="rotate(-20 54 46)">
        <path
          d="M32 32 Q22 34 18 26 L32 20 L70 20 Q82 20 82 34 L82 52 Q82 66 66 66 L46 66 Q32 66 32 50 Z"
          fill="#fdf6e2"
          {...solid}
          strokeWidth={4.25}
        />
        <path d="M82 34 Q94 38 90 50 Q87 59 79 57" stroke={INK} strokeWidth={4.25} {...line} />
      </g>
      <path d="M10 40 L19 42 L21 70 L12 70 Z" fill="#fffdf8" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M6 84 Q2 70 16 67 Q31 65 33 77 Q34 88 19 89 Q8 90 6 84 Z" fill="#fffdf8" {...solid} strokeWidth={4.25} />
    </>
  ),

  /** Kraft pot with rolled rim, wooden spoon standing in a dollop. */
  yoghurt: () => (
    <>
      <rect x="60" y="6" width="9" height="34" rx="4.5" fill="#c9913c" stroke={INK} strokeWidth={4} transform="rotate(16 64 22)" />
      <path d="M24 38 L76 38 L70 84 Q50 92 30 84 Z" fill="#f3e6d0" {...solid} strokeWidth={4.5} />
      <rect x="19" y="30" width="62" height="12" rx="6" fill="#efdcc4" {...solid} strokeWidth={4.25} />
      <path d="M30 32 Q30 20 42 22 Q46 12 57 17 Q68 21 64 32 Z" fill="#fffdf8" {...solid} strokeWidth={4.25} />
    </>
  ),

  /** One whole egg behind, cracked shell with the yolk in front. */
  eggs: () => (
    <>
      <path d="M36 24 Q52 26 54 50 Q55 72 36 74 Q19 72 20 50 Q22 26 36 24 Z" fill="#fbf3e0" {...solid} strokeWidth={4.25} />
      <path d="M28 40 Q29 32 35 30" stroke="#fffdf8" strokeWidth={5.5} {...line} />
      <path d="M48 56 L55 48 L61 56 L68 48 L74 56 L81 48 L84 56 L84 66 Q84 82 66 82 Q48 82 48 66 Z" fill="#fffdf8" {...solid} strokeWidth={4.25} />
      <circle cx="66" cy="54" r="9.5" fill="#f2b41e" stroke={INK} strokeWidth={3.6} />
    </>
  ),

  // ======================= PROTEINS =======================

  /** Crumbly browned mound with two stray crumbs. */
  beef_mince: () => (
    <>
      <path
        d="M14 70 Q12 54 26 50 Q26 36 42 38 Q48 26 60 32 Q74 30 76 44 Q88 48 86 62 Q88 76 72 76 L26 76 Q14 76 14 70 Z"
        fill="#a03a20"
        {...solid}
        strokeWidth={4.5}
      />
      <g fill="#d47a52">
        <rect x="28" y="48" width="19" height="9.5" rx="4.75" transform="rotate(18 37 53)" />
        <rect x="52" y="42" width="19" height="9.5" rx="4.75" transform="rotate(-14 61 47)" />
        <rect x="42" y="61" width="18" height="9" rx="4.5" transform="rotate(8 51 65)" />
      </g>
      <circle cx="20" cy="86" r="3.4" fill="#a03a20" stroke={INK} strokeWidth={2.6} />
      <circle cx="32" cy="89" r="2.6" fill="#a03a20" stroke={INK} strokeWidth={2.6} />
    </>
  ),

  /** T-bone cut: chunky red slab, bold cream bone, marbled lobe. */
  beef_steak: () => (
    <>
      <path
        d="M12 54 Q10 34 34 30 Q62 24 82 36 Q94 44 90 58 Q85 72 60 76 Q28 80 16 68 Q12 62 12 54 Z"
        fill="#a52a24"
        {...solid}
        strokeWidth={4.5}
      />
      <path
        d="M32 32 L56 32 L54 42 L48 42 L51 70 L41 70 L44 42 L34 42 Z"
        fill="#fdf3dc"
        {...solid}
        strokeWidth={3.6}
      />
      <path d="M62 48 Q70 44 78 49" stroke="#f0b8a0" strokeWidth={4} {...line} />
      <path d="M60 60 Q68 56 76 60" stroke="#f0b8a0" strokeWidth={4} {...line} />
    </>
  ),

  /** Skin-on thigh: golden roasted piece, bone end out the left. */
  chicken_thigh: () => (
    <>
      <path d="M34 64 L18 78" stroke={INK} strokeWidth={12} strokeLinecap="round" fill="none" />
      <path d="M34 64 L18 78" stroke="#fdf3dc" strokeWidth={6.5} strokeLinecap="round" fill="none" />
      <circle cx="12" cy="72" r="6.5" fill="#fdf3dc" stroke={INK} strokeWidth={3.6} />
      <circle cx="20" cy="86" r="6.5" fill="#fdf3dc" stroke={INK} strokeWidth={3.6} />
      <path
        d="M30 62 Q20 40 41 30 Q59 20 76 29 Q94 39 89 58 Q84 76 62 78 Q40 80 30 62 Z"
        fill="#e2a04a"
        {...solid}
        strokeWidth={4.5}
      />
      <path d="M38 48 Q44 36 61 33" stroke="#f6cf8e" strokeWidth={7} {...line} />
      <path d="M40 66 Q57 73 74 65" stroke="#b06a24" strokeWidth={4} {...line} />
    </>
  ),

  /** Three-bone rack: glazed arched slab, bones out the top. */
  pork_ribs: () => (
    <>
      <g fill="#fdf3dc" stroke={INK} strokeWidth={4}>
        <rect x="24" y="18" width="11" height="26" rx="5.5" transform="rotate(-8 29.5 31)" />
        <rect x="44.5" y="14" width="11" height="26" rx="5.5" />
        <rect x="65" y="18" width="11" height="26" rx="5.5" transform="rotate(8 70.5 31)" />
      </g>
      <path d="M10 44 Q50 28 90 44 L88 82 Q50 68 12 82 Z" fill="#a8441e" {...solid} strokeWidth={4.5} />
      <path d="M22 54 Q50 43 78 54" stroke="#e08a52" strokeWidth={6} {...line} />
      <path d="M37 48 L35 72 M63 48 L65 72" stroke={INK} strokeWidth={3} {...line} />
    </>
  ),

  // ======================= SOFT DAIRY TUBS =======================

  /** Basket tub overflowing with a big soft heap of curds. */
  ricotta: () => (
    <>
      <path d="M24 46 Q18 34 31 32 Q33 19 46 22 Q53 12 62 20 Q75 20 73 33 Q83 36 76 46 Z" fill="#fffdf8" {...solid} strokeWidth={4.25} />
      <path d="M36 34 Q40 27 47 29 M53 25 Q60 23 62 30" stroke="#e5d8b8" strokeWidth={3.4} {...line} />
      <path d="M18 46 L82 46 L75 84 Q50 91 25 84 Z" fill="#efdcc4" {...solid} strokeWidth={4.5} />
      <path d="M28 53 L31 78" stroke="#fdf6e2" strokeWidth={4.5} {...line} />
    </>
  ),

  /** Wide shallow tub, silky surface folded into one soft swirl. */
  mascarpone: () => (
    <>
      <path d="M12 46 L12 62 Q12 78 30 80 L70 80 Q88 78 88 62 L88 46 Z" fill="#e7d6b4" {...solid} strokeWidth={4.5} />
      <ellipse cx="50" cy="46" rx="38" ry="14" fill="#fffdf8" {...solid} strokeWidth={4.5} />
      <path d="M32 46 Q43 32 63 40 Q58 53 40 51 Q31 50 32 46 Z" fill="#ecdcb4" />
      <path d="M42 45 Q50 37 58 42" stroke="#c9b284" strokeWidth={3.2} {...line} />
      <path d="M19 54 Q19 68 29 74" stroke="#f4e8ce" strokeWidth={4} {...line} />
    </>
  ),

  /** Squat white pot, sage band, metal spoon lifting from the dollop. */
  sour_cream: () => (
    <>
      <g transform="rotate(20 66 24)">
        <rect x="62" y="16" width="7.5" height="32" rx="3.75" fill="#b8ab8e" stroke={INK} strokeWidth={3.4} />
        <ellipse cx="65.8" cy="12" rx="8.5" ry="6.5" fill="#b8ab8e" stroke={INK} strokeWidth={3.6} />
        <ellipse cx="65.8" cy="11" rx="4.5" ry="3" fill="#fffdf8" />
      </g>
      <path d="M26 42 L74 42 L69 84 Q50 91 31 84 Z" fill="#f6eedd" {...solid} strokeWidth={4.5} />
      <path d="M27.8 56 L72.2 56 L70.9 68 L29.1 68 Z" fill="#b7c47e" />
      <path d="M32 42 Q31 31 41 31 Q42 23 51 26 Q50 30 54 32 Q63 31 62 42 Z" fill="#fffdf8" {...solid} strokeWidth={4.25} />
      <path d="M33 47 L35 78" stroke="#fffdf8" strokeWidth={4} {...line} />
    </>
  ),

  /** Foil-wrapped block, one end torn open to show the white cheese. */
  cream_cheese: () => (
    <>
      <path d="M14 52 L78 52 L78 76 L14 76 Z" fill="#fffdf8" {...solid} strokeWidth={4.5} />
      <path d="M14 52 L28 42 L92 42 L78 52 Z" fill="#fdf6e2" {...solid} strokeWidth={4.5} />
      <path d="M78 52 L92 42 L92 66 L78 76 Z" fill="#e7dab9" {...solid} strokeWidth={4.5} />
      <path d="M14 52 L54 52 L50 60 L55 68 L50 76 L14 76 Z" fill="#cfc8b6" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      <path d="M14 52 L28 42 L64 42 L58 47 L54 52 Z" fill="#e2dccc" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      <path d="M24 58 L28 72 M38 56 L36 70" stroke="#efeadc" strokeWidth={3} {...line} />
    </>
  ),

  /** Small gable carton, dairy-blue band with a golden butter pat + flecks. */
  buttermilk: () => (
    <>
      <rect x="45" y="10" width="11" height="8" rx="2" fill="#f6ecd2" stroke={INK} strokeWidth={3.4} />
      <path d="M33 38 L40 20 L61 20 L68 38 Z" fill="#f6ecd2" {...solid} strokeWidth={4} />
      <path d="M33 38 L68 38 L68 82 Q68 88 62 88 L39 88 Q33 88 33 82 Z" fill="#fdf6e2" {...solid} strokeWidth={4.5} />
      <rect x="35.2" y="50" width="30.6" height="23" fill="#8fb0c0" />
      <path d="M42 61 L48 57 L59 57 L53 61 Z" fill="#fbe88a" />
      <path d="M42 61 L53 61 L53 68 L42 68 Z" fill="#f2c93c" />
      <path d="M53 61 L59 57 L59 64 L53 68 Z" fill="#dfae24" />
      <circle cx="61.5" cy="68.5" r="1.8" fill="#f2c93c" />
      <circle cx="39" cy="54.5" r="1.8" fill="#f2c93c" />
    </>
  ),

  // ======================= FIRM CHEESE + SMOKED FISH =======================

  /** Firm pale slab with char grill stripes across the top face. */
  haloumi: () => (
    <>
      <path d="M10 46 L40 24 L90 24 L60 46 Z" fill="#fbf3e0" {...solid} strokeWidth={4.5} />
      <path d="M10 46 L60 46 L60 78 L10 78 Z" fill="#f6eedd" {...solid} strokeWidth={4.5} />
      <path d="M60 46 L90 24 L90 56 L60 78 Z" fill="#e7dab9" {...solid} strokeWidth={4.5} />
      <path d="M26 42 L46 27 M40 42 L60 27 M54 42 L74 27" stroke="#a8672a" strokeWidth={4.5} {...line} />
      <path d="M16 54 L16 70" stroke="#fffdf8" strokeWidth={4} {...line} />
    </>
  ),

  /** Thin folded ribbon slices: deep valleys, pale striations, dark cut base. */
  smoked_salmon: () => (
    <>
      <path
        d="M11 78 L11 52 Q10 36 21 36 Q31 36 31 52 L31 66 Q31 71 35 68 Q39 64 39 46 Q39 28 51 28 Q62 28 61 46 Q60 62 64 59 Q68 55 69 42 Q70 31 79 33 Q88 35 88 50 L88 78 Z"
        fill="#f2836a"
        {...solid}
        strokeWidth={4.5}
      />
      <rect x="13.5" y="70" width="72" height="5.8" fill="#bf4a30" />
      <path d="M16 50 Q17 42 22 41 M45 42 Q46 34 51 33 M74 44 Q75 38 79 38" stroke="#fcc4ac" strokeWidth={4} {...line} />
    </>
  ),

  // ======================= CHICKEN =======================

  /** Trussed roast bird: plump body, both drumstick knobs up at the rear. */
  chicken_whole: () => (
    <>
      <path d="M58 46 Q70 44 78 34 Q82 28 88 31 Q93 34 89 41 Q82 52 66 56 Z" fill="#c97b2c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle cx="90" cy="27" r="5.5" fill="#fdf3dc" stroke={INK} strokeWidth={3.4} />
      <path d="M54 56 Q68 58 78 50 Q84 45 89 50 Q93 55 87 60 Q76 70 58 68 Z" fill="#e2a04a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle cx="92" cy="46" r="5.5" fill="#fdf3dc" stroke={INK} strokeWidth={3.4} />
      <path d="M10 52 Q8 28 36 24 Q66 20 72 42 Q76 58 66 68 Q54 80 32 78 Q12 76 10 52 Z" fill="#dd9440" {...solid} strokeWidth={4.5} />
      <path d="M20 42 Q26 30 42 28" stroke="#f6cf8e" strokeWidth={6.5} {...line} />
      <path d="M28 58 Q40 66 54 62" stroke="#a8641e" strokeWidth={3.6} {...line} />
    </>
  ),

  /** Plump raw fillet with a sheen line, small tenderloin alongside. */
  chicken_breast: () => (
    <>
      <path d="M14 76 Q10 66 22 62 Q34 58 44 64 Q50 68 46 74 Q40 80 26 80 Q16 80 14 76 Z" fill="#f2ad90" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M18 48 Q18 28 44 26 Q70 24 86 38 Q92 44 86 50 Q72 64 48 66 Q22 68 18 48 Z" fill="#f6c3aa" {...solid} strokeWidth={4.5} />
      <path d="M30 42 Q38 31 54 30" stroke="#fbdcc8" strokeWidth={6} {...line} />
    </>
  ),

  // ======================= FREEZER + FLATBREADS =======================

  /** Crimp-top freezer bag, golden kernels, one frost sparkle. */
  corn_frozen: () => (
    <>
      <rect x="20" y="16" width="60" height="11" rx="3" fill="#c9d9dc" stroke={INK} strokeWidth={4} />
      <path d="M24 27 L76 27 L81 82 Q82 90 74 90 L26 90 Q18 90 19 82 Z" fill="#e3edee" {...solid} strokeWidth={4.5} />
      <path d="M27 34 L25 78" stroke="#ffffff" strokeWidth={4.5} {...line} />
      <g fill="#f2c230" stroke={INK} strokeWidth={2.8}>
        <circle cx="42" cy="52" r="5.5" />
        <circle cx="56" cy="48" r="5.5" />
        <circle cx="61" cy="62" r="5.5" />
        <circle cx="46" cy="66" r="5.5" />
      </g>
      <path d="M68 32 L68 42 M63 37 L73 37" stroke="#8fb6c4" strokeWidth={3} {...line} />
    </>
  ),

  /** Zip-seal freezer bag of banana coins with a frost sparkle. */
  banana_frozen: () => (
    <>
      <path d="M20 18 L80 18 L83 84 Q83 90 76 90 L24 90 Q17 90 17 84 Z" fill="#f0f2e6" {...solid} strokeWidth={4.5} />
      <path d="M21 27 L79.5 27 M21 33 L79.8 33" stroke="#a9bcae" strokeWidth={2.8} />
      <circle cx="40" cy="56" r="10.5" fill="#f8e6ae" stroke={INK} strokeWidth={3.6} />
      <circle cx="40" cy="56" r="4" fill="none" stroke="#d9b45c" strokeWidth={2.6} />
      <circle cx="59" cy="70" r="10.5" fill="#f8e6ae" stroke={INK} strokeWidth={3.6} />
      <circle cx="59" cy="70" r="4" fill="none" stroke="#d9b45c" strokeWidth={2.6} />
      <path d="M67 44 L67 54 M62 49 L72 49" stroke="#9ab8c0" strokeWidth={3} {...line} />
    </>
  ),

  /** Rolled soft wrap, seam across the middle, filling out the open end. */
  wrap: () => (
    <g transform="rotate(-14 50 58)">
      <path d="M80 44 Q94 50 93 58 Q94 66 80 72 Z" fill="#557c1e" stroke={INK} strokeWidth={3.6} strokeLinejoin="round" />
      <circle cx="86" cy="57" r="4" fill="#c23a2c" />
      <path d="M16 58 Q16 42 30 42 L80 42 L80 74 L30 74 Q16 74 16 58 Z" fill="#f0d49c" {...solid} strokeWidth={4.5} />
      <ellipse cx="80" cy="58" rx="5" ry="16" fill="#fbe8b0" stroke={INK} strokeWidth={3.4} />
      <path d="M44 43 Q52 58 44 73" stroke="#c99a4e" strokeWidth={3.4} {...line} />
      <path d="M24 50 Q22 58 24 66" stroke="#fbe8b0" strokeWidth={4.5} {...line} />
    </g>
  ),

  /** Stack of flat discs, char freckles across the top one. */
  tortilla: () => (
    <>
      <path d="M12 66 Q12 58 50 58 Q88 58 88 66 Q88 76 50 76 Q12 76 12 66 Z" fill="#e8c98e" {...solid} strokeWidth={4.25} />
      <path d="M12 56 Q12 48 50 48 Q88 48 88 56 Q88 66 50 66 Q12 66 12 56 Z" fill="#f0d5a0" {...solid} strokeWidth={4.25} />
      <ellipse cx="50" cy="45" rx="38" ry="13" fill="#f6dfae" {...solid} strokeWidth={4.5} />
      <ellipse cx="50" cy="44" rx="26" ry="8" fill="#fbe8b0" />
      <g fill="#b06a24">
        <circle cx="38" cy="42" r="2.4" />
        <circle cx="54" cy="47" r="2.6" />
        <circle cx="62" cy="41" r="2.2" />
      </g>
    </>
  ),
};
