<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

/**
 * Public (no-auth): resolve an invite token to just enough info to render a
 * personalised /join landing — group name, member count, inviter name. Never
 * exposes member identities or group contents.
 */
final class ResolveInviteAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $group = $this->groups->findByInviteToken(trim((string)($args['token'] ?? '')));
        if (!$group) return Json::error($res, 'not_found', 'Invalid invite', 404);

        $owner = $this->users->findById($group['owner_user_id']);
        return Json::send($res, ['invite' => [
            'group_name' => $group['name'],
            'member_count' => $this->groups->countMembers($group['id']),
            'inviter' => $owner['display_name'] ?? null,
        ]]);
    }
}
