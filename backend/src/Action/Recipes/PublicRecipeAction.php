<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;

/**
 * Public, SEO-friendly recipe endpoint. Same recipe payload, but callable without auth,
 * and includes a ready-to-render Schema.org Recipe JSON-LD fragment for the landing page.
 */
final class PublicRecipeAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly Connection $db,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $recipe = $this->recipes->findBySlug($args['slug']);
        if (!$recipe) return Json::error($res, 'not_found', 'Recipe not found', 404);

        // increment view count — async-safe enough for v1
        $this->db->executeStatement('UPDATE recipes SET view_count = view_count + 1 WHERE id = ?', [$recipe['id']]);

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
            'recipeIngredient' => array_values(array_filter($ingredientStrings)),
            'recipeInstructions' => $steps,
            'recipeYield' => $recipe['servings'] . ' servings',
            'prepTime' => 'PT' . $recipe['prep_time'] . 'M',
            'cookTime' => 'PT' . $recipe['cook_time'] . 'M',
            'totalTime' => 'PT' . ($recipe['prep_time'] + $recipe['cook_time']) . 'M',
            'keywords' => implode(', ', $recipe['tags']),
        ];
        if (!empty($recipe['image_url'])) $schema['image'] = $recipe['image_url'];

        return Json::send($res, [
            'recipe' => $recipe,
            'schema' => $schema,
        ]);
    }
}
