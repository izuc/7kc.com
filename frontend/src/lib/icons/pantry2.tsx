import { ReactNode } from 'react';
import { INK } from '../dishArt/tokens';

/**
 * Icon v2 overrides — pantry wet goods & bakery ("Ink & Cream" language).
 *
 * Grammar: viewBox 0 0 100 100, one dominant silhouette (~65–80% of the box),
 * ink outline 4–4.5 with round joins, ONE lighter highlight shape, ≤2 small
 * accessory marks, flat colour only. Containers are distinguished by bottle
 * SHAPE + liquid colour + a drawn content motif — never labels or lettering.
 */

const SW = 4.5; // dominant silhouette stroke
const S2 = 4; // secondary shapes
const S3 = 3; // small motifs

/** Stock carton: gable top + colour band carrying a cream content motif. */
const carton = (band: string, motif: ReactNode) => (
  <>
    <rect x="44" y="12" width="12" height="8" rx="2" fill="#f6ecd2" stroke={INK} strokeWidth={3.5} />
    <path d="M30 38 L38 20 L62 20 L70 38 Z" fill="#f6ecd2" stroke={INK} strokeWidth={S2} strokeLinejoin="round" />
    <path d="M30 38 L70 38 L70 82 Q70 88 64 88 L36 88 Q30 88 30 82 Z" fill="#fdf6e2" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x="32.2" y="50" width="35.6" height="24" fill={band} />
    {motif}
  </>
);

