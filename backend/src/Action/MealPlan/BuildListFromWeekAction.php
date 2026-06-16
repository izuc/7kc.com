<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class BuildListFromWeekAction
{
    public function __construct(
        private readonly MealPlanRepository $plan,
        private readonly ShoppingListRepository $lists,
        private readonly IngredientRepository $ingredients,
        private readonly PantryRepository $pantry,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $body = (array)($req->getParsedBody() ?? []);

        $start = MealPlanDates::validWeekStart($body['week_start'] ?? null);
        $end = MealPlanDates::addDays($start, 6);

        $ids = $this->plan->ingredientIdsForRange($userId, $start, $end);
        if (!empty($body['skip_pantry'])) {
            $held = [];
            foreach ($this->pantry->forUser($userId, $groupId) as $p) {
                if ($p['ingredient_id']) $held[$p['ingredient_id']] = true;
            }
            $ids = array_values(array_filter($ids, fn ($id) => !isset($held[$id])));
        }
        if ($ids === []) {
            return Json::error($res, 'bad_request', 'Nothing to shop for — plan some meals first (or your pantry already has them).', 400);
        }

        // Target an existing owned list when given, else create a fresh "This week" list.
        $listId = isset($body['list_id']) ? (string)$body['list_id'] : '';
        if ($listId !== '') {
            if (!$this->lists->findForUser($listId, $userId, $groupId)) {
                return Json::error($res, 'not_found', 'List not found', 404);
            }
        } else {
            $listId = $this->lists->create($userId, null, 'This week');
        }

        $added = 0;
        foreach ($ids as $ingId) {
            $section = $this->ingredients->find($ingId)['section'] ?? 'other';
            $this->lists->addItem($listId, $userId, $ingId, null, $section);
            $added++;
        }

        return Json::send($res, [
            'list' => $this->lists->findWithItems($listId),
            'added' => $added,
        ], 201);
    }
}
