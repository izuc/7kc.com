<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use SevenKC\Domain\Repository\RecipeRepository;

/**
 * Shared body validation for add/update meal-plan actions: resolves the
 * recipe (visibility-scoped) or free-text title, and the optional meal label
 * ("Breakfast", "Dinner", anything ≤40 chars — days are not fixed to three
 * meals).
 *
 * Returns ['error' => message] or
 * ['recipe_id' => ?string, 'recipe_title' => ?string, 'label' => ?string].
 */
final class MealPayload
{
    public static function resolve(array $body, RecipeRepository $recipes, string $userId, ?string $groupId): array
    {
        $recipeId = null;
        $recipeTitle = isset($body['recipe_title']) ? trim((string)$body['recipe_title']) : null;
        $slug = isset($body['recipe_slug']) ? trim((string)$body['recipe_slug']) : '';

        if ($slug !== '') {
            // Visibility-scoped so a user can't pin another user's private custom recipe.
            $recipe = $recipes->findBySlugForUser($slug, $userId, $groupId);
            if (!$recipe) return ['error' => 'Recipe not found', 'status' => 404];
            $recipeId = $recipe['id'];
            $recipeTitle = $recipe['title'];
        }

        if ($recipeId === null && ($recipeTitle === null || $recipeTitle === '')) {
            return ['error' => 'A recipe or a meal title is required.', 'status' => 400];
        }
        // Match the column limits so over-long input is a clean 400, not a DB 500 on MySQL.
        if ($recipeTitle !== null && mb_strlen($recipeTitle) > 160) {
            return ['error' => 'Meal title is too long (max 160 characters).', 'status' => 400];
        }

        $label = isset($body['label']) ? trim((string)$body['label']) : '';
        if (mb_strlen($label) > 40) {
            return ['error' => 'Meal label is too long (max 40 characters).', 'status' => 400];
        }

        return [
            'recipe_id' => $recipeId,
            'recipe_title' => $recipeTitle,
            'label' => $label === '' ? null : $label,
        ];
    }
}
