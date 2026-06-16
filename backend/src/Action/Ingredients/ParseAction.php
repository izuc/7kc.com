<?php
declare(strict_types=1);

namespace SevenKC\Action\Ingredients;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\Parser;
use SevenKC\Support\RateLimiter;

final class ParseAction
{
    public function __construct(
        private readonly Parser $parser,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $ip = RateLimiter::clientIp($req);
        if (($retry = $this->limiter->check("parse:ip:$ip", 30, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        $body = (array)($req->getParsedBody() ?? []);
        $text = (string)($body['text'] ?? '');
        return Json::send($res, ['items' => $this->parser->parse($text)]);
    }
}
