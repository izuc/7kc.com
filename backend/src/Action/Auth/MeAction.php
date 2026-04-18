<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class MeAction
{
    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $user = $this->users->findById($userId);
        if (!$user) return Json::error($res, 'not_found', 'User not found', 404);
        return Json::send($res, [
            'id' => $user['id'],
            'email' => $user['email'],
            'display_name' => $user['display_name'],
            'group_id' => $user['group_id'],
            'created_at' => (int)$user['created_at'],
        ]);
    }
}
