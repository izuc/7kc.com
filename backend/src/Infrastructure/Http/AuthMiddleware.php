<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Http;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use SevenKC\Infrastructure\Auth\JwtService;
use Slim\Psr7\Response;

final class AuthMiddleware implements MiddlewareInterface
{
    public function __construct(private readonly JwtService $jwt) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $auth = $request->getHeaderLine('Authorization');
        if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
            return self::unauthorized('Missing bearer token');
        }
        try {
            $payload = $this->jwt->verify($m[1]);
        } catch (\Throwable $e) {
            return self::unauthorized('Invalid token: ' . $e->getMessage());
        }
        $request = $request->withAttribute('user_id', $payload['sub'] ?? null)
            ->withAttribute('jwt', $payload);
        return $handler->handle($request);
    }

    private static function unauthorized(string $msg): ResponseInterface
    {
        $r = new Response(401);
        $r->getBody()->write(json_encode(['error' => 'unauthorized', 'message' => $msg]));
        return $r->withHeader('Content-Type', 'application/json');
    }
}
