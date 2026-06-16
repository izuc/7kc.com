<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class ToggleFavouriteAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $recipe = $this->recipes->findBySlugForUser($args['slug'], $userId, $groupId);
        if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);

        $favourited = $this->recipes->toggleFavourite($userId, $recipe['id']);
        return Json::send($res, ['favourited' => $favourited]);
    }
}
