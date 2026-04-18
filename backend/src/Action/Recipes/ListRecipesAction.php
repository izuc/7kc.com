<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class ListRecipesAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $q = trim((string)($req->getQueryParams()['q'] ?? ''));
        $tags = array_filter(explode(',', (string)($req->getQueryParams()['tags'] ?? '')));
        $recipes = $this->recipes->all($userId, $groupId);
        if ($q !== '') {
            $needle = strtolower($q);
            $recipes = array_values(array_filter($recipes, fn ($r) =>
                str_contains(strtolower($r['title']), $needle) ||
                !empty(array_filter($r['tags'], fn ($t) => str_contains(strtolower($t), $needle)))
            ));
        }
        if ($tags) {
            $recipes = array_values(array_filter($recipes, fn ($r) => array_intersect($tags, $r['tags'])));
        }
        return Json::send($res, ['recipes' => $recipes]);
    }
}
