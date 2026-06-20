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
        // Load the user so a token for a DELETED account fails closed — a missing row
        // must not read as token_version 0 (which would match a default tv=0 token and
        // hand a ghost identity full write access until the JWT expires).
        // Token-generation check: "sign out everywhere" bumps the user's token_version;
        // a legacy token with no `tv` claim reads as 0, matching new users' default.
        if ($userId !== null) {
            $u = $this->users->findById((string)$userId);
            if ($u === null) {
                return self::unauthorized('Token revoked');
            }
            $tokenTv = isset($payload['tv']) ? (int)$payload['tv'] : 0;
            if ($tokenTv !== (int)($u['token_version'] ?? 0)) {
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
