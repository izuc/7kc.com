<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class CreateRecipeAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $body = (array)($req->getParsedBody() ?? []);
        if (empty($body['title'])) return Json::error($res, 'bad_request', 'Title required', 400);

        // Bound user-authored fields before they reach the DB — a single malicious
        // or runaway client shouldn't be able to store megabytes of text per recipe.
        if (mb_strlen((string)$body['title']) > 160) {
            return Json::error($res, 'bad_request', 'Title is too long (max 160 characters)', 400);
        }
        if (isset($body['description']) && mb_strlen((string)$body['description']) > 4000) {
            return Json::error($res, 'bad_request', 'Description is too long (max 4000 characters)', 400);
        }
        $ingredients = is_array($body['ingredients'] ?? null) ? $body['ingredients'] : [];
        $steps = is_array($body['steps'] ?? null) ? $body['steps'] : [];
        if (count($ingredients) > 100) {
            return Json::error($res, 'bad_request', 'Too many ingredients (max 100)', 400);
        }
        if (count($steps) > 60) {
            return Json::error($res, 'bad_request', 'Too many steps (max 60)', 400);
        }
        // Per-ingredient bounds matching the DB columns (amount_text 120, ingredient_id 64),
        // so an over-length value is a clean 400 instead of a 500 mid-insert.
        foreach ($ingredients as $ing) {
            if (!is_array($ing)) continue;
            if (isset($ing['amount']) && mb_strlen((string)$ing['amount']) > 120) {
                return Json::error($res, 'bad_request', 'Ingredient amount is too long (max 120 characters)', 400);
            }
            $iid = $ing['ingredient_id'] ?? $ing['id'] ?? null;
            if ($iid !== null && mb_strlen((string)$iid) > 64) {
                return Json::error($res, 'bad_request', 'Ingredient id is too long (max 64 characters)', 400);
            }
        }

        $groupId = !empty($body['share_with_group']) ? $this->users->groupIdFor($userId) : null;
        $id = $this->recipes->createCustom($userId, $groupId, $body);
        return Json::send($res, ['recipe' => $this->recipes->findById($id)], 201);
    }
}
