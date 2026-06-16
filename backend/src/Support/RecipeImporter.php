<?php
declare(strict_types=1);

namespace SevenKC\Support;

/**
 * Fetches a public recipe page and extracts a draft from its schema.org/Recipe
 * JSON-LD. The result is a *draft* only — never persisted directly; the user
 * confirms it client-side before POST /recipes.
 *
 * SSRF-guarded: http(s) only, no userinfo, every hop's resolved IP must be
 * public (rejects loopback/private/link-local/reserved, IPv4 + IPv6), the
 * validated IP is pinned for the request (defeats DNS-rebinding), redirects are
 * followed manually and re-validated, and the response is size- and time-bounded.
 */
final class RecipeImporter
{
    private const MAX_BYTES = 2_000_000;
    private const MAX_REDIRECTS = 4;
    private const UA = 'Mozilla/5.0 (compatible; 7KCBot/1.0; +https://7kc.com)';

    public function __construct(private readonly Parser $parser) {}

    /**
     * @return array{title:string,description:string,prep_time:int,cook_time:int,servings:int,source:string,image_url:?string,ingredients:list<array>,steps:list<array{content:string}>}
     * @throws \RuntimeException on blocked/unreachable/unparseable input
     */
    public function import(string $url): array
    {
        return $this->parseHtml($this->fetch($url), $url);
    }

    /** Extract a draft from already-fetched HTML (no network — unit-testable). */
    public function parseHtml(string $html, string $sourceUrl): array
    {
        $node = $this->findRecipeNode($html);
        if ($node === null) {
            throw new \RuntimeException("That page doesn't expose a recipe we can read (no schema.org Recipe data).");
        }
        return $this->toDraft($node, $sourceUrl);
    }

    // ---- fetch + SSRF guard -------------------------------------------------

    private function fetch(string $url): string
    {
        if (!\function_exists('curl_init')) {
            throw new \RuntimeException('Import is unavailable on this server.');
        }
        $redirects = 0;
        while (true) {
            [$scheme, $host, $port, $ip] = $this->validate($url);
            [$status, $headers, $body] = $this->curlGet($url, $host, $port, $ip);

            if (\in_array($status, [301, 302, 303, 307, 308], true) && isset($headers['location'])) {
                if (++$redirects > self::MAX_REDIRECTS) {
                    throw new \RuntimeException('That page redirected too many times.');
                }
                $url = $this->resolveLocation($scheme, $host, $port, $headers['location']);
                continue;
            }
            if ($status === 0) {
                throw new \RuntimeException('Could not reach that page.');
            }
            if ($status >= 400) {
                throw new \RuntimeException("That page returned an error (HTTP $status).");
            }
            return $body;
        }
    }

    /** @return array{0:string,1:string,2:int,3:string} [scheme, host, port, validated public IP] */
    private function validate(string $url): array
    {
        $p = parse_url($url);
        if ($p === false || empty($p['scheme']) || empty($p['host'])) {
            throw new \RuntimeException('That URL is not valid.');
        }
        $scheme = strtolower($p['scheme']);
        if (!\in_array($scheme, ['http', 'https'], true)) {
            throw new \RuntimeException('Only http(s) links can be imported.');
        }
        if (isset($p['user']) || isset($p['pass'])) {
            throw new \RuntimeException('That URL is not allowed.');
        }
        $host = $p['host'];
        $port = (int)($p['port'] ?? ($scheme === 'https' ? 443 : 80));

        $ips = $this->resolve($host);
        if ($ips === []) {
            throw new \RuntimeException('That host could not be resolved.');
        }
        // Reject if ANY resolved address is non-public (defends against a
        // public+private split answer being used for rebinding).
        foreach ($ips as $ip) {
            if (!$this->isPublicIp($ip)) {
                throw new \RuntimeException('That URL points to a private or local address.');
            }
        }
        return [$scheme, $host, $port, $ips[0]];
    }

