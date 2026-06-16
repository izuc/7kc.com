<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class ListListsAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $lists = $this->lists->forUser($userId, $groupId);
        $itemsByList = $this->lists->itemsForLists(array_column($lists, 'id'));
        foreach ($lists as &$l) {
            $l['items'] = $itemsByList[$l['id']] ?? [];
        }
        unset($l);
        return Json::send($res, ['lists' => $lists]);
    }
}
