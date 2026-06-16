<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

/**
 * Closes the pantry loop: pull every "running low" pantry item onto a shopping list,
 * skipping anything already on it. The promise the landing page makes ("queued for
 * next week's list automatically") made explicit.
 */
final class RestockListAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly PantryRepository $pantry,
        private readonly IngredientRepository $ingredients,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$this->lists->findForUser($args['id'], $userId, $groupId)) {
            return Json::error($res, 'not_found', 'List not found', 404);
        }

        $low = $this->pantry->runningLow($userId, $groupId);

        // Dedup against what's already on the list.
        $haveIng = [];
        $haveCustom = [];
        foreach ($this->lists->items($args['id']) as $it) {
            if ($it['ingredient_id']) $haveIng[$it['ingredient_id']] = true;
            elseif ($it['custom_name']) $haveCustom[strtolower($it['custom_name'])] = true;
        }

        $added = 0;
        foreach ($low as $p) {
            $ingId = $p['ingredient_id'];
            $custom = $p['custom_name'];
            if ($ingId && isset($haveIng[$ingId])) continue;
            if (!$ingId && $custom && isset($haveCustom[strtolower($custom)])) continue;
            if (!$ingId && !$custom) continue;

            $section = 'other';
            if ($ingId) {
                $ing = $this->ingredients->find($ingId);
                if ($ing) $section = $ing['section'];
            }
            $this->lists->addItem($args['id'], $userId, $ingId, $custom, $section);
            $added++;
        }

        return Json::send($res, [
            'list' => $this->lists->findWithItemsForUser($args['id'], $userId, $groupId),
            'added' => $added,
        ]);
    }
}
