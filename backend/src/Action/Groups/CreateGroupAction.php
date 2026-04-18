<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class CreateGroupAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        if ($this->users->groupIdFor($userId)) {
            return Json::error($res, 'conflict', 'You are already in a group', 409);
        }
        $body = (array)($req->getParsedBody() ?? []);
        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') $name = 'My kitchen';
        $me = $this->users->findById($userId);
        $group = $this->groups->create($userId, $name, $me['display_name'] ?? null);
        $this->users->setGroup($userId, $group['id']);
        return Json::send($res, ['group' => $group], 201);
    }
}
