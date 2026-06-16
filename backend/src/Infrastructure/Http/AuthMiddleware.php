<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Http;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Auth\JwtService;
use Slim\Psr7\Response;

final class AuthMiddleware implements MiddlewareInterface
{
    public function __construct(
        private readonly JwtService $jwt,
        private readonly UserRepository $users,
    ) {}

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
        $userId = $payload['sub'] ?? null;
        // Token-generation check: "sign out everywhere" bumps the user's token_version.
        // A legacy token with no `tv` claim reads as 0, matching new users' default,
        // so already-issued tokens keep working until the user revokes them.
        if ($userId !== null) {
            $tokenTv = isset($payload['tv']) ? (int)$payload['tv'] : 0;
            if ($tokenTv !== $this->users->tokenVersion($userId)) {
                return self::unauthorized('Token revoked');
            }
        }
        $request = $request->withAttribute('user_id', $userId)
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
