<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;

final class GetRecipeAction
{
    public function __construct(private readonly RecipeRepository $recipes) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $recipe = $this->recipes->findBySlug($args['slug']);
        if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);
        return Json::send($res, ['recipe' => $recipe]);
    }
}
