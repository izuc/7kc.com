<?php
declare(strict_types=1);

namespace SevenKC\Action\Pantry;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class DeletePantryItemAction
{
    public function __construct(
        private readonly PantryRepository $pantry,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$this->pantry->deleteForUser($args['id'], $userId, $groupId)) {
            return Json::error($res, 'not_found', 'Pantry item not found', 404);
        }
        return Json::send($res, ['ok' => true]);
    }
}
