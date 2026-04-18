<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class GetFeedAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$groupId) return Json::send($res, ['feed' => []]);
        $events = $this->groups->feed($groupId);
        foreach ($events as &$e) {
            $e['payload'] = $e['payload_json'] ? (array)json_decode((string)$e['payload_json'], true) : [];
            unset($e['payload_json']);
            $e['created_at'] = (int)$e['created_at'];
        }
        return Json::send($res, ['feed' => $events]);
    }
}
