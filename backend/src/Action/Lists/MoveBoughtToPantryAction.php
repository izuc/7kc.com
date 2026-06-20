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
        $exclude = (array)($body['exclude_item_ids'] ?? []);

        // Atomic AND idempotent: read inside the transaction and CLAIM each row with a
        // guarded UPDATE (moved_to_pantry 0→1). A concurrent/double-clicked second request
        // sees the row already claimed (0 affected) and skips it, so addOrRefresh runs
        // exactly once per item — no duplicate pantry rows.
        $args_id = (string)$args['id'];
        $movedCount = $this->db->transactional(function () use ($args_id, $exclude, $userId, $groupId): int {
            $moved = 0;
            foreach ($this->lists->itemsToMove($args_id, $exclude) as $it) {
                $claimed = $this->db->executeStatement(
                    'UPDATE shopping_list_items SET moved_to_pantry = 1 WHERE id = ? AND moved_to_pantry = 0',
                    [$it['id']]
                );
                if ($claimed === 0) continue; // another request already moved this item
                $expires = null;
                if ($it['ingredient_id']) {
                    $shelf = $this->ingredients->shelfLife($it['ingredient_id']);
                    $expires = time() + $shelf * 86400;
                }
                $this->pantry->addOrRefresh($userId, $groupId, $it['ingredient_id'], $it['custom_name'], $expires);
                $moved++;
            }
            return $moved;
        });

        return Json::send($res, ['moved' => $movedCount]);
    }
}
