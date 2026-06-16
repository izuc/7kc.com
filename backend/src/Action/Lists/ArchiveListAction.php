<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class ArchiveListAction
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
        $this->lists->setArchived($args['id'], true);
        return Json::send($res, ['ok' => true]);
    }
}
