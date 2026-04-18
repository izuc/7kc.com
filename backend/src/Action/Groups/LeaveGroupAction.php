<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class LeaveGroupAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$groupId) return Json::send($res, ['ok' => true]);

        $this->groups->removeMember($groupId, $userId);
        $this->users->setGroup($userId, null);

        if ($this->groups->countMembers($groupId) === 0) {
            $this->groups->delete($groupId);
        } else {
            $this->groups->pushEvent($groupId, $userId, 'member_left', []);
        }
        return Json::send($res, ['ok' => true]);
    }
}
