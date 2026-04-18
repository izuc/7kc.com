<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Http;

use Psr\Http\Message\ResponseInterface;

final class Json
{
    public static function send(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json');
    }

    public static function error(ResponseInterface $response, string $code, string $message, int $status = 400): ResponseInterface
    {
        return self::send($response, ['error' => $code, 'message' => $message], $status);
    }
}
