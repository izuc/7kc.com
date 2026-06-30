<?php
declare(strict_types=1);

namespace SevenKC\Action\Ingredients;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\AiScanner;
use SevenKC\Support\RateLimiter;

/**
 * Reads a photo of a shopping list with the server-configured vision LLM and
 * returns the transcribed text (which the client then runs through the parser).
 * The AI endpoint/key/model are set by the operator in .env — see AiScanner.
 */
final class ScanImageAction
{
    public function __construct(
        private readonly AiScanner $scanner,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        if (!$this->scanner->isConfigured()) {
            return Json::error($res, 'not_configured', 'AI photo scanning is not enabled on this server.', 503);
        }
        $userId = (string)$req->getAttribute('user_id');
        if (($retry = $this->limiter->check("scan:user:$userId", 20, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }
        $body = (array)($req->getParsedBody() ?? []);
        $image = (string)($body['image'] ?? '');
        // Must be an inline base64 image data URL (prefix check only — don't regex the whole body).
        if (!preg_match('#^data:image/[a-z0-9.+-]+;base64,#i', $image)) {
            return Json::error($res, 'bad_request', 'A base64 image data URL is required.', 400);
        }
        if (strlen($image) > 12_000_000) { // ~9 MB image once base64 overhead is removed
            return Json::error($res, 'bad_request', 'Image is too large (please use a smaller photo).', 400);
        }
        try {
            $text = $this->scanner->scan($image);
        } catch (\Throwable $e) {
            error_log('[scan-image] ' . $e->getMessage());
            return Json::error($res, 'scan_failed', 'The AI could not read that image: ' . $e->getMessage(), 502);
        }
        return Json::send($res, ['text' => $text]);
    }
}
