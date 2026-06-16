<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class ToggleBoughtAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$this->lists->findForUser($args['id'], $userId, $groupId)) {
            return Json::error($res, 'not_found', 'List not found', 404);
        }
        if ($this->lists->itemListId($args['itemId']) !== $args['id']) {
            return Json::error($res, 'not_found', 'Item not found', 404);
        }
        // An explicit target (offline outbox replay) is idempotent; absent it, flip.
        $body = (array)($req->getParsedBody() ?? []);
        $bought = array_key_exists('is_bought', $body)
            ? $this->lists->setBought($args['itemId'], $userId, (bool)$body['is_bought'])
            : $this->lists->toggleBought($args['itemId'], $userId);
        return Json::send($res, ['is_bought' => $bought]);
    }
}
