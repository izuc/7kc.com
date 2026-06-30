<?php
declare(strict_types=1);

namespace SevenKC\Support;

/**
 * Reads photos via a vision LLM on any OpenAI-compatible endpoint (local LM Studio
 * / Ollama, or OpenAI). Configured by the site operator via .env (endpoint / model
 * / optional key / tiles) — never per user. Images are sent inline as base64 data
 * URLs in the standard `image_url` content part.
 *
 *  - scan()            → transcribe a handwritten/printed shopping list.
 *  - scanPantryTiles() → detect grocery items in fridge/pantry photo tiles and merge.
 */
final class AiScanner
{
    private const LIST_PROMPT =
        'You are reading a photo of a shopping or grocery list (handwritten or printed). ' .
        'Transcribe every list item exactly as written, one item per line. Keep any quantities ' .
        'or units that appear (e.g. "2x milk", "500g mince", "a dozen eggs"). Output ONLY the item ' .
        'lines — no title, numbering, bullets, commentary, or markdown fences. If there is no list, output nothing.';

    private const PANTRY_PROMPT =
        'You are looking at a photo (or a cropped section) of the inside of a fridge, freezer, or ' .
        'pantry shelf. List every distinct food or grocery item you can identify, one per line, using ' .
        'short generic names (e.g. "milk", "carrots", "tomato ketchup", "cheddar cheese"). Merge obvious ' .
        'duplicates. Ignore non-food objects, packaging logos, and background. Output ONLY the item ' .
        'names — no quantities, numbering, bullets, commentary, or markdown. If you see no food, output nothing.';

    /** @param array{endpoint:string,model:string,api_key:string,tiles?:int} $config */
    public function __construct(private readonly array $config) {}

    public function isConfigured(): bool
    {
        return $this->config['endpoint'] !== '' && $this->config['model'] !== ''
            && \function_exists('curl_init');
    }

    /** Grid size per axis for pantry tiling (1 = whole image, 2 = 2×2, …). */
    public function tiles(): int
    {
        return max(1, min(4, (int)($this->config['tiles'] ?? 1)));
    }

    /** Resolve the chat-completions URL from the configured base. */
    public static function completionsUrl(string $endpoint): string
    {
        $base = rtrim(trim($endpoint), '/');
        if (preg_match('#/chat/completions$#', $base)) return $base;
        return $base . '/chat/completions';
    }

    /** Strip a wrapping markdown code fence the model might add. */
    public static function stripFences(string $text): string
    {
        $t = trim($text);
        $t = preg_replace('/^```[a-z]*\s*\n?/i', '', $t) ?? $t;
        $t = preg_replace('/\n?```$/', '', $t) ?? $t;
        return trim($t);
    }

    /** @return array<string,mixed> the JSON request payload (pure; unit-testable) */
    public function buildPayload(string $dataUrl, ?string $prompt = null): array
    {
        return [
            'model' => $this->config['model'],
            'temperature' => 0,
            'max_tokens' => 1024,
            'messages' => [[
                'role' => 'user',
                'content' => [
                    ['type' => 'text', 'text' => $prompt ?? self::LIST_PROMPT],
                    ['type' => 'image_url', 'image_url' => ['url' => $dataUrl]],
                ],
            ]],
        ];
    }

    /** Transcribe a shopping-list photo. */
    public function scan(string $dataUrl): string
    {
        return $this->request($this->buildPayload($dataUrl, self::LIST_PROMPT));
    }

    /**
     * Run each pantry/fridge tile through the model and merge into a deduped,
     * order-preserving list of item names.
     * @param string[] $dataUrls
     * @return string[]
     */
    public function scanPantryTiles(array $dataUrls): array
    {
        $texts = [];
        foreach ($dataUrls as $url) {
            $texts[] = $this->request($this->buildPayload($url, self::PANTRY_PROMPT));
        }
        return self::mergeItems($texts);
    }

    /**
     * Merge the per-tile transcriptions into a deduped, order-preserving item list.
     * @param string[] $tileTexts
     * @return string[]
     */
    public static function mergeItems(array $tileTexts): array
    {
        $seen = [];
        $items = [];
        foreach ($tileTexts as $text) {
            foreach (preg_split('/\r?\n/', $text) ?: [] as $line) {
                $name = self::cleanItem($line);
                if ($name === '') continue;
                $key = mb_strtolower($name);
                if (isset($seen[$key])) continue;
                $seen[$key] = true;
                $items[] = $name;
            }
        }
        return $items;
    }

    /** Strip leading bullets / numbering and trim a single detected item line. */
    public static function cleanItem(string $line): string
    {
        $s = trim($line);
        // strip a leading bullet (-, *, •) or numbering (1. / 2)) plus surrounding space
        $s = preg_replace('/^[\-\*\x{2022}\d\.\)\s]+/u', '', $s) ?? $s;
        return trim($s);
    }

    /**
     * POST a payload to the endpoint and return the cleaned message content.
     * @param array<string,mixed> $payload
     * @throws \RuntimeException on transport / non-2xx / malformed response.
     */
    private function request(array $payload): string
    {
        $headers = ['Content-Type: application/json'];
        if ($this->config['api_key'] !== '') {
            $headers[] = 'Authorization: Bearer ' . $this->config['api_key'];
        }
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => self::completionsUrl($this->config['endpoint']),
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 90,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        $raw = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $errno = curl_errno($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($errno !== 0 || $raw === false) {
            throw new \RuntimeException('Could not reach the AI endpoint: ' . $err);
        }
        if ($status < 200 || $status >= 300) {
            $detail = '';
            $j = json_decode((string)$raw, true);
            if (is_array($j)) $detail = (string)($j['error']['message'] ?? $j['message'] ?? '');
            throw new \RuntimeException("AI endpoint returned $status" . ($detail !== '' ? ": $detail" : ''));
        }
        $j = json_decode((string)$raw, true);
        $text = $j['choices'][0]['message']['content'] ?? null;
        if (!is_string($text)) {
            throw new \RuntimeException('The endpoint responded, but not in an OpenAI-compatible shape.');
        }
        return self::stripFences($text);
    }
}
