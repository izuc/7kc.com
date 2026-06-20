<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class MoveBoughtToPantryAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly PantryRepository $pantry,
        private readonly IngredientRepository $ingredients,
        private readonly UserRepository $users,
        private readonly Connection $db,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$this->lists->findForUser($args['id'], $userId, $groupId)) {
            return Json::error($res, 'not_found', 'List not found', 404);
        }
        $body = (array)($req->getParsedBody() ?? []);
        $exclude = $body['exclude_item_ids'] ?? [];

        $items = $this->lists->itemsToMove($args['id'], $exclude);

        // Atomic: either every bought item lands in the pantry AND is marked moved,
        // or nothing changes — a mid-loop failure can't leave items half-migrated.
        $movedCount = $this->db->transactional(function () use ($items, $userId, $groupId): int {
            $moved = [];
            foreach ($items as $it) {
                $expires = null;
                if ($it['ingredient_id']) {
                    $shelf = $this->ingredients->shelfLife($it['ingredient_id']);
                    $expires = time() + $shelf * 86400;
                }
                $this->pantry->addOrRefresh($userId, $groupId, $it['ingredient_id'], $it['custom_name'], $expires);
                $moved[] = $it['id'];
            }
            $this->lists->markMoved($moved);
            return count($moved);
        });

        return Json::send($res, ['moved' => $movedCount]);
    }
}
