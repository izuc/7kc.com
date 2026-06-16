import type { ParsedItem, Section } from '../types/models';

/**
 * Client-side paste-to-parse: a faithful port of backend Support/Parser.php (same
 * confidence-scored matcher), so the preview is instant and works offline. The server
 * endpoint stays authoritative when items are actually saved.
 */

export interface Dictionary {
  ingredients: { id: string; display: string; section: string }[];
  aliases: Record<string, string>;
}

const QTY_RE =
  /^\s*(\d+(?:\.\d+)?\s*(?:x|kg|g|ml|l|cups?|tbsp|tsp|cloves?|bunch|bunches|pkt|pack|tin|tins|can|cans|punnet|head)?)\s*(?:of\s+)?/i;
const NOISE = ['fresh', 'organic', 'free range', 'free-range', 'the', 'some', 'good', 'nice'];
const BULLETS = /^[\s\-*•–]+/u;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ratio 0..1 equivalent to PHP similar_text percentage / 100. */
function similar(a: string, b: string): number {
  const lcs = (s1: string, s2: string): number => {
    if (!s1.length || !s2.length) return 0;
    let max = 0;
    let p1 = 0;
    let p2 = 0;
    for (let i = 0; i < s1.length; i++) {
      for (let j = 0; j < s2.length; j++) {
        let k = 0;
        while (i + k < s1.length && j + k < s2.length && s1[i + k] === s2[j + k]) k++;
        if (k > max) {
          max = k;
          p1 = i;
          p2 = j;
        }
      }
    }
    if (max === 0) return 0;
    return max + lcs(s1.slice(0, p1), s2.slice(0, p2)) + lcs(s1.slice(p1 + max), s2.slice(p2 + max));
  };
  const len = a.length + b.length;
  return len === 0 ? 0 : (2 * lcs(a, b)) / len;
}

export function createParser(dict: Dictionary) {
  const byId = new Map(dict.ingredients.map((i) => [i.id, i]));
  const ingredients = dict.ingredients.map((i) => ({ ...i, displayLower: i.display.toLowerCase() }));
  const aliases = dict.aliases;

  const hit = (id: string) => {
    const i = byId.get(id);
    return i ? { id: i.id, display: i.display, section: i.section as Section } : null;
  };

  function exactMatch(n: string) {
    if (aliases[n]) return hit(aliases[n]);
    const stripped = n.replace(/s$/, '');
    if (stripped !== n && aliases[stripped]) return hit(aliases[stripped]);
    if (aliases[n + 's']) return hit(aliases[n + 's']);
    for (const i of ingredients) {
      if (i.displayLower === n) return { id: i.id, display: i.display, section: i.section as Section };
      if (stripped !== '' && i.displayLower.replace(/s$/, '') === stripped) {
        return { id: i.id, display: i.display, section: i.section as Section };
      }
    }
    return null;
  }

  function score(n: string, inputTokens: string[], displayLower: string): number {
    const dTokens = displayLower.split(' ');
    if ((' ' + n + ' ').includes(' ' + displayLower + ' ')) return 0.95;

    const inSet = new Set(inputTokens);
    if (dTokens.every((t) => inSet.has(t))) {
      if (dTokens.length >= 2) return 0.9;
      return inputTokens[inputTokens.length - 1] === dTokens[0] ? 0.8 : 0.45;
    }

    if (inputTokens.length === 1 && dTokens.length === 1) {
      const pct = similar(n, displayLower);
      return pct >= 0.82 ? Math.min(0.95, pct) : 0;
    }

    const overlap = inputTokens.filter((t) => dTokens.includes(t)).length;
    if (overlap === 0) return 0;
    const ratio = overlap / Math.max(inputTokens.length, dTokens.length);
    return ratio >= 0.66 ? 0.6 : ratio * 0.5;
  }

  function match(token: string): ParsedItem['match'] {
    const n = normalize(token);
    if (n === '') return null;
    const exact = exactMatch(n);
    if (exact) return { ...exact, confidence: 'confident' };

    const inputTokens = n.split(' ');
    let best: (typeof ingredients)[number] | null = null;
    let bestScore = 0;
    for (const i of ingredients) {
      const s = score(n, inputTokens, i.displayLower);
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    }
    if (!best || bestScore < 0.55) return null;
    return {
      id: best.id,
      display: best.display,
      section: best.section as Section,
      confidence: bestScore >= 0.9 ? 'confident' : 'maybe',
    };
  }

  function parse(text: string): ParsedItem[] {
    if (!text.trim()) return [];
    const cleaned = text.replace(/\([^)]*\)/g, '');
    const out: ParsedItem[] = [];
    for (let raw of cleaned.split(/[\n,]/)) {
      raw = raw.replace(BULLETS, '').trim();
      if (raw === '') continue;
      let t = raw.replace(QTY_RE, '');
      for (const nz of NOISE) {
        t = t.replace(new RegExp('\\b' + nz.replace(/[-]/g, '\\-') + '\\b', 'ig'), '');
      }
      t = t.replace(/\s+/g, ' ').trim();
      out.push({ raw, clean: t, match: match(t) });
    }
    return out;
  }

  return { parse, match };
}
