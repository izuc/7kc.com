<?php
declare(strict_types=1);

namespace SevenKC\Support;

/**
 * Reads a photo of a shopping list via a vision LLM on any OpenAI-compatible
 * endpoint (local LM Studio / Ollama, or OpenAI). Configured by the site operator
 * via .env (endpoint / model / optional key) — never per user. The image is sent
 * inline as a base64 data URL in the standard `image_url` content part.
 */
final class AiScanner
{
    private const PROMPT =
        'You are reading a photo of a shopping or grocery list (handwritten or printed). ' .
        'Transcribe every list item exactly as written, one item per line. Keep any quantities ' .
        'or units that appear (e.g. "2x milk", "500g mince", "a dozen eggs"). Output ONLY the item ' .
        'lines — no title, numbering, bullets, commentary, or markdown fences. If there is no list, output nothing.';

    /** @param array{endpoint:string,model:string,api_key:string} $config */
    public function __construct(private readonly array $config) {}

    public function isConfigured(): bool
    {
        return $this->config['endpoint'] !== '' && $this->config['model'] !== ''
            && \function_exists('curl_init');
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
    public function buildPayload(string $dataUrl): array
    {
        return [
            'model' => $this->config['model'],
            'temperature' => 0,
            'max_tokens' => 1024,
            'messages' => [[
                'role' => 'user',
                'content' => [
                    ['type' => 'text', 'text' => self::PROMPT],
                    ['type' => 'image_url', 'image_url' => ['url' => $dataUrl]],
                ],
            ]],
        ];
    }

    /**
     * Send the image to the configured endpoint and return the extracted list text.
     * @throws \RuntimeException on transport / non-2xx / malformed response.
     */
    public function scan(string $dataUrl): string
    {
        $headers = ['Content-Type: application/json'];
        if ($this->config['api_key'] !== '') {
            $headers[] = 'Authorization: Bearer ' . $this->config['api_key'];
        }
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => self::completionsUrl($this->config['endpoint']),
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($this->buildPayload($dataUrl)),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
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
