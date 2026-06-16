<?php
declare(strict_types=1);

namespace SevenKC\Support;

use Doctrine\DBAL\Connection;

final class Parser
{
    private const QTY_RE = '/^\s*(\d+(?:\.\d+)?\s*(?:x|kg|g|ml|l|cups?|tbsp|tsp|cloves?|bunch|bunches|pkt|pack|tin|tins|can|cans|punnet|head)?)\s*(?:of\s+)?/i';
    private const NOISE = ['fresh', 'organic', 'free range', 'free-range', 'the', 'some', 'good', 'nice'];
    private const BULLETS = '/^[\s\-\*\•\–]+/u';

    /** @var array<string, array{id:string, display:string, section:string}> */
    private array $byId = [];
    /** @var array<string, string> alias => ingredient id */
    private array $aliases = [];
    /** @var array<int, array{id:string, display:string, section:string, displayLower:string}> */
    private array $ingredients = [];

    public function __construct(Connection $db)
    {
        $rows = $db->fetchAllAssociative('SELECT id, display, section, aliases_json FROM ingredients');
        foreach ($rows as $r) {
            $this->byId[$r['id']] = ['id' => $r['id'], 'display' => $r['display'], 'section' => $r['section']];
            $this->ingredients[] = [
                'id' => $r['id'],
                'display' => $r['display'],
                'section' => $r['section'],
                'displayLower' => strtolower($r['display']),
            ];
            $aliasList = $r['aliases_json'] ? (array)json_decode((string)$r['aliases_json'], true) : [];
            foreach ($aliasList as $a) {
                $this->aliases[strtolower($a)] = $r['id'];
            }
        }
    }

    /**
     * @return list<array{raw:string, clean:string, match: array{id:string,display:string,section:string}|null}>
     */
    public function parse(string $text): array
    {
        if (trim($text) === '') return [];
        $text = preg_replace('/\([^)]*\)/', '', $text) ?? $text;
        $lines = preg_split('/[\n,]/', $text) ?: [];
        $out = [];
        foreach ($lines as $raw) {
            $raw = trim(preg_replace(self::BULLETS, '', $raw) ?? $raw);
            if ($raw === '') continue;
            $t = preg_replace(self::QTY_RE, '', $raw) ?? $raw;
            foreach (self::NOISE as $n) {
                $t = preg_replace('/\b' . preg_quote($n, '/') . '\b/i', '', $t) ?? $t;
            }
            $t = trim(preg_replace('/\s+/', ' ', $t) ?? $t);
            $match = $this->match($t);
            $out[] = ['raw' => $raw, 'clean' => $t, 'match' => $match];
        }
        return $out;
    }

    /**
     * Confidence-scored match. Returns 'confident' for exact/strong matches, 'maybe'
     * for plausible-but-uncertain ones (the UI asks "is this X?"), and null when no
     * candidate is strong enough — so a coincidental shared word ("tomato sauce" vs
     * "soy sauce") no longer produces a confident wrong match.
     *
     * @return array{id:string,display:string,section:string,confidence:string}|null
     */
    public function match(string $token): ?array
    {
        $n = $this->normalize($token);
        if ($n === '') return null;

        $exact = $this->exactMatch($n);
        if ($exact) return $exact + ['confidence' => 'confident'];

        $inputTokens = explode(' ', $n);
        $best = null;
        $bestScore = 0.0;
        foreach ($this->ingredients as $i) {
            $score = $this->scoreCandidate($n, $inputTokens, $i);
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $i;
            }
        }
        if (!$best || $bestScore < 0.55) return null;

        return [
            'id' => $best['id'],
            'display' => $best['display'],
            'section' => $best['section'],
            'confidence' => $bestScore >= 0.9 ? 'confident' : 'maybe',
        ];
    }

    /** @return array{id:string,display:string,section:string}|null */
    private function exactMatch(string $n): ?array
    {
        if (isset($this->aliases[$n])) return $this->byId[$this->aliases[$n]] ?? null;
        $stripped = rtrim($n, 's');
        if ($stripped !== $n && isset($this->aliases[$stripped])) return $this->byId[$this->aliases[$stripped]] ?? null;
        if (isset($this->aliases[$n . 's'])) return $this->byId[$this->aliases[$n . 's']] ?? null;
        foreach ($this->ingredients as $i) {
            if ($i['displayLower'] === $n) {
                return ['id' => $i['id'], 'display' => $i['display'], 'section' => $i['section']];
            }
            if ($stripped !== '' && rtrim($i['displayLower'], 's') === $stripped) {
                return ['id' => $i['id'], 'display' => $i['display'], 'section' => $i['section']];
            }
        }
        return null;
    }

    /** @param list<string> $inputTokens @param array{id:string,display:string,section:string,displayLower:string} $i */
    private function scoreCandidate(string $n, array $inputTokens, array $i): float
    {
        $d = $i['displayLower'];
        $dTokens = explode(' ', $d);

        // Whole ingredient name appears as a phrase in the input ("2 chicken breast fillets" ⊇ "chicken breast").
        if (str_contains(' ' . $n . ' ', ' ' . $d . ' ')) return 0.95;

        // Every ingredient word is present in the input.
        $inSet = array_flip($inputTokens);
        $allCandPresent = true;
        foreach ($dTokens as $t) {
            if (!isset($inSet[$t])) {
                $allCandPresent = false;
                break;
            }
        }
        if ($allCandPresent) {
            if (count($dTokens) >= 2) return 0.9;
            // single-word ingredient inside a longer input → only "maybe", and only as the head noun
            return end($inputTokens) === $dTokens[0] ? 0.8 : 0.45;
        }

        // single-word typo tolerance
        if (count($inputTokens) === 1 && count($dTokens) === 1) {
            $pct = 0.0;
            similar_text($n, $d, $pct);
            return $pct >= 82.0 ? min(0.95, $pct / 100) : 0.0;
        }

        // token overlap — a single shared common word out of multi-word names is coincidental, not a match
        $overlap = count(array_intersect($inputTokens, $dTokens));
        if ($overlap === 0) return 0.0;
        $ratio = $overlap / max(count($inputTokens), count($dTokens));
        return $ratio >= 0.66 ? 0.6 : $ratio * 0.5;
    }

    private function normalize(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace("/[^a-z\s\-']/", '', $s) ?? $s;
        return preg_replace('/\s+/', ' ', $s) ?? $s;
    }
}
