// Parser: freeform text → ingredient matches.
// Splits on newlines/commas/bullets, strips quantities, fuzzy-matches to dictionary.
window.Parser = (function () {
  const QTY_RE = /^\s*(\d+(\.\d+)?\s*(x|kg|g|ml|l|cups?|tbsp|tsp|cloves?|bunch|bunches|pkt|pack|tin|tins|can|cans|punnet|head)?)\s*(of\s+)?/i;
  const NOISE = ['fresh', 'organic', 'free range', 'free-range', 'the', 'some', 'good', 'nice'];
  const BULLETS = /^[\s\-\*\•\–]+/;

  function normalize(s) {
    return s.toLowerCase().trim().replace(/[^a-z\s\-']/g, '').replace(/\s+/g, ' ');
  }

  // Simple fuzzy: exact alias → exact display → substring → token overlap
  function match(token) {
    const { aliases, ingredients, byId } = window.SEED;
    const n = normalize(token);
    if (!n) return null;
    if (aliases[n]) return byId[aliases[n]];
    // singular/plural
    if (n.endsWith('s') && aliases[n.slice(0, -1)]) return byId[aliases[n.slice(0, -1)]];
    if (aliases[n + 's']) return byId[aliases[n + 's']];
    // exact display
    const exact = ingredients.find((i) => normalize(i.display) === n);
    if (exact) return exact;
    // substring
    const sub = ingredients.find((i) => normalize(i.display).includes(n) || n.includes(normalize(i.display)));
    if (sub) return sub;
    // token overlap
    const tokens = n.split(' ');
    let best = null, bestScore = 0;
    for (const i of ingredients) {
      const iTokens = normalize(i.display).split(' ');
      const overlap = tokens.filter((t) => iTokens.includes(t)).length;
      if (overlap > bestScore) {
        best = i;
        bestScore = overlap;
      }
    }
    if (best && bestScore > 0) return best;
    // alias token overlap
    for (const [a, id] of Object.entries(aliases)) {
      const aTokens = a.split(' ');
      const overlap = tokens.filter((t) => aTokens.includes(t)).length;
      if (overlap > bestScore) {
        best = byId[id];
        bestScore = overlap;
      }
    }
    return best;
  }

  function parse(text) {
    if (!text || !text.trim()) return [];
    // split on newlines and commas (but not commas inside parens)
    const lines = text
      .replace(/\([^)]*\)/g, '') // strip parenthetical notes for matching
      .split(/[\n,]/)
      .map((l) => l.replace(BULLETS, '').trim())
      .filter(Boolean);

    return lines.map((raw) => {
      let t = raw;
      // strip leading quantity
      t = t.replace(QTY_RE, '');
      // strip noise words
      for (const n of NOISE) t = t.replace(new RegExp(`\\b${n}\\b`, 'gi'), '');
      t = t.trim();
      const m = match(t);
      return {
        raw,
        clean: t,
        match: m,
      };
    });
  }

  return { parse, match };
})();