export const PANTRY2_ICONS: Record<string, () => ReactNode> = {
  // ---- tins & tinned goods -------------------------------------------------
  anchovy: () => (
    <>
      <rect x="60" y="22" width="26" height="10" rx="5" fill="#b8ab8e" stroke={INK} strokeWidth={3.5} />
      <rect x="10" y="31" width="80" height="44" rx="10" fill="#cfc4a8" stroke={INK} strokeWidth={SW} />
      <rect x="17" y="38" width="66" height="30" rx="7" fill="#e0a33c" />
      <path d="M24 49 Q24 44 40 44 Q54 44 57 49 Q54 54 40 54 Q24 54 24 49 Z M57 49 L65 44.5 L65 53.5 Z" fill="#6b4a2a" stroke={INK} strokeWidth={S3} strokeLinejoin="round" />
      <path d="M30 60 Q30 56 44 56 Q56 56 59 60 Q56 64 44 64 Q30 64 30 60 Z M59 60 L66 56 L66 64 Z" fill="#8a5f36" stroke={INK} strokeWidth={S3} strokeLinejoin="round" />
      <ellipse cx="73" cy="45" rx="6" ry="3" fill="#f2c14e" />
    </>
  ),
  tinned_tomato: () => (
    <>
      <circle cx="44" cy="27" r="11" fill="#dc2626" stroke={INK} strokeWidth={S2} />
      <circle cx="61" cy="30" r="8" fill="#c23a2c" stroke={INK} strokeWidth={S2} />
      <path d="M37 22 A9 9 0 0 1 44 18" fill="none" stroke="#f06a4a" strokeWidth={3.5} strokeLinecap="round" />
      <rect x="42" y="13" width="4.5" height="6" rx="2" fill="#4d7c0f" stroke={INK} strokeWidth={2.5} />
      <path d="M28 35 L72 35 L72 80 Q72 86 66 86 L34 86 Q28 86 28 80 Z" fill="#cfc4a8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx="50" cy="35" rx="22" ry="6.5" fill="#8a7a5c" stroke={INK} strokeWidth={3.5} />
      <path d="M30 50 L70 50 M30 70 L70 70" stroke="#a89a7c" strokeWidth={2.5} />
    </>
  ),
  coconut_milk: () => (
    <>
      <rect x="28" y="24" width="44" height="58" rx="5" fill="#f6efdb" stroke={INK} strokeWidth={SW} />
      <path d="M28 33 L72 33 M28 73 L72 73" stroke="#c9b896" strokeWidth={2.5} />
      <rect x="30.2" y="42" width="39.6" height="24" fill="#557c1e" />
      <circle cx="50" cy="54" r="10" fill="#6e4322" stroke={INK} strokeWidth={3.5} />
      <circle cx="50" cy="54" r="5.5" fill="#fffdf8" />
    </>
  ),

  // ---- bottles: oils & sauces ---------------------------------------------
  olive_oil: () => (
    <>
      <rect x="43" y="6" width="14" height="9" rx="2" fill="#3f6016" stroke={INK} strokeWidth={S2} />
      <path d="M44 15 L44 26 Q44 33 39 38 Q34 43 34 50 L34 83 Q34 90 41 90 L59 90 Q66 90 66 83 L66 50 Q66 43 61 38 Q56 33 56 26 L56 15 Z" fill="#eee7cf" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M37 54 L37 82 Q37 87 42 87 L58 87 Q63 87 63 82 L63 54 Z" fill="#8a9a2e" />
      <path d="M41 58 L41 80" stroke="#b9c25e" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="52" cy="69" r="6.5" fill="#3a3a2c" stroke={INK} strokeWidth={S3} />
      <path d="M52 61 Q58 54 63 56 Q59 62 52 62 Z" fill="#557c1e" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
    </>
  ),
  vegetable_oil: () => (
    <>
      <rect x="42" y="8" width="16" height="10" rx="2" fill="#b13a2a" stroke={INK} strokeWidth={S2} />
      <path d="M43 18 L43 26 Q43 31 37 35 Q28 40 28 50 L28 82 Q28 90 36 90 L64 90 Q72 90 72 82 L72 50 Q72 40 63 35 Q57 31 57 26 L57 18 Z" fill="#f8eecb" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M31 46 L31 81 Q31 87 37 87 L63 87 Q69 87 69 81 L69 46 Z" fill="#f2c230" />
      <path d="M35 52 L35 80" stroke="#f6dd7c" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M50 54 Q44 63 44 69 Q44 76 50 76 Q56 76 56 69 Q56 63 50 54 Z" fill="#e8a824" stroke={INK} strokeWidth={S3} strokeLinejoin="round" />
    </>
  ),
  sesame_oil: () => (
    <>
      <rect x="44" y="8" width="12" height="9" rx="2" fill="#d9a41e" stroke={INK} strokeWidth={3.5} />
      <path d="M46 17 L46 36 Q46 41 41 44 Q29 51 29 66 Q29 88 50 88 Q71 88 71 66 Q71 51 59 44 Q54 41 54 36 L54 17 Z" fill="#efe3cc" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="50" cy="67" r="17.5" fill="#7a4a1a" />
      <path d="M37 58 Q41 52 48 51" stroke="#a8763c" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <ellipse cx="46" cy="66" rx="3.2" ry="2" fill="#f6e8c8" transform="rotate(-20 46 66)" />
      <ellipse cx="55" cy="72" rx="3.2" ry="2" fill="#f6e8c8" transform="rotate(15 55 72)" />
    </>
  ),
  soy_sauce: () => (
    <>
      <rect x="42" y="6" width="16" height="10" rx="2" fill="#b13a2a" stroke={INK} strokeWidth={S2} />
      <path d="M44 16 L44 22 L34 27 Q30 29 30 34 L30 83 Q30 90 37 90 L63 90 Q70 90 70 83 L70 34 Q70 29 66 27 L56 22 L56 16 Z" fill="#2e1d12" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M36 34 L36 82" stroke="#6b4a30" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  fish_sauce: () => (
    <>
      <rect x="43" y="6" width="14" height="9" rx="2" fill="#3f6c1d" stroke={INK} strokeWidth={S2} />
      <path d="M44 15 L44 24 Q44 29 40 32 Q36 35 36 41 L36 84 Q36 90 42 90 L58 90 Q64 90 64 84 L64 41 Q64 35 60 32 Q56 29 56 24 L56 15 Z" fill="#f2e3c2" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M39 44 L39 83 Q39 87 43 87 L57 87 Q61 87 61 83 L61 44 Z" fill="#c97a16" />
      <path d="M41 62 Q46 55 52 57 Q50 62 52 66 Q46 69 41 62 Z M52 62 L59 57.5 L59 66 Z" fill="#f8e0b8" />
      <circle cx="46" cy="61" r="1.6" fill={INK} />
    </>
  ),
  tomato_sauce: () => (
    <>
      <path d="M47 8 L53 8 L55.5 18 L44.5 18 Z" fill="#a82818" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x="40" y="18" width="20" height="10" rx="3" fill="#a82818" stroke={INK} strokeWidth={S2} />
      <path d="M38 28 L62 28 Q66 32 66 40 L66 82 Q66 90 58 90 L42 90 Q34 90 34 82 L34 40 Q34 32 38 28 Z" fill="#dc2626" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M41 40 L41 78" stroke="#f06a4a" strokeWidth={4} strokeLinecap="round" />
      <circle cx="51" cy="61" r="9" fill="#a82818" stroke={INK} strokeWidth={S3} />
      <path d="M47 53 L51 56 L55 52" fill="none" stroke="#4d7c0f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // ---- the four vinegars: distinct SHAPE + liquid colour -------------------
  vinegar_white: () => (
    <>
      <rect x="44.5" y="4" width="11" height="9" rx="2" fill="#8a7a5c" stroke={INK} strokeWidth={3.5} />
      <path d="M45 13 L45 30 Q45 36 41 40 Q38 44 38 50 L38 85 Q38 91 44 91 L56 91 Q62 91 62 85 L62 50 Q62 44 59 40 Q55 36 55 30 L55 13 Z" fill="#f7f4ea" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M41 52 L41 84 Q41 88 45 88 L55 88 Q59 88 59 84 L59 52 Z" fill="#eceadf" />
      <path d="M44.5 56 L44.5 82" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  vinegar_rice: () => (
    <>
      <rect x="42" y="10" width="16" height="9" rx="2" fill="#b8a878" stroke={INK} strokeWidth={3.5} />
      <path d="M43 19 L43 26 Q43 31 35 36 Q24 43 24 57 L24 79 Q24 88 34 88 L66 88 Q76 88 76 79 L76 57 Q76 43 65 36 Q57 31 57 26 L57 19 Z" fill="#f4ecd6" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M27 54 L73 54 L73 78 Q73 85 66 85 L34 85 Q27 85 27 78 Z" fill="#ead9ac" />
      <path d="M32 58 L32 78" stroke="#f6ecc8" strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx="45" cy="68" rx="4" ry="2.2" fill="#fffdf8" stroke={INK} strokeWidth={2} transform="rotate(-25 45 68)" />
      <ellipse cx="57" cy="73" rx="4" ry="2.2" fill="#fffdf8" stroke={INK} strokeWidth={2} transform="rotate(20 57 73)" />
    </>
  ),
  vinegar_cider: () => (
    <>
      <rect x="43" y="6" width="14" height="9" rx="2" fill="#8a5a30" stroke={INK} strokeWidth={3.5} />
      <path d="M44 15 L44 24 Q44 30 39 34 Q30 41 30 55 Q30 74 36 82 Q40 90 50 90 Q60 90 64 82 Q70 74 70 55 Q70 41 61 34 Q56 30 56 24 L56 15 Z" fill="#f2e0b8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M33 52 Q33 72 38 80 Q42 87 50 87 Q58 87 62 80 Q67 72 67 52 Q62 46 50 46 Q38 46 33 52 Z" fill="#d9941e" />
      <path d="M38 55 L38 76" stroke="#eab54a" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="50" cy="67" r="7" fill="#c23a2c" stroke={INK} strokeWidth={S3} />
      <path d="M50 59 Q54 53 58 54 Q56 59 50 60 Z" fill="#557c1e" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </>
  ),
  vinegar_red_wine: () => (
    <>
      <rect x="44" y="4" width="12" height="10" rx="2" fill="#4a1420" stroke={INK} strokeWidth={3.5} />
      <path d="M45 14 L45 30 Q45 38 41 43 Q39 46 39 51 L39 85 Q39 91 45 91 L55 91 Q61 91 61 85 L61 51 Q61 46 59 43 Q55 38 55 30 L55 14 Z" fill="#6e1f2e" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M44 50 L44 84" stroke="#9a4054" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="50" cy="63" r="3.4" fill="#b06478" />
      <circle cx="53" cy="70" r="3.4" fill="#b06478" />
    </>
  ),

  // ---- stock cartons: colour band + cream motif ----------------------------
  stock_chicken: () =>
    carton(
      '#d99a1e',
      <>
        <path d="M40 67 Q38 58 46 56 Q47 51 53 52 Q58 53 57 58 L62 59 L57 61 Q58 67 50 68 L44 68 Q41 68 40 67 Z" fill="#fdf6e2" />
        <circle cx="53" cy="55.5" r="1.4" fill={INK} />
      </>
    ),
  stock_beef: () =>
    carton(
      '#8a3a24',
      <>
        <path d="M40 54 Q36 51 37 46 Q43 47 45 52 M60 54 Q64 51 63 46 Q57 47 55 52" fill="none" stroke="#fdf6e2" strokeWidth={3.2} strokeLinecap="round" />
        <ellipse cx="50" cy="60" rx="9" ry="8" fill="#fdf6e2" />
        <circle cx="47" cy="63" r="1.4" fill={INK} />
        <circle cx="53" cy="63" r="1.4" fill={INK} />
      </>
    ),
  stock_veg: () =>
    carton(
      '#557c1e',
      <>
        <path d="M50 71 L44 57 Q50 53.5 56 57 Z" fill="#fdf6e2" />
        <path d="M46.5 55 L44 51 M50 54.5 L50 50.5 M53.5 55 L56 51" fill="none" stroke="#fdf6e2" strokeWidth={2.6} strokeLinecap="round" />
      </>
    ),

  // ---- jars & condiments ----------------------------------------------------
  honey: () => (
    <>
      <rect x="38" y="16" width="24" height="11" rx="3" fill="#8a5a30" stroke={INK} strokeWidth={S2} />
      <path d="M33 38 L41 27 L59 27 L67 38 L67 72 L59 84 L41 84 L33 72 Z" fill="#e8a824" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M39 44 L39 66" stroke="#f6ce6a" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M84 10 L71 36" stroke="#8a5a30" strokeWidth={5} strokeLinecap="round" />
      <g fill="#b07a3c" stroke={INK} strokeWidth={2.8}>
        <ellipse cx="69" cy="41" rx="8" ry="3.5" />
        <ellipse cx="67.5" cy="47" rx="6.5" ry="3" />
        <ellipse cx="66.5" cy="52.5" rx="5" ry="2.5" />
      </g>
    </>
  ),
  dijon: () => (
    <>
      <rect x="32" y="18" width="36" height="12" rx="4" fill="#8a5a30" stroke={INK} strokeWidth={S2} />
      <path d="M28 30 L72 30 Q76 30 76 36 L76 76 Q76 88 62 88 L38 88 Q24 88 24 76 L24 36 Q24 30 28 30 Z" fill="#e0b52a" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M32 42 L32 72" stroke="#f2d270" strokeWidth={4.5} strokeLinecap="round" />
      <circle cx="47" cy="58" r="2.8" fill="#8a5a30" />
      <circle cx="58" cy="66" r="2.8" fill="#8a5a30" />
    </>
  ),
  fermented_black_bean: () => (
    <>
      <rect x="33" y="14" width="34" height="12" rx="3" fill="#b13a2a" stroke={INK} strokeWidth={S2} />
      <path d="M30 26 L70 26 Q74 26 74 32 L74 78 Q74 88 62 88 L38 88 Q26 88 26 78 L26 32 Q26 26 30 26 Z" fill="#4a3826" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M33 36 L33 70" stroke="#7a6448" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx="43" cy="52" rx="6" ry="4" fill="#1f150e" transform="rotate(-20 43 52)" />
      <ellipse cx="57" cy="61" rx="6" ry="4" fill="#1f150e" transform="rotate(15 57 61)" />
    </>
  ),

  // ---- bakery & sweet -------------------------------------------------------
  bread: () => (
    <>
      <path d="M13 60 Q13 36 32 30 Q50 24 68 30 Q87 36 87 60 Q87 76 72 77 L28 77 Q13 76 13 60 Z" fill="#d9a05b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M30 40 L40 51 M47 35 L57 46 M63 37 L71 48" stroke="#f6e2b8" strokeWidth={5.5} strokeLinecap="round" />
    </>
  ),
  biscuit_sweet: () => (
    <>
      <path d="M50 20 A33 33 0 1 0 80 40 Q70 37 74 31 Q66 29 63 22.5 A33 33 0 0 0 50 20 Z" fill="#d9a05b" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <circle cx="48" cy="55" r="21" fill="#e8bd7e" />
      <circle cx="42" cy="48" r="3.2" fill="#6b4a2a" />
      <circle cx="55" cy="62" r="3.2" fill="#6b4a2a" />
    </>
  ),
  pastry_shortcrust: () => (
    <>
      <path d="M16 34 L84 34 L84 76 Q76 90 68 76 Q60 90 50 76 Q40 90 32 76 Q24 90 16 76 Z" fill="#ecd6a4" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M84 34 L58 34 L84 54 Z" fill="#f9eed6" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx="36" cy="52" r="2.4" fill="#b8905a" />
      <circle cx="45" cy="58" r="2.4" fill="#b8905a" />
      <g transform="rotate(-16 50 22)">
        <rect x="10" y="17" width="12" height="8" rx="4" fill="#8a5a30" stroke={INK} strokeWidth={S3} />
        <rect x="78" y="17" width="12" height="8" rx="4" fill="#8a5a30" stroke={INK} strokeWidth={S3} />
        <rect x="20" y="13" width="60" height="16" rx="8" fill="#b07a3c" stroke={INK} strokeWidth={S2} />
      </g>
    </>
  ),
  gnocchi: () => (
    <>
      <g transform="rotate(-14 34 40)">
        <rect x="19" y="29" width="30" height="22" rx="10" fill="#f4cf72" stroke={INK} strokeWidth={SW} />
        <path d="M28 33 L26 47 M36 32 L34 48 M44 33 L42 47" stroke="#dfa93c" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx="30" cy="34" rx="6" ry="2.6" fill="#fbe8b0" />
      </g>
      <g transform="rotate(10 66 44)">
        <rect x="51" y="33" width="30" height="22" rx="10" fill="#f4cf72" stroke={INK} strokeWidth={SW} />
        <path d="M60 37 L58 51 M68 36 L66 52 M76 37 L74 51" stroke="#dfa93c" strokeWidth={3} strokeLinecap="round" />
      </g>
      <g transform="rotate(-4 50 70)">
        <rect x="35" y="59" width="30" height="22" rx="10" fill="#f4cf72" stroke={INK} strokeWidth={SW} />
        <path d="M44 63 L42 77 M52 62 L50 78 M60 63 L58 77" stroke="#dfa93c" strokeWidth={3} strokeLinecap="round" />
      </g>
    </>
  ),
  marshmallow: () => (
    <>
      <rect x="21" y="52" width="27" height="30" rx="4" fill="#fff4f0" stroke={INK} strokeWidth={S2} />
      <ellipse cx="34.5" cy="52" rx="13.5" ry="6" fill="#fff4f0" stroke={INK} strokeWidth={S2} />
      <rect x="52" y="52" width="27" height="30" rx="4" fill="#fff4f0" stroke={INK} strokeWidth={S2} />
      <ellipse cx="65.5" cy="52" rx="13.5" ry="6" fill="#fff4f0" stroke={INK} strokeWidth={S2} />
      <rect x="36" y="26" width="28" height="28" rx="4" fill="#fff4f0" stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="26" rx="14" ry="6.2" fill="#fbd8d8" stroke={INK} strokeWidth={SW} />
    </>
  ),
  meringue: () => (
    <>
      <path d="M54 8 Q44 10 46 20 Q32 18 34 32 Q18 34 24 50 Q10 58 24 70 Q20 82 38 84 L62 84 Q80 82 76 70 Q90 58 76 50 Q82 34 66 32 Q68 18 54 20 Z" fill="#fdf4e0" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M36 34 Q50 42 64 34 M27 52 Q50 62 73 52" fill="none" stroke="#dcc394" strokeWidth={4} strokeLinecap="round" />
      <path d="M31 68 Q50 78 69 68" fill="none" stroke="#ffffff" strokeWidth={4.5} strokeLinecap="round" />
    </>
  ),

  // ---- fruit & nuts ----------------------------------------------------------
  dates: () => (
    <>
      <ellipse cx="62" cy="36" rx="22" ry="12" fill="#8a5230" stroke={INK} strokeWidth={S2} transform="rotate(-28 62 36)" />
      <circle cx="78" cy="26" r="3.5" fill={INK} />
      <ellipse cx="46" cy="57" rx="30" ry="16" fill="#6e4322" stroke={INK} strokeWidth={SW} transform="rotate(-18 46 57)" />
      <path d="M28 60 Q42 68 60 62" fill="none" stroke="#a87a4a" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  peanut: () => (
    <>
      <path d="M50 12 Q31 12 29 29 Q28 41 39 49 Q27 57 29 71 Q31 87 50 87 Q69 87 71 71 Q73 57 61 49 Q72 41 71 29 Q69 12 50 12 Z" fill="#dfb271" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M36 26 L50 22 M34 38 L54 33 M38 63 L56 59 M36 74 L54 72" stroke="#b8905a" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M38 20 Q31 26 31 34" fill="none" stroke="#f2d8a8" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  walnut: () => (
    <>
      <path d="M50 16 Q30 18 26 40 Q23 58 34 70 Q42 79 50 80 Q58 79 66 70 Q77 58 74 40 Q70 18 50 16 Z" fill="#c99a5c" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M50 22 Q44 34 51 44 Q57 54 50 64 Q46 70 50 75 M35 32 Q40 42 34 52 Q31 58 36 64 M65 32 Q60 42 66 52 Q69 58 64 64" fill="none" stroke="#8a5a28" strokeWidth={4} strokeLinecap="round" />
      <path d="M34 30 Q38 23 46 21" fill="none" stroke="#e8cba0" strokeWidth={4} strokeLinecap="round" />
    </>
  ),

  // ---- open-top tins: contents visible above the rim ------------------------
  tinned_chickpea: () => (
    <>
      <g fill="#e8c87e" stroke={INK} strokeWidth={S3}>
        <circle cx="40" cy="28" r="7.5" />
        <circle cx="53" cy="24" r="7.5" />
        <circle cx="62" cy="30" r="6.5" />
      </g>
      <path d="M48 20 A6 6 0 0 1 53 18" fill="none" stroke="#f6e2b0" strokeWidth={3} strokeLinecap="round" />
      <path d="M28 35 L72 35 L72 80 Q72 86 66 86 L34 86 Q28 86 28 80 Z" fill="#cfc4a8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx="50" cy="35" rx="22" ry="6.5" fill="#8a7a5c" stroke={INK} strokeWidth={3.5} />
      <rect x="30.2" y="48" width="39.6" height="22" fill="#d9a84e" />
      <circle cx="50" cy="59" r="7" fill="#f6e2b0" />
    </>
  ),
  tinned_bean: () => (
    <>
      <g fill="#a32620" stroke={INK} strokeWidth={S3}>
        <ellipse cx="40" cy="27" rx="8" ry="5.5" transform="rotate(-25 40 27)" />
        <ellipse cx="54" cy="24" rx="8" ry="5.5" transform="rotate(10 54 24)" />
        <ellipse cx="63" cy="30" rx="7" ry="5" transform="rotate(35 63 30)" />
      </g>
      <path d="M28 35 L72 35 L72 80 Q72 86 66 86 L34 86 Q28 86 28 80 Z" fill="#cfc4a8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx="50" cy="35" rx="22" ry="6.5" fill="#8a7a5c" stroke={INK} strokeWidth={3.5} />
      <rect x="30.2" y="48" width="39.6" height="22" fill="#b13a2a" />
      <ellipse cx="50" cy="59" rx="8" ry="5.5" fill="#f6e2c8" transform="rotate(-18 50 59)" />
    </>
  ),
  tinned_black_bean: () => (
    <>
      <g fill="#241a12" stroke={INK} strokeWidth={S3}>
        <ellipse cx="40" cy="25" rx="7.5" ry="5" transform="rotate(-20 40 25)" />
        <ellipse cx="54" cy="22" rx="7.5" ry="5" transform="rotate(12 54 22)" />
        <ellipse cx="63" cy="28" rx="6.5" ry="4.5" transform="rotate(40 63 28)" />
      </g>
      <circle cx="41" cy="23.5" r="1.7" fill="#f6ecd2" />
      <circle cx="55" cy="20.5" r="1.7" fill="#f6ecd2" />
      <path d="M28 35 L72 35 L72 80 Q72 86 66 86 L34 86 Q28 86 28 80 Z" fill="#cfc4a8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse cx="50" cy="35" rx="22" ry="6.5" fill="#8a7a5c" stroke={INK} strokeWidth={3.5} />
      <rect x="30.2" y="48" width="39.6" height="22" fill="#3a3026" />
      <ellipse cx="50" cy="59" rx="7.5" ry="5" fill="#f6e2c8" transform="rotate(-15 50 59)" />
    </>
  ),
  tinned_tuna: () => (
    <>
      <path d="M16 46 L84 46 L84 66 Q84 74 76 74 L24 74 Q16 74 16 66 Z" fill="#cfc4a8" stroke={INK} strokeWidth={S2} strokeLinejoin="round" />
      <rect x="18" y="58" width="64" height="10" fill="#2e5f8a" />
      <ellipse cx="50" cy="46" rx="34" ry="12.5" fill="#cfc4a8" stroke={INK} strokeWidth={SW} />
      <ellipse cx="50" cy="46" rx="26" ry="8.5" fill="#f2cdb0" />
      <path d="M34 45 Q40 42 46 45 M50 49 Q56 46 62 49 M55 42 Q61 40 67 43" fill="none" stroke="#d9a284" strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),

  // ---- asian & western sauce bottles ----------------------------------------
  oyster_sauce: () => (
    <>
      <rect x="41" y="6" width="18" height="11" rx="2" fill="#3f6c1d" stroke={INK} strokeWidth={S2} />
      <path d="M43 17 L43 24 Q43 29 36 33 Q28 38 28 47 L28 82 Q28 90 36 90 L64 90 Q72 90 72 82 L72 47 Q72 38 64 33 Q57 29 57 24 L57 17 Z" fill="#3a2416" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M34 44 L34 80" stroke="#6b4a30" strokeWidth={4} strokeLinecap="round" />
      <path d="M50 74 L36 57 Q39 50 45 48 Q50 46 55 48 Q61 50 64 57 Z" fill="#e8d8b8" stroke={INK} strokeWidth={S3} strokeLinejoin="round" />
      <path d="M49 71 L43 51.5 M51 71 L57 51.5" stroke="#b8a582" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  vinegar_balsamic: () => (
    <>
      <rect x="44.5" y="4" width="11" height="9" rx="2" fill="#c9a227" stroke={INK} strokeWidth={3.5} />
      <path d="M45 13 L45 38 Q45 44 40 48 Q31 54 31 66 Q31 80 41 87 Q45 90 50 90 Q55 90 59 87 Q69 80 69 66 Q69 54 60 48 Q55 44 55 38 L55 13 Z" fill="#3a2018" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M38 60 Q35.5 67 37.5 75 M48 20 L48 34" stroke="#6e4a34" strokeWidth={3.5} fill="none" strokeLinecap="round" />
    </>
  ),
  sriracha: () => (
    <>
      <path d="M43 7 L57 7 L55 20 L45 20 Z" fill="#3f6c1d" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M45 20 L45 26 Q38 30 36 38 Q34 44 34 52 L34 82 Q34 90 42 90 L58 90 Q66 90 66 82 L66 52 Q66 44 64 38 Q62 30 55 26 L55 20 Z" fill="#d92b1e" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M39 46 L39 80" stroke="#f06a4a" strokeWidth={4} strokeLinecap="round" />
      <path d="M52 47 Q45 57 45 64 Q45 72 52 72 Q59 72 59 64 Q59 59 55.5 55 Q56.5 62 52 61.5 Q50 57 52 47 Z" fill="#f6e2c8" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
    </>
  ),
  worcestershire: () => (
    <>
      <rect x="44" y="4" width="12" height="9" rx="2" fill="#d97b16" stroke={INK} strokeWidth={3.5} />
      <path d="M45 13 L45 24 Q45 30 42 34 Q40 37 40 42 L40 85 Q40 91 46 91 L54 91 Q60 91 60 85 L60 42 Q60 37 58 34 Q55 30 55 24 L55 13 Z" fill="#2a1c10" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="41.5" y="16" width="17" height="13" rx="1.5" fill="#e8d8b0" stroke={INK} strokeWidth={3} />
      <path d="M45 50 L45 84" stroke="#5a4028" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  mayo: () => (
    <>
      <rect x="41" y="8" width="18" height="10" rx="3" fill="#3a6ea5" stroke={INK} strokeWidth={S2} />
      <path d="M42 18 L58 18 Q64 22 65 32 Q66 44 63 54 Q61 62 63 70 Q66 80 59 87 Q55 90 50 90 Q45 90 41 87 Q34 80 37 70 Q39 62 37 54 Q34 44 35 32 Q36 22 42 18 Z" fill="#f2e6c8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M43.5 47 Q50 40 56.5 46 Q62 51.5 56 56.5 Q50.5 61 46.5 56.5 Q43.5 53 47 49.5" fill="none" stroke="#ffffff" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M41 66 Q46 71 50 71" fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  tomato_paste: () => (
    <>
      <rect x="40" y="10" width="20" height="12" rx="3" fill="#8a7a5c" stroke={INK} strokeWidth={S2} />
      <path d="M39 22 L61 22 Q64 24 64 30 L64 76 L36 76 L36 30 Q36 24 39 22 Z" fill="#dc2626" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="31" y="75" width="38" height="9" rx="2" fill="#a82818" stroke={INK} strokeWidth={S2} />
      <path d="M41 30 L41 66" stroke="#f06a4a" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="52" cy="49" r="8.5" fill="#a82818" stroke={INK} strokeWidth={S3} />
      <path d="M48 42 L52 45 L56 41" fill="none" stroke="#4d7c0f" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  maple_syrup: () => (
    <>
      <rect x="44" y="5" width="12" height="9" rx="2" fill="#8a5a30" stroke={INK} strokeWidth={3.5} />
      <path d="M45 14 L45 28 Q45 34 40 37 Q31 42 31 52 L31 81 Q31 89 39 89 L61 89 Q69 89 69 81 L69 52 Q69 42 60 37 Q55 34 55 28 L55 14 Z" fill="#e8b04a" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M34 50 L34 80 Q34 86 40 86 L60 86 Q66 86 66 80 L66 50 Z" fill="#c97a16" />
      <path d="M37 54 L37 78" stroke="#e8a63c" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M50 45 L53.5 52 L60.5 49.5 L58 56 L65 59 L57.5 62.5 L59.5 69.5 L52.5 66.5 L50 69 L47.5 66.5 L40.5 69.5 L42.5 62.5 L35 59 L42 56 L39.5 49.5 L46.5 52 Z" fill="#f6e2c8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M50 68 L50 77" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),

  // ---- squat jars, tubs & spreads -------------------------------------------
  curry_paste_red: () => (
    <>
      <rect x="34" y="16" width="32" height="11" rx="3" fill="#c9a227" stroke={INK} strokeWidth={S2} />
      <path d="M30 27 L70 27 Q74 27 74 33 L74 78 Q74 88 62 88 L38 88 Q26 88 26 78 L26 33 Q26 27 30 27 Z" fill="#c23a2c" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M33 37 L33 70" stroke="#e06a4a" strokeWidth={4} strokeLinecap="round" />
      <path d="M55 46 Q61 57 52 67 Q50 69.5 48.5 66.5 Q56 58 51 48 Z" fill="#f6e2c8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M53 45 Q56 42 59 43" fill="none" stroke="#3f6c1d" strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),
  curry_paste_green: () => (
    <>
      <rect x="36" y="14" width="28" height="11" rx="3" fill="#8a7a5c" stroke={INK} strokeWidth={S2} />
      <path d="M33 25 L67 25 Q71 25 71 31 L71 79 Q71 88 60 88 L40 88 Q29 88 29 79 L29 31 Q29 25 33 25 Z" fill="#557c1e" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M35 35 L35 70" stroke="#7a9a3c" strokeWidth={4} strokeLinecap="round" />
      <path d="M52 68 L47 55 Q52 51.5 57 55 Z" fill="#f6e2c8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M49 52 L47 48 M55 52 L57 48" fill="none" stroke="#f6e2c8" strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
  peanut_butter: () => (
    <>
      <rect x="33" y="12" width="34" height="13" rx="3" fill="#b13a2a" stroke={INK} strokeWidth={S2} />
      <path d="M30 25 L70 25 Q74 25 74 31 L74 78 Q74 88 62 88 L38 88 Q26 88 26 78 L26 31 Q26 25 30 25 Z" fill="#b97b3e" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M33 34 L33 68" stroke="#d9a05b" strokeWidth={4} strokeLinecap="round" />
      <path d="M53 47 Q46 47 45.5 53 Q45.2 57 49 59.5 Q45.5 62 46 66.5 Q46.7 72 53 72 Q59.3 72 60 66.5 Q60.5 62 57 59.5 Q60.8 57 60.5 53 Q60 47 53 47 Z" fill="#f2d8a8" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M50 54 L56 52.5 M50 65 L56 63.5" stroke="#b8905a" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  vegemite: () => (
    <>
      <rect x="33" y="20" width="34" height="12" rx="4" fill="#e8c020" stroke={INK} strokeWidth={S2} />
      <path d="M29 32 L71 32 Q76 32 76 40 L76 74 Q76 88 60 88 L40 88 Q24 88 24 74 L24 40 Q24 32 29 32 Z" fill="#241a12" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M31 42 L31 68" stroke="#5a4a38" strokeWidth={4} strokeLinecap="round" />
      <path d="M50 45 L64 60 L50 75 L36 60 Z" fill="#c23a2c" stroke={INK} strokeWidth={S3} strokeLinejoin="round" />
      <path d="M50 52.5 L57 60 L50 67.5 L43 60 Z" fill="#f2c230" />
    </>
  ),
  tahini: () => (
    <>
      <rect x="34" y="14" width="32" height="12" rx="3" fill="#8a7a5c" stroke={INK} strokeWidth={S2} />
      <path d="M31 26 L69 26 Q73 26 73 32 L73 78 Q73 88 61 88 L39 88 Q27 88 27 78 L27 32 Q27 26 31 26 Z" fill="#e9d3a8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M34 36 L34 68" stroke="#f6e8c8" strokeWidth={4} strokeLinecap="round" />
      <path d="M42 48 Q50 42 58 48 Q63 53 58 58 Q52 63 47 58 Q43 54 47 51 Q51 48.5 53.5 52" fill="none" stroke="#b8905a" strokeWidth={3.4} strokeLinecap="round" />
      <ellipse cx="44" cy="70" rx="3" ry="1.9" fill="#fffdf8" stroke={INK} strokeWidth={1.8} transform="rotate(-15 44 70)" />
      <ellipse cx="55" cy="73" rx="3" ry="1.9" fill="#fffdf8" stroke={INK} strokeWidth={1.8} transform="rotate(20 55 73)" />
    </>
  ),
  miso: () => (
    <>
      <path d="M23 48 L27 82 Q28 88 34 88 L66 88 Q72 88 73 82 L77 48 Z" fill="#fdf6e2" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="28" y="62" width="44" height="13" fill="#b13a2a" />
      <ellipse cx="50" cy="48" rx="27" ry="8.5" fill="#b98a48" stroke={INK} strokeWidth={S2} />
      <path d="M36 49.5 Q43 44.5 50 47.5 Q57 50.5 64 46" fill="none" stroke="#d9ae6a" strokeWidth={3.4} strokeLinecap="round" />
    </>
  ),
  gochujang: () => (
    <>
      <rect x="26" y="26" width="48" height="12" rx="3" fill="#8a1f14" stroke={INK} strokeWidth={S2} />
      <path d="M30 38 L70 38 L66 82 Q65.4 88 59 88 L41 88 Q34.6 88 34 82 Z" fill="#c8281a" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M38.5 46 L40 78" stroke="#e85a3a" strokeWidth={4} strokeLinecap="round" />
      <path d="M55 51 Q60 61 52.5 70 Q50.5 72.5 49.5 69.5 Q56 61 51.5 52.5 Z" fill="#f6e2c8" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M53.5 50 Q56.5 47 59.5 48" fill="none" stroke="#3f6c1d" strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),
  kimchi: () => (
    <>
      <rect x="35" y="14" width="30" height="11" rx="3" fill="#8a7a5c" stroke={INK} strokeWidth={S2} />
      <path d="M32 25 L68 25 Q72 25 72 31 L72 78 Q72 88 60 88 L40 88 Q28 88 28 78 L28 31 Q28 25 32 25 Z" fill="#f4e6c8" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M31 34 L69 34 L69 78 Q69 85 60 85 L40 85 Q31 85 31 78 Z" fill="#d9541e" />
      <path d="M34 43 Q41 38 47 44 Q55 38 62 44 M33 56 Q40 51 46 57 Q54 51 64 57 M35 70 Q42 65 48 71 Q56 65 64 71" fill="none" stroke="#f2a05a" strokeWidth={3.2} strokeLinecap="round" />
    </>
  ),
  preserved_lemon: () => (
    <>
      <rect x="35" y="12" width="30" height="11" rx="3" fill="#c9a227" stroke={INK} strokeWidth={S2} />
      <path d="M32 23 L68 23 Q72 23 72 29 L72 78 Q72 88 60 88 L40 88 Q28 88 28 78 L28 29 Q28 23 32 23 Z" fill="#f2ecd0" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M31 32 L69 32 L69 78 Q69 85 60 85 L40 85 Q31 85 31 78 Z" fill="#f2df9a" />
      <path d="M35 36 L35 76" stroke="#fbf3c8" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="43" cy="52" r="10" fill="#f2c230" stroke={INK} strokeWidth={S3} />
      <path d="M43 45 L43 59 M37 48.5 L49 55.5 M49 48.5 L37 55.5" stroke="#f8e58a" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx="57" cy="69" r="9" fill="#e8b52a" stroke={INK} strokeWidth={S3} />
    </>
  ),

  // ---- wine & filo -----------------------------------------------------------
  wine_white: () => (
    <>
      <rect x="44.5" y="4" width="11" height="8" rx="2" fill="#c9b13c" stroke={INK} strokeWidth={3.5} />
      <path d="M45 12 L45 34 Q45 42 40 48 Q35 54 35 62 L35 85 Q35 91 41 91 L59 91 Q65 91 65 85 L65 62 Q65 54 60 48 Q55 42 55 34 L55 12 Z" fill="#dfe3c0" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M38 61 Q43 55 50 55 Q57 55 62 61 L62 84 Q62 88 58 88 L42 88 Q38 88 38 84 Z" fill="#e8cd6a" />
      <path d="M42 63 L42 84" stroke="#f4e29a" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  wine_red: () => (
    <>
      <rect x="44.5" y="4" width="11" height="8" rx="2" fill="#5a1424" stroke={INK} strokeWidth={3.5} />
      <path d="M45 12 L45 36 Q45 40 42 43 L38 47 Q36 49 36 53 L36 85 Q36 91 42 91 L58 91 Q64 91 64 85 L64 53 Q64 49 62 47 L58 43 Q55 40 55 36 L55 12 Z" fill="#4a2030" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M39 52 L39 84 Q39 88 43 88 L57 88 Q61 88 61 84 L61 52 Z" fill="#6e1f2e" />
      <path d="M43 56 L43 84" stroke="#9a4054" strokeWidth={3.5} strokeLinecap="round" />
      <g fill="#b06478">
        <circle cx="48" cy="66" r="3.2" />
        <circle cx="54.5" cy="66" r="3.2" />
        <circle cx="51.2" cy="72" r="3.2" />
      </g>
    </>
  ),
  pastry_filo: () => (
    <>
      <path d="M12 62 L68 56 L84 66 L28 74 Z" fill="#f9eed6" stroke={INK} strokeWidth={S2} strokeLinejoin="round" />
      <path d="M16 74 L72 68 L88 78 L32 86 Z" fill="#f4e4c0" stroke={INK} strokeWidth={S2} strokeLinejoin="round" />
      <rect x="16" y="22" width="56" height="27" rx="13.5" fill="#ecd6a4" stroke={INK} strokeWidth={SW} />
      <path d="M24 27 Q54 24 62 27" fill="none" stroke="#f9eed6" strokeWidth={3.5} strokeLinecap="round" />
      <ellipse cx="68" cy="35.5" rx="9.5" ry="13.5" fill="#f9eed6" stroke={INK} strokeWidth={S2} />
      <path d="M68 28 Q62 30 62 35.5 Q62 41 68 41 Q72 41 72 37" fill="none" stroke="#c9a86a" strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
};
