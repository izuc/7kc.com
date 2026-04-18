<?php
declare(strict_types=1);

namespace SevenKC\Action\Ingredients;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\Parser;

final class ParseAction
{
    public function __construct(private readonly Parser $parser) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $body = (array)($req->getParsedBody() ?? []);
        $text = (string)($body['text'] ?? '');
        return Json::send($res, ['items' => $this->parser->parse($text)]);
    }
}
