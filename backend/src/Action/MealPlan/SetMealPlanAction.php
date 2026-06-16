<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class SetMealPlanAction
{
    public function __construct(
        private readonly MealPlanRepository $plan,
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $body = (array)($req->getParsedBody() ?? []);

        $date = trim((string)($body['date'] ?? ''));
        if (!MealPlanDates::isValid($date)) {
            return Json::error($res, 'bad_request', 'A valid date (YYYY-MM-DD) is required.', 400);
        }

        $recipeId = null;
        $recipeTitle = isset($body['recipe_title']) ? trim((string)$body['recipe_title']) : null;
        $slug = isset($body['recipe_slug']) ? trim((string)$body['recipe_slug']) : '';

        if ($slug !== '') {
            // Visibility-scoped so a user can't pin another user's private custom recipe.
            $recipe = $this->recipes->findBySlugForUser($slug, $userId, $groupId);
            if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);
            $recipeId = $recipe['id'];
            $recipeTitle = $recipe['title'];
        }

        if ($recipeId === null && ($recipeTitle === null || $recipeTitle === '')) {
            return Json::error($res, 'bad_request', 'A recipe or a meal title is required.', 400);
        }
        // Match the column limit so an over-long free-text title is a clean 400, not a DB 500 on MySQL.
        if ($recipeTitle !== null && mb_strlen($recipeTitle) > 160) {
            return Json::error($res, 'bad_request', 'Meal title is too long (max 160 characters).', 400);
        }

        $this->plan->upsertSlot($userId, $date, $recipeId, $recipeTitle);
        $summary = $recipeId ? ($this->recipes->summariesByIds([$recipeId])[$recipeId] ?? null) : null;

        return Json::send($res, [
            'entry' => [
                'date' => $date,
                'recipe_id' => $recipeId,
                'recipe_title' => $recipeTitle,
                'recipe' => $summary,
            ],
        ]);
    }
}
