<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Auth\JwtService;
use SevenKC\Infrastructure\Http\AuthMiddleware;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class AuthMiddlewareTest extends TestCase
{
    private JwtService $jwt;
    private UserRepository $users;

    protected function setUp(): void
    {
        parent::setUp();
        $this->jwt = new JwtService('test-secret-at-least-32-characters-long!!', 'HS256', 24);
        $this->users = new UserRepository($this->db);
    }

    /** A handler that records whether it ran and what user_id the middleware set. */
    private function handler(): RequestHandlerInterface
    {
        return new class implements RequestHandlerInterface {
            public bool $called = false;
            public ?string $userId = null;
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                $this->called = true;
                $this->userId = $request->getAttribute('user_id');
                return new Response(200);
            }
        };
    }

    private function dispatch(string $token): array
    {
        $mw = new AuthMiddleware($this->jwt, $this->users);
        $handler = $this->handler();
        $req = (new ServerRequestFactory())
            ->createServerRequest('GET', '/api/v1/auth/me')
            ->withHeader('Authorization', 'Bearer ' . $token);
        $res = $mw->process($req, $handler);
        return [$res, $handler];
    }

    public function testTokenWithMatchingVersionPasses(): void
    {
        $user = $this->users->create('a@b.com', 'x', null);
        [$res, $handler] = $this->dispatch($this->jwt->issue($user['id'], ['tv' => 0]));
        $this->assertSame(200, $res->getStatusCode());
        $this->assertTrue($handler->called);
        $this->assertSame($user['id'], $handler->userId);
    }

    public function testLegacyTokenWithoutTvClaimStillPasses(): void
    {
        // Backward compat: tokens issued before token_version existed have no `tv`;
        // they must keep working (read as version 0, matching the default).
        $user = $this->users->create('a@b.com', 'x', null);
        [$res, $handler] = $this->dispatch($this->jwt->issue($user['id']));
        $this->assertSame(200, $res->getStatusCode());
        $this->assertTrue($handler->called);
    }

    public function testStaleTokenIsRevokedAfterBump(): void
    {
        $user = $this->users->create('a@b.com', 'x', null);
        $token = $this->jwt->issue($user['id'], ['tv' => 0]);
        $this->users->bumpTokenVersion($user['id']); // "sign out everywhere"

        [$res, $handler] = $this->dispatch($token);
        $this->assertSame(401, $res->getStatusCode());
        $this->assertFalse($handler->called);
    }

    public function testGarbageTokenIsRejected(): void
    {
        [$res, $handler] = $this->dispatch('not-a-real-jwt');
        $this->assertSame(401, $res->getStatusCode());
        $this->assertFalse($handler->called);
    }
}
