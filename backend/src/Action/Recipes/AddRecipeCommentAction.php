<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeCommentRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\RateLimiter;

final class AddRecipeCommentAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly RecipeCommentRepository $comments,
        private readonly UserRepository $users,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        if (($retry = $this->limiter->check("recipe-comment:user:$userId", 10, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        $groupId = $this->users->groupIdFor($userId);
        $recipe = $this->recipes->findBySlugForUser((string)$args['slug'], $userId, $groupId);
        if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);

        $body = (array)($req->getParsedBody() ?? []);
        $content = trim((string)($body['content'] ?? ''));
        if ($content === '') return Json::error($res, 'bad_request', 'Write something first.', 400);
        if (mb_strlen($content) > 1000) return Json::error($res, 'bad_request', 'Comment is too long (max 1000 characters).', 400);

        $this->comments->add($recipe['id'], $userId, $content);
        return Json::send($res, ['comments' => $this->comments->forRecipe($recipe['id'])], 201);
    }
}
