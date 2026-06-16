<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Auth\JwtService;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\RateLimiter;

final class LoginAction
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly JwtService $jwt,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $body = (array)($req->getParsedBody() ?? []);
        $email = trim((string)($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');

        $ip = RateLimiter::clientIp($req);
        if (($retry = $this->limiter->check("login:ip:$ip", 10, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }
        if ($email !== '' && ($retry = $this->limiter->check('login:email:' . strtolower($email), 5, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        $user = $this->users->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return Json::error($res, 'unauthorized', 'Invalid credentials', 401);
        }
        return Json::send($res, [
            'token' => $this->jwt->issue($user['id'], ['tv' => (int)($user['token_version'] ?? 0)]),
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'display_name' => $user['display_name'],
                'group_id' => $user['group_id'],
            ],
        ]);
    }
}
