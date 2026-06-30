<?php
declare(strict_types=1);

namespace SevenKC\Action;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\AiScanner;

/** Public, secret-free feature flags so the client knows what's available. */
final class ConfigAction
{
    public function __construct(private readonly AiScanner $scanner) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $on = $this->scanner->isConfigured();
        return Json::send($res, [
            'features' => [
                'ai_scan' => $on,
                // grid size per axis for pantry/fridge tiling (the client cuts this many tiles)
                'ai_scan_tiles' => $on ? $this->scanner->tiles() : 1,
            ],
        ]);
    }
}
