<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class CookRecipeAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly PantryRepository $pantry,
        private readonly UserRepository $users,
        private readonly GroupRepository $groups,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $recipe = $this->recipes->findBySlugForUser($args['slug'], $userId, $groupId);
        if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);

        $body = (array)($req->getParsedBody() ?? []);
        $removeIds = array_values((array)($body['remove_ingredient_ids'] ?? []));
        // Only the ids whose rows were actually deleted — not the raw requested list, which
        // inflates if the client sends phantom or duplicate ids (and would skew the rescued
        // stat, since StatsAction counts the persisted removed_pantry_json verbatim).
        $removedIds = $removeIds ? $this->pantry->removeByIngredientIdsReturning($userId, $groupId, $removeIds) : [];
        $removed = count($removedIds);
        $cookedId = $this->recipes->recordCooked($userId, $groupId, $recipe['id'], $removedIds);

        if ($groupId) {
            $this->groups->pushEvent($groupId, $userId, 'cooked', [
                'recipe_id' => $recipe['id'],
                'recipe_title' => $recipe['title'],
                'removed_count' => $removed,
            ]);
        }

        return Json::send($res, ['cooked_meal_id' => $cookedId, 'removed' => $removed]);
    }
}
