<?php
declare(strict_types=1);

use SevenKC\Action\Auth\LoginAction;
use SevenKC\Action\Auth\MeAction;
use SevenKC\Action\Auth\RegisterAction;
use SevenKC\Action\Groups\CreateGroupAction;
use SevenKC\Action\Groups\GetFeedAction;
use SevenKC\Action\Groups\GetMyGroupAction;
use SevenKC\Action\Groups\JoinGroupAction;
use SevenKC\Action\Groups\LeaveGroupAction;
use SevenKC\Action\Groups\ListSuggestionsAction;
use SevenKC\Action\Groups\LikeSuggestionAction;
use SevenKC\Action\Groups\CommentSuggestionAction;
use SevenKC\Action\Groups\CreateSuggestionAction;
use SevenKC\Action\Ingredients\ListIngredientsAction;
use SevenKC\Action\Ingredients\ParseAction;
use SevenKC\Action\Recipes\PublicRecipeAction;
use SevenKC\Action\Recipes\SitemapAction;
use SevenKC\Action\Retailers\ListRetailersAction;
use SevenKC\Action\Lists\AddListItemsAction;
use SevenKC\Action\Lists\ArchiveListAction;
use SevenKC\Action\Lists\CreateListAction;
use SevenKC\Action\Lists\DeleteListItemAction;
use SevenKC\Action\Lists\GetListAction;
use SevenKC\Action\Lists\ListListsAction;
use SevenKC\Action\Lists\MarkAllBoughtAction;
use SevenKC\Action\Lists\MoveBoughtToPantryAction;
use SevenKC\Action\Lists\RenameListAction;
use SevenKC\Action\Lists\ToggleBoughtAction;
use SevenKC\Action\Pantry\AddPantryItemAction;
use SevenKC\Action\Pantry\DeletePantryItemAction;
use SevenKC\Action\Pantry\ListPantryAction;
use SevenKC\Action\Pantry\UpdatePantryItemAction;
use SevenKC\Action\Recipes\CookRecipeAction;
use SevenKC\Action\Recipes\CreateRecipeAction;
use SevenKC\Action\Recipes\GetRecipeAction;
use SevenKC\Action\Recipes\ListRecipesAction;
use SevenKC\Action\Recipes\SuggestionsAction;
use SevenKC\Infrastructure\Http\AuthMiddleware;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app): void {
    $auth = $app->getContainer()->get(AuthMiddleware::class);

    $app->get('/', function ($req, $res) {
        $res->getBody()->write(json_encode(['name' => '7KC API', 'version' => 'v1']));
        return $res->withHeader('Content-Type', 'application/json');
    });

    $app->get('/sitemap.xml', SitemapAction::class);

    $app->options('/{routes:.+}', fn ($req, $res) => $res);

    $app->group('/api/v1', function (RouteCollectorProxy $g) use ($auth) {
        // public
        $g->post('/auth/register', RegisterAction::class);
        $g->post('/auth/login', LoginAction::class);

        // public utility endpoints (no auth for ingredient lookup)
        $g->get('/ingredients', ListIngredientsAction::class);
        $g->post('/ingredients/parse', ParseAction::class);

        // public SEO / landing (no auth)
        $g->get('/public/recipes/{slug}', PublicRecipeAction::class);
        $g->get('/public/retailers', ListRetailersAction::class);

        // authenticated
        $g->group('', function (RouteCollectorProxy $a) {
            $a->get('/auth/me', MeAction::class);

            $a->get('/lists', ListListsAction::class);
            $a->post('/lists', CreateListAction::class);
            $a->get('/lists/{id}', GetListAction::class);
            $a->patch('/lists/{id}', RenameListAction::class);
            $a->delete('/lists/{id}', ArchiveListAction::class);
            $a->post('/lists/{id}/items', AddListItemsAction::class);
            $a->delete('/lists/{id}/items/{itemId}', DeleteListItemAction::class);
            $a->post('/lists/{id}/items/{itemId}/toggle-bought', ToggleBoughtAction::class);
            $a->post('/lists/{id}/mark-all-bought', MarkAllBoughtAction::class);
            $a->post('/lists/{id}/move-bought-to-pantry', MoveBoughtToPantryAction::class);

            $a->get('/pantry', ListPantryAction::class);
            $a->post('/pantry/items', AddPantryItemAction::class);
            $a->patch('/pantry/items/{id}', UpdatePantryItemAction::class);
            $a->delete('/pantry/items/{id}', DeletePantryItemAction::class);

            $a->get('/recipes', ListRecipesAction::class);
            $a->get('/recipes/suggestions', SuggestionsAction::class);
            $a->get('/recipes/{slug}', GetRecipeAction::class);
            $a->post('/recipes', CreateRecipeAction::class);
            $a->post('/recipes/{slug}/cook', CookRecipeAction::class);

            $a->post('/groups', CreateGroupAction::class);
            $a->get('/groups/mine', GetMyGroupAction::class);
            $a->post('/groups/join', JoinGroupAction::class);
            $a->post('/groups/leave', LeaveGroupAction::class);
            $a->get('/groups/feed', GetFeedAction::class);
            $a->get('/groups/suggestions', ListSuggestionsAction::class);
            $a->post('/groups/suggestions', CreateSuggestionAction::class);
            $a->post('/groups/suggestions/{id}/like', LikeSuggestionAction::class);
            $a->post('/groups/suggestions/{id}/comment', CommentSuggestionAction::class);
        })->add($auth);
    });
};
