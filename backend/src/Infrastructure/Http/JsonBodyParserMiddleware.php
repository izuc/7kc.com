<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Http;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class JsonBodyParserMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $contentType = $request->getHeaderLine('Content-Type');
        if (str_contains(strtolower($contentType), 'application/json')) {
            $raw = (string)$request->getBody();
            if ($raw !== '') {
                $data = json_decode($raw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                    $request = $request->withParsedBody($data);
                }
            }
        }
        return $handler->handle($request);
    }
}
