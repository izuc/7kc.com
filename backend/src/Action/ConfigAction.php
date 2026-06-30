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
        return Json::send($res, [
            'features' => [
                'ai_scan' => $this->scanner->isConfigured(),
            ],
        ]);
    }
}
