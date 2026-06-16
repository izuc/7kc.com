<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Auth\JwtService;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\RateLimiter;

final class RegisterAction
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
        $displayName = isset($body['display_name']) ? trim((string)$body['display_name']) : null;

        $ip = RateLimiter::clientIp($req);
        if (($retry = $this->limiter->check("register:ip:$ip", 10, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }
        if ($email !== '' && ($retry = $this->limiter->check('register:email:' . strtolower($email), 5, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return Json::error($res, 'bad_request', 'Invalid email', 400);
        }
        if (strlen($password) < 8) {
            return Json::error($res, 'bad_request', 'Password must be at least 8 characters', 400);
        }
        if ($this->users->findByEmail($email)) {
            return Json::error($res, 'conflict', 'Email already registered', 409);
        }

        $user = $this->users->create($email, password_hash($password, PASSWORD_BCRYPT), $displayName);
        $token = $this->jwt->issue($user['id'], ['tv' => (int)($user['token_version'] ?? 0)]);
        return Json::send($res, [
            'token' => $token,
            'user' => $this->publicUser($user),
        ], 201);
    }

    private function publicUser(array $u): array
    {
        return [
            'id' => $u['id'],
            'email' => $u['email'],
            'display_name' => $u['display_name'],
            'group_id' => $u['group_id'],
        ];
    }
}
