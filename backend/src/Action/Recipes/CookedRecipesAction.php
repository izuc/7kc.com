<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;

/** Recipes the user has cooked, most-recent first, with how many times. */
final class CookedRecipesAction
{
    public function __construct(private readonly RecipeRepository $recipes) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        return Json::send($res, ['cooked' => $this->recipes->cookedSummary($userId)]);
    }
}
