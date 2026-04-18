<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Auth\JwtService;
use SevenKC\Infrastructure\Http\Json;

final class LoginAction
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly JwtService $jwt,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $body = (array)($req->getParsedBody() ?? []);
        $email = trim((string)($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');
        $user = $this->users->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return Json::error($res, 'unauthorized', 'Invalid credentials', 401);
        }
        return Json::send($res, [
            'token' => $this->jwt->issue($user['id']),
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'display_name' => $user['display_name'],
                'group_id' => $user['group_id'],
            ],
        ]);
    }
}
