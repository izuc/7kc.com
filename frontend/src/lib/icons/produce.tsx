import { ReactNode } from 'react';
import { INK } from '../dishArt/tokens';

/**
 * Ingredient icon v2 — fresh produce ("Ink & Cream" dish-art language).
 *
 * Grammar: 100×100 box, one dominant silhouette (~65–80% of the box), ink
 * outline #3f2410 at stroke 4–4.5 (round joins/caps), exactly one lighter
 * highlight shape, at most two small accessory marks. Flat colour only.
 * Tomato + basil are ported from docs/art-exploration dirA references.
 */

const GREEN_STEM = '#4d7c0f';

/** Curly-herb cluster blob, drawn around (0,0) — placed via translate. */
const CURL =
  'M-17 5 C-24 -2 -18 -13 -8 -11 C-6 -19 7 -20 9 -12 C19 -14 24 -4 17 2 C15 10 3 12 -1 7 C-7 13 -15 12 -17 5 Z';

export const PRODUCE_ICONS: Record<string, () => ReactNode> = {
  // ---- dirA reference ports -------------------------------------------------
  tomato: () => (
    <>
      <circle cx="50" cy="56" r="33" fill="#dc2626" stroke={INK} strokeWidth={4.5} />
      <path d="M28 44 A28 28 0 0 1 46 28" fill="none" stroke="#f06a4a" strokeWidth={7} strokeLinecap="round" />
      <path
        d="M50 24 C44 16 36 16 32 20 C40 22 44 26 44 30 Z M50 24 C56 16 64 16 68 20 C60 22 56 26 56 30 Z M50 24 C46 28 46 32 50 36 C54 32 54 28 50 24 Z"
        fill={GREEN_STEM} stroke={INK} strokeWidth={3.5} strokeLinejoin="round"
      />
      <rect x="47" y="14" width="6" height="10" rx="3" fill={GREEN_STEM} stroke={INK} strokeWidth={3} />
    </>
  ),
  basil: () => (
    <>
      <path d="M50 88 C50 72 50 56 50 40" fill="none" stroke="#3f6212" strokeWidth={5} strokeLinecap="round" />
      <path d="M50 64 C34 66 20 58 18 42 C34 38 48 46 50 64 Z" fill={GREEN_STEM} stroke={INK} strokeWidth={4} />
      <path d="M45 59 L27 46" stroke="#a3c96a" strokeWidth={2.8} fill="none" strokeLinecap="round" />
      <path d="M50 64 C66 66 80 58 82 42 C66 38 52 46 50 64 Z" fill="#63960f" stroke={INK} strokeWidth={4} />
      <path d="M50 40 C39 33 37 18 48 10 C59 17 61 32 50 40 Z" fill={GREEN_STEM} stroke={INK} strokeWidth={4} />
      <path d="M50 35 L49 17" stroke="#a3c96a" strokeWidth={2.8} fill="none" strokeLinecap="round" />
    </>
  ),

  // ---- fruiting vegetables --------------------------------------------------
  capsicum_red: () => (
    <>
      <path
        d="M44 26 C32 22 22 32 20 44 C18 58 22 72 30 80 C36 86 44 86 47 80 C49 84 51 84 53 80 C56 86 64 86 70 80 C78 72 82 58 80 44 C78 32 68 22 56 26 C54 28 46 28 44 26 Z"
        fill="#dc2626" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M27 46 C27 38 32 31 38 29" fill="none" stroke="#f06a4a" strokeWidth={6} strokeLinecap="round" />
      <path d="M38 30 C36 46 36 66 40 79 M62 30 C64 46 64 66 60 79" fill="none" stroke="#a81c14" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M45 26 C45 16 47 11 50 9 C53 11 55 16 55 26 Z" fill={GREEN_STEM} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    </>
  ),
  chilli: () => (
    <>
      <path
        d="M70 24 C82 40 78 66 58 80 C44 90 26 88 18 78 C34 82 50 74 60 60 C68 48 68 34 64 26 Z"
        fill="#d23c30" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M66 36 C70 46 68 56 62 64" fill="none" stroke="#f06a4a" strokeWidth={5} strokeLinecap="round" />
      <path d="M66 24 C64 15 71 9 79 12 C74 15 74 20 72 26 Z" fill={GREEN_STEM} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    </>
  ),
  cucumber: () => (
    <g transform="rotate(-42 50 50)">
      <rect x="12" y="38" width="76" height="25" rx="12.5" fill="#4c7d24" stroke={INK} strokeWidth={4.5} />
      <path d="M24 46 L72 46" stroke="#7ab653" strokeWidth={5} strokeLinecap="round" />
      <circle cx="83" cy="50.5" r="4" fill="#3a6118" />
    </g>
  ),

  // ---- roots & bulbs ---------------------------------------------------------
  carrot: () => (
    <>
      <path d="M50 8 L47 25 M34 12 L44 26 M66 12 L56 26" fill="none" stroke={GREEN_STEM} strokeWidth={5} strokeLinecap="round" />
      <path d="M39 26 C34 44 40 70 50 92 C60 70 66 44 61 26 C54 21 46 21 39 26 Z" fill="#e2711d" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M43 32 C41 46 44 62 48 74" fill="none" stroke="#f0964a" strokeWidth={5} strokeLinecap="round" />
      <path d="M45 44 L57 42 M47 60 L56 58" stroke="#b4530e" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  potato: () => (
    <>
      <path
        d="M14 54 C12 38 28 27 50 26 C72 25 88 36 86 52 C84 68 70 79 48 79 C28 79 16 70 14 54 Z"
        fill="#d2a86a" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M26 44 C32 36 42 32 52 32" fill="none" stroke="#ecc998" strokeWidth={6} strokeLinecap="round" />
      <path d="M36 60 L40 64 M64 46 L68 50" stroke="#8a5a28" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  ginger: () => (
    <>
      <path
        d="M18 54 C10 46 16 34 28 36 C28 24 42 18 50 28 C56 18 72 22 72 34 C84 34 90 48 80 56 C86 66 78 76 66 72 C64 84 48 86 44 76 C32 82 22 76 24 64 C18 62 16 58 18 54 Z"
        fill="#d9a05b" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M30 46 C36 38 46 36 54 40" fill="none" stroke="#ecc389" strokeWidth={6} strokeLinecap="round" />
      <path d="M58 44 C62 52 62 62 58 68 M34 60 C38 65 44 66 48 64" fill="none" stroke="#b07a3c" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  garlic: () => (
    <>
      <path
        d="M44 30 C40 34 32 40 27 48 C20 60 22 76 34 83 C44 88 56 88 66 83 C78 76 80 60 73 48 C68 40 60 34 56 30 Z"
        fill="#f6efdb" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M44 30 C43 20 46 13 50 10 C54 13 57 20 56 30 Z" fill="#e8dcc0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M41 36 C36 50 36 68 41 80 M59 36 C64 50 64 68 59 80" fill="none" stroke="#cbb790" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M31 54 C29 62 30 70 34 76" fill="none" stroke="#fffdf6" strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  onion_brown: () => (
    <>
      <path
        d="M50 10 C46 18 42 26 34 34 C24 44 22 62 32 74 C42 84 58 84 68 74 C78 62 76 44 66 34 C58 26 54 18 50 10 Z"
        fill="#d98e3a" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M42 30 C36 48 36 64 42 78 M58 30 C64 48 64 64 58 78" fill="none" stroke="#a86520" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M32 46 C29 54 29 62 32 68" fill="none" stroke="#eeb46a" strokeWidth={5} strokeLinecap="round" />
      <path d="M42 82 L38 91 M50 83 L50 93 M58 82 L62 91" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  onion_red: () => (
    <>
      <path
        d="M50 12 C47 20 43 27 35 35 C25 45 23 62 33 73 C43 83 57 83 67 73 C77 62 75 45 65 35 C57 27 53 20 50 12 Z"
        fill="#8d4a8a" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M42 31 C36 48 36 63 42 77 M58 31 C64 48 64 63 58 77" fill="none" stroke="#6b2a68" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M33 46 C30 54 30 61 33 67" fill="none" stroke="#b57ab2" strokeWidth={5} strokeLinecap="round" />
      <path d="M42 81 L38 90 M50 82 L50 92 M58 81 L62 90" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  spring_onion: () => (
    <>
      <path d="M32 64 C46 48 60 30 72 10 L82 16 C68 36 54 52 44 70 Z" fill="#4d7a1f" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M28 62 C30 44 34 26 40 10 L50 14 C44 30 40 46 40 64 Z" fill="#5d9a3a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M22 86 C16 76 18 64 28 58 L42 66 C46 76 44 86 36 92 C30 96 26 92 22 86 Z" fill="#f0f6da" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M28 82 C26 76 28 70 32 66" fill="none" stroke="#ffffff" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M26 92 L22 98 M34 94 L34 99" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </>
  ),

  // ---- leaves & herbs ---------------------------------------------------------
  lettuce: () => (
    <>
      <path
        d="M18 74 C10 66 12 54 20 50 C14 40 22 30 32 31 C34 20 46 15 54 21 C64 13 78 20 78 30 C88 34 90 48 82 54 C88 62 84 72 76 75 C68 80 30 80 18 74 Z"
        fill="#7ab653" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M34 72 C32 56 36 42 44 32" fill="none" stroke="#cfe2a8" strokeWidth={5} strokeLinecap="round" />
      <path d="M62 72 C64 58 62 46 56 36" fill="none" stroke="#4c7d24" strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  mint: () => (
    <>
      <path d="M50 90 C50 70 50 48 50 26" fill="none" stroke="#3f6c1d" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M50 74 C36 76 24 68 24 56 C36 52 48 60 50 74 Z" fill="#5d9a3a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M50 74 C64 76 76 68 76 56 C64 52 52 60 50 74 Z" fill="#5d9a3a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M50 48 C36 50 26 42 26 30 C38 26 48 34 50 48 Z" fill="#6fae4a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M50 48 C64 50 74 42 74 30 C62 26 52 34 50 48 Z" fill="#6fae4a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M50 26 C42 20 44 10 52 8 C58 12 58 22 50 26 Z" fill="#5d9a3a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M46 68 L32 60" fill="none" stroke="#c2dc8e" strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),
  coriander: () => (
    <>
      <path d="M50 92 C50 80 50 72 50 64 M50 74 C42 70 36 66 30 58 M50 74 C58 70 64 66 70 58" fill="none" stroke="#3f6c1d" strokeWidth={4} strokeLinecap="round" />
      <path
        d="M50 64 C40 62 34 54 36 44 C32 40 36 30 44 32 C44 24 56 24 56 32 C64 30 68 40 64 44 C66 54 60 62 50 64 Z"
        fill="#4c8027" stroke={INK} strokeWidth={4} strokeLinejoin="round"
      />
      <path d="M30 58 C22 56 18 48 22 42 C18 36 26 30 32 34 C36 28 44 32 42 40 C44 48 38 56 30 58 Z" fill="#5d9a3a" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M70 58 C78 56 82 48 78 42 C82 36 74 30 68 34 C64 28 56 32 58 40 C56 48 62 56 70 58 Z" fill="#5d9a3a" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M50 58 L50 38" fill="none" stroke="#a3c96a" strokeWidth={2.8} strokeLinecap="round" />
    </>
  ),
  parsley: () => (
    <>
      <path d="M50 92 C50 80 50 72 50 62 M50 72 L34 54 M50 72 L66 54" fill="none" stroke="#3f6c1d" strokeWidth={4} strokeLinecap="round" />
      <g transform="translate(31 44)">
        <path d={CURL} fill="#557c1e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      <g transform="translate(69 44)">
        <path d={CURL} fill="#557c1e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      <g transform="translate(50 26)">
        <path d={CURL} fill="#7ab653" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
    </>
  ),

  // ---- citrus & fruit ---------------------------------------------------------
  lemon: () => (
    <g transform="rotate(-16 50 50)">
      <path
        d="M8 50 C8 46 12 44 16 44 C22 34 34 28 50 28 C66 28 78 34 84 44 C88 44 92 46 92 50 C92 54 88 56 84 56 C78 66 66 72 50 72 C34 72 22 66 16 56 C12 56 8 54 8 50 Z"
        fill="#f2c230" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M24 44 C30 36 40 33 48 33" fill="none" stroke="#fbe98c" strokeWidth={6} strokeLinecap="round" />
    </g>
  ),
  lime: () => (
    <>
      <g transform="rotate(-12 50 54)">
        <ellipse cx="50" cy="54" rx="32" ry="26" fill="#6b9a2a" stroke={INK} strokeWidth={4.5} />
        <path d="M28 45 C32 37 40 32 48 31" fill="none" stroke="#a8c86a" strokeWidth={6} strokeLinecap="round" />
        <circle cx="81" cy="54" r="3.5" fill="#3f6016" />
      </g>
      <path d="M58 24 C60 14 70 10 78 14 C76 24 68 28 60 26 Z" fill="#4c7d24" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    </>
  ),
  avocado: () => (
    <>
      <path
        d="M50 10 C40 10 36 22 33 34 C28 50 26 84 50 90 C74 84 72 50 67 34 C64 22 60 10 50 10 Z"
        fill="#3f6016" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M50 18 C43 18 40 27 37 38 C33 52 32 78 50 82 C68 78 67 52 63 38 C60 27 57 18 50 18 Z" fill="#c6dc7e" />
      <circle cx="50" cy="62" r="14" fill="#8a5a28" stroke={INK} strokeWidth={3.5} />
      <circle cx="45" cy="57" r="4" fill="#b07a3c" />
    </>
  ),

  // ---- fungi ------------------------------------------------------------------
  mushroom: () => (
    <>
      <path d="M40 58 L38 74 C38 84 44 88 50 88 C56 88 62 84 62 74 L60 58 Z" fill="#f3ddb5" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path
        d="M14 56 C14 32 30 16 50 16 C70 16 86 32 86 56 C86 60 82 62 78 62 L22 62 C18 62 14 60 14 56 Z"
        fill="#c9a06a" stroke={INK} strokeWidth={4.5} strokeLinejoin="round"
      />
      <path d="M24 48 C26 34 36 25 48 23" fill="none" stroke="#e8cba0" strokeWidth={6} strokeLinecap="round" />
    </>
  ),
};