    /** @return list<string> */
    private function resolve(string $host): array
    {
        // Host may already be a literal IP.
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }
        $ips = [];
        $v4 = gethostbynamel($host);
        if (\is_array($v4)) {
            $ips = $v4;
        }
        $aaaa = @dns_get_record($host, DNS_AAAA);
        if (\is_array($aaaa)) {
            foreach ($aaaa as $rec) {
                if (!empty($rec['ipv6'])) $ips[] = $rec['ipv6'];
            }
        }
        return array_values(array_unique($ips));
    }

    private function isPublicIp(string $ip): bool
    {
        // NO_PRIV_RANGE + NO_RES_RANGE rejects 10/8, 172.16/12, 192.168/16,
        // 127/8, 169.254/16, 0/8, 240/4, ::1, fc00::/7, fe80::/10, etc.
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    private function resolveLocation(string $scheme, string $host, int $port, string $location): string
    {
        $location = trim($location);
        if (preg_match('#^https?://#i', $location)) {
            return $location;
        }
        $base = $scheme . '://' . $host . (($port === 80 || $port === 443) ? '' : ':' . $port);
        if ($location !== '' && $location[0] === '/') {
            return $base . $location;
        }
        return $base . '/' . ltrim($location, '/');
    }

    /** @return array{0:int,1:array<string,string>,2:string} [status, lower-cased headers, body] */
    private function curlGet(string $url, string $host, int $port, string $ip): array
    {
        $ch = curl_init();
        $headers = [];
        $body = '';
        $resolveIp = str_contains($ip, ':') ? "[$ip]" : $ip;

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_FOLLOWLOCATION => false,          // we re-validate every hop ourselves
            CURLOPT_RESOLVE => ["$host:$port:$resolveIp"], // pin to the validated IP (anti-rebind)
            CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => self::UA,
            CURLOPT_HTTPHEADER => ['Accept: text/html,application/xhtml+xml'],
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_HEADERFUNCTION => function ($_ch, string $line) use (&$headers) {
                $parts = explode(':', $line, 2);
                if (\count($parts) === 2) {
                    $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
                }
                return \strlen($line);
            },
            CURLOPT_WRITEFUNCTION => function ($_ch, string $chunk) use (&$body) {
                $body .= $chunk;
                if (\strlen($body) > self::MAX_BYTES) {
                    return -1; // abort: page too large
                }
                return \strlen($chunk);
            },
        ]);

        curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($ch);
        curl_close($ch);

        // -1 from the write callback surfaces as a write error once the cap is hit.
        if ($errno !== 0 && $errno !== CURLE_WRITE_ERROR && $status === 0) {
            throw new \RuntimeException('Could not fetch that page.');
        }
        return [$status, $headers, $body];
    }

    // ---- JSON-LD extraction -------------------------------------------------

    private function findRecipeNode(string $html): ?array
    {
        if (!preg_match_all(
            '#<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>#is',
            $html,
            $m
        )) {
            return null;
        }
        foreach ($m[1] as $json) {
            $data = json_decode(html_entity_decode(trim($json), ENT_QUOTES | ENT_HTML5), true);
            if (!\is_array($data)) {
                $data = json_decode(trim($json), true); // some sites pre-encode entities; try raw too
            }
            if (\is_array($data)) {
                $node = $this->searchRecipe($data);
                if ($node !== null) return $node;
            }
        }
        return null;
    }

    private function searchRecipe(array $data): ?array
    {
        if ($this->isRecipe($data)) return $data;
        if (isset($data['@graph']) && \is_array($data['@graph'])) {
            foreach ($data['@graph'] as $n) {
                if (\is_array($n) && $this->isRecipe($n)) return $n;
            }
        }
        if (array_is_list($data)) {
            foreach ($data as $n) {
                if (\is_array($n)) {
                    $found = $this->searchRecipe($n);
                    if ($found !== null) return $found;
                }
            }
        }
        return null;
    }

    private function isRecipe(array $n): bool
    {
        $t = $n['@type'] ?? null;
        if (\is_array($t)) return \in_array('Recipe', $t, true);
        return $t === 'Recipe';
    }

    // ---- draft mapping ------------------------------------------------------

    private function toDraft(array $n, string $sourceUrl): array
    {
        $prep = $this->isoMinutes($n['prepTime'] ?? null);
        $cook = $this->isoMinutes($n['cookTime'] ?? null);
        if ($prep === 0 && $cook === 0) {
            $cook = $this->isoMinutes($n['totalTime'] ?? null);
        }

        $ingredients = [];
        foreach ($this->stringList($n['recipeIngredient'] ?? $n['ingredients'] ?? []) as $line) {
            $line = $this->text($line);
            if ($line === '') continue;
            $parsed = $this->parser->parse($line);
            $first = $parsed[0] ?? null;
            $ingredients[] = [
                'raw' => $line,
                'clean' => $first['clean'] ?? $line,
                'match' => $first['match'] ?? null,
            ];
        }

        $steps = [];
        foreach ($this->instructions($n['recipeInstructions'] ?? []) as $s) {
            $s = $this->text($s);
            if ($s !== '') $steps[] = ['content' => $s];
        }

        return [
            'title' => $this->clip($this->text($n['name'] ?? ''), 120),
            'description' => $this->clip($this->text($n['description'] ?? ''), 300),
            'prep_time' => $prep,
            'cook_time' => $cook,
            'servings' => $this->parseYield($n['recipeYield'] ?? null) ?: 2,
            'source' => $sourceUrl,
            'image_url' => $this->firstImage($n['image'] ?? null),
            'ingredients' => $ingredients,
            'steps' => $steps,
        ];
    }

    /** schema.org instructions come in many shapes; flatten to an ordered list of strings. */
    private function instructions(mixed $v): array
    {
        if (\is_string($v)) {
            $v = strip_tags(str_replace(['</li>', '</p>', '<br>', '<br/>'], "\n", $v));
            return array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $v) ?: [])));
        }
        if (!\is_array($v)) return [];
        $out = [];
        foreach ($v as $item) {
            if (\is_string($item)) {
                $t = trim($item);
                if ($t !== '') $out[] = $t;
                continue;
            }
            if (!\is_array($item)) continue;
            $type = $item['@type'] ?? null;
            if ($type === 'HowToSection' && isset($item['itemListElement'])) {
                foreach ($this->instructions($item['itemListElement']) as $s) $out[] = $s;
            } elseif (isset($item['text'])) {
                $out[] = $this->text($item['text']);
            } elseif (isset($item['name'])) {
                $out[] = $this->text($item['name']);
            }
        }
        return $out;
    }

    private function isoMinutes(mixed $v): int
    {
        if (!\is_string($v) || $v === '') return 0;
        if (!preg_match('/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i', trim($v), $m)) {
            return 0;
        }
        $days = (int)($m[1] ?? 0);
        $hours = (int)($m[2] ?? 0);
        $mins = (int)($m[3] ?? 0);
        return $days * 1440 + $hours * 60 + $mins;
    }

    private function parseYield(mixed $v): int
    {
        if (\is_array($v)) $v = $v[0] ?? null;
        if (\is_int($v)) return max(0, $v);
        if (\is_string($v) && preg_match('/\d+/', $v, $m)) return (int)$m[0];
        return 0;
    }

    private function firstImage(mixed $v): ?string
    {
        if (\is_string($v)) return $v !== '' ? $v : null;
        if (\is_array($v)) {
            if (isset($v['url']) && \is_string($v['url'])) return $v['url'];
            foreach ($v as $item) {
                $r = $this->firstImage($item);
                if ($r !== null) return $r;
            }
        }
        return null;
    }

    private function stringList(mixed $v): array
    {
        if (\is_array($v)) return array_is_list($v) ? $v : [$v];
        return $v === null ? [] : [$v];
    }

    private function text(mixed $v): string
    {
        if (\is_array($v)) {
            $v = $v['@value'] ?? $v['text'] ?? $v['name'] ?? '';
        }
        if (!\is_string($v)) return '';
        $v = html_entity_decode(strip_tags($v), ENT_QUOTES | ENT_HTML5);
        return trim(preg_replace('/\s+/', ' ', $v) ?? $v);
    }

    private function clip(string $s, int $max): string
    {
        return mb_strlen($s) > $max ? rtrim(mb_substr($s, 0, $max - 1)) . '…' : $s;
    }
}
