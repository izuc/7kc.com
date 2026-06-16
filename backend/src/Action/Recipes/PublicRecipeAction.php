<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\RateLimiter;

/**
 * Public, SEO-friendly recipe endpoint. Serves ONLY the curated (non-custom) catalogue
 * without auth, and includes a ready-to-render Schema.org Recipe JSON-LD fragment.
 */
final class PublicRecipeAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly Connection $db,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $recipe = $this->recipes->findPublicBySlug($args['slug']);
        if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);

        // increment view count, deduped to once per IP+slug per hour so the metric can't be trivially inflated
        $ip = RateLimiter::clientIp($req);
        if ($this->limiter->check('view:' . $ip . ':' . $recipe['slug'], 1, 3600) === null) {
            $this->db->executeStatement('UPDATE recipes SET view_count = view_count + 1 WHERE id = ?', [$recipe['id']]);
        }

        $origin = $req->getUri()->getScheme() . '://' . $req->getUri()->getHost();
        if ($req->getUri()->getPort()) $origin .= ':' . $req->getUri()->getPort();
        $base = rtrim($_ENV['PUBLIC_WEB_ORIGIN'] ?? $origin, '/');

        $ingredientStrings = array_map(
            fn ($i) => trim(($i['amount'] ? $i['amount'] . ' ' : '') . ($i['display'] ?? $i['ingredient_id'] ?? '')),
            $recipe['ingredients']
        );
        $steps = array_map(
            fn ($s) => ['@type' => 'HowToStep', 'text' => $s['content']],
            $recipe['steps']
        );

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Recipe',
            'name' => $recipe['title'],
            'description' => $recipe['description'],
            // Recipe rich results require an image — fall back to the brand card when none.
            'image' => !empty($recipe['image_url']) ? $recipe['image_url'] : $base . '/og-default.png',
            'recipeIngredient' => array_values(array_filter($ingredientStrings)),
            'recipeInstructions' => $steps,
            'recipeYield' => $recipe['servings'] . ' servings',
            'prepTime' => 'PT' . $recipe['prep_time'] . 'M',
            'cookTime' => 'PT' . $recipe['cook_time'] . 'M',
            'totalTime' => 'PT' . ($recipe['prep_time'] + $recipe['cook_time']) . 'M',
            'keywords' => implode(', ', $recipe['tags']),
        ];

        return Json::send($res, [
            'recipe' => $recipe,
            'schema' => $schema,
        ]);
    }
}
