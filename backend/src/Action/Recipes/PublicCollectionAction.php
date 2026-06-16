<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;

/** Public, no-auth: the recipes in a tag collection (e.g. /collection/quick). */
final class PublicCollectionAction
{
    public function __construct(private readonly RecipeRepository $recipes) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $tag = (string)($args['tag'] ?? '');
        return Json::send($res, [
            'tag' => $tag,
            'recipes' => $this->recipes->publicByTag($tag),
        ]);
    }
}
