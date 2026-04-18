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

    /** @return array{id:string,display:string,section:string}|null */
    public function match(string $token): ?array
    {
        $n = $this->normalize($token);
        if ($n === '') return null;
        if (isset($this->aliases[$n])) return $this->byId[$this->aliases[$n]] ?? null;
        $stripped = rtrim($n, 's');
        if ($stripped !== $n && isset($this->aliases[$stripped])) return $this->byId[$this->aliases[$stripped]] ?? null;
        if (isset($this->aliases[$n . 's'])) return $this->byId[$this->aliases[$n . 's']] ?? null;
        foreach ($this->ingredients as $i) {
            if ($i['displayLower'] === $n) return ['id' => $i['id'], 'display' => $i['display'], 'section' => $i['section']];
        }
        foreach ($this->ingredients as $i) {
            if (str_contains($i['displayLower'], $n) || str_contains($n, $i['displayLower'])) {
                return ['id' => $i['id'], 'display' => $i['display'], 'section' => $i['section']];
            }
        }
        $tokens = explode(' ', $n);
        $best = null;
        $bestScore = 0;
        foreach ($this->ingredients as $i) {
            $iTokens = explode(' ', $i['displayLower']);
            $overlap = count(array_intersect($tokens, $iTokens));
            if ($overlap > $bestScore) {
                $best = ['id' => $i['id'], 'display' => $i['display'], 'section' => $i['section']];
                $bestScore = $overlap;
            }
        }
        return $best;
    }

    private function normalize(string $s): string
    {
        $s = strtolower(trim($s));
        $s = preg_replace("/[^a-z\s\-']/", '', $s) ?? $s;
        return preg_replace('/\s+/', ' ', $s) ?? $s;
    }
}
