<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class RenameListAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $body = (array)($req->getParsedBody() ?? []);
        if (!$this->lists->findForUser($args['id'], $userId, $groupId)) {
            return Json::error($res, 'not_found', 'List not found', 404);
        }
        if (isset($body['name'])) $this->lists->rename($args['id'], trim((string)$body['name']));
        if (isset($body['archived'])) $this->lists->setArchived($args['id'], (bool)$body['archived']);
        return Json::send($res, ['list' => $this->lists->findWithItemsForUser($args['id'], $userId, $groupId)]);
    }
}
