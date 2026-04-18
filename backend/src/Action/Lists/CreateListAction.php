<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class CreateListAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $body = (array)($req->getParsedBody() ?? []);
        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') $name = 'New list';
        $groupId = !empty($body['share_with_group']) ? $this->users->groupIdFor($userId) : null;
        $id = $this->lists->create($userId, $groupId, $name);
        return Json::send($res, ['list' => $this->lists->findWithItems($id)], 201);
    }
}
