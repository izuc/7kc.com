<?php
declare(strict_types=1);

namespace SevenKC\Action\Ingredients;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\AiScanner;
use SevenKC\Support\RateLimiter;

/**
 * Detects grocery items in fridge/pantry photo tiles with the server-configured
 * vision LLM and returns a merged, deduped item list (which the client runs through
 * the parser, then confirms before adding to the pantry). The client cuts the photo
 * into tiles (count from /config → AI_SCAN_TILES); the backend hard-caps the count.
 */
final class ScanPantryAction
{
    private const MAX_TILES = 16;     // 4×4 — matches AiScanner's per-axis clamp of 4
    private const MAX_BYTES = 24_000_000;

    public function __construct(
        private readonly AiScanner $scanner,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        if (!$this->scanner->isConfigured()) {
            return Json::error($res, 'not_configured', 'AI photo scanning is not enabled on this server.', 503);
        }
        // Each request fans out to up to 16 upstream calls, so rate-limit tighter than the list scan.
        $userId = (string)$req->getAttribute('user_id');
        if (($retry = $this->limiter->check("scanpantry:user:$userId", 6, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        $body = (array)($req->getParsedBody() ?? []);
        $images = $body['images'] ?? null;
        if (!is_array($images) || count($images) === 0) {
            return Json::error($res, 'bad_request', 'An images[] array of base64 data URLs is required.', 400);
        }
        if (count($images) > self::MAX_TILES) {
            return Json::error($res, 'bad_request', 'Too many tiles.', 400);
        }
        $total = 0;
        foreach ($images as $img) {
            if (!is_string($img) || !preg_match('#^data:image/[a-z0-9.+-]+;base64,#i', $img)) {
                return Json::error($res, 'bad_request', 'Each tile must be a base64 image data URL.', 400);
            }
            $total += strlen($img);
        }
        if ($total > self::MAX_BYTES) {
            return Json::error($res, 'bad_request', 'Images are too large (please use a smaller photo).', 400);
        }

        try {
            $items = $this->scanner->scanPantryTiles(array_values($images));
        } catch (\Throwable $e) {
            error_log('[scan-pantry] ' . $e->getMessage());
            return Json::error($res, 'scan_failed', 'The AI could not read that photo: ' . $e->getMessage(), 502);
        }
        return Json::send($res, ['items' => $items, 'text' => implode("\n", $items)]);
    }
}
