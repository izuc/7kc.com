<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;

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
        $payload = json_encode(['recipes' => $this->recipes->all()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        // ETag over the actual payload so any catalogue change (added recipes,
        // edited palettes) busts the cache immediately. `no-cache` means the
        // browser may store it but must revalidate every time — it sends
        // If-None-Match and gets a cheap 304 when nothing changed, or fresh
        // data the moment it does. This replaces max-age=3600, which served
        // stale catalogues for up to an hour after a reseed.
        $etag = '"' . md5($payload) . '"';
        $cache = 'public, no-cache';

        if (trim($req->getHeaderLine('If-None-Match')) === $etag) {
            return $res->withStatus(304)
                ->withHeader('ETag', $etag)
                ->withHeader('Cache-Control', $cache);
        }

        $res->getBody()->write($payload);
        return $res
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('ETag', $etag)
            ->withHeader('Cache-Control', $cache);
    }
}
