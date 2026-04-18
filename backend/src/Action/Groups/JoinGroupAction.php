<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class JoinGroupAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        if ($this->users->groupIdFor($userId)) {
            return Json::error($res, 'conflict', 'Leave your current group first', 409);
        }
        $body = (array)($req->getParsedBody() ?? []);
        $token = trim((string)($body['token'] ?? ''));
        $group = $this->groups->findByInviteToken($token);
        if (!$group) return Json::error($res, 'not_found', 'Invalid invite', 404);
        if ($this->groups->countMembers($group['id']) >= 8) {
            return Json::error($res, 'conflict', 'Group is full', 409);
        }
        $me = $this->users->findById($userId);
        $this->groups->addMember($group['id'], $userId, $me['display_name'] ?? null);
        $this->users->setGroup($userId, $group['id']);
        $this->groups->pushEvent($group['id'], $userId, 'member_joined', ['display_name' => $me['display_name'] ?? $me['email']]);
        return Json::send($res, ['group' => $this->groups->find($group['id'])]);
    }
}
