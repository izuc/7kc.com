<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;

/**
 * Public, no-auth: the whole catalogue (non-custom recipes) with palette,
 * dish_form and ingredient_ids — powers the logged-out /browse page and the
 * landing-page showcase, where every dish renders its generated artwork.
 */
final class PublicRecipesAction
{
    public function __construct(private readonly RecipeRepository $recipes) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $out = Json::send($res, ['recipes' => $this->recipes->all()]);
        // The catalogue only changes on deploy — let browsers/CDNs keep it a while.
        return $out->withHeader('Cache-Control', 'public, max-age=3600');
    }
}
