<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\RateLimiter;

final class CreateSuggestionAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$groupId) return Json::error($res, 'forbidden', 'Not in a group', 403);

        // A group member shouldn't be able to flood the shared feed with suggestions.
        if (($retry = $this->limiter->check("suggest:user:$userId", 20, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        $body = (array)($req->getParsedBody() ?? []);
        $recipeSlug = $body['recipe_slug'] ?? null;
        $title = trim((string)($body['recipe_title'] ?? ''));
        $date = $body['suggested_for_date'] ?? null;

        $recipeId = null;
        if ($recipeSlug) {
            $recipe = $this->recipes->findBySlug($recipeSlug);
            if ($recipe) {
                $recipeId = $recipe['id'];
                if ($title === '') $title = $recipe['title'];
            }
        }
        if ($title === '') return Json::error($res, 'bad_request', 'recipe_slug or recipe_title required', 400);
        if (mb_strlen($title) > 200) $title = mb_substr($title, 0, 200);

        $id = $this->groups->createSuggestion($groupId, $userId, $title, $recipeId, $date);
        $this->groups->pushEvent($groupId, $userId, 'suggest', [
            'suggestion_id' => $id,
            'recipe_title' => $title,
            'suggested_for_date' => $date,
        ]);
        return Json::send($res, ['suggestions' => $this->groups->suggestions($groupId)], 201);
    }
}
