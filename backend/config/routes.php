<?php
declare(strict_types=1);

use SevenKC\Action\Auth\LoginAction;
use SevenKC\Action\Auth\DeleteUserAction;
use SevenKC\Action\Auth\ExportUserAction;
use SevenKC\Action\Auth\MeAction;
use SevenKC\Action\Auth\RegisterAction;
use SevenKC\Action\Auth\SetDietAction;
use SevenKC\Action\Auth\SetDigestOptinAction;
use SevenKC\Action\Auth\DigestUnsubscribeAction;
use SevenKC\Action\Auth\SignOutEverywhereAction;
use SevenKC\Action\Push\GetVapidKeyAction;
use SevenKC\Action\Push\SubscribeAction;
use SevenKC\Action\Push\UnsubscribeAction;
use SevenKC\Action\Groups\CreateGroupAction;
use SevenKC\Action\Groups\GetFeedAction;
use SevenKC\Action\Groups\UnreadFeedAction;
use SevenKC\Action\Groups\MarkFeedSeenAction;
use SevenKC\Action\Groups\GetMyGroupAction;
use SevenKC\Action\Groups\JoinGroupAction;
use SevenKC\Action\Groups\LeaveGroupAction;
use SevenKC\Action\Groups\ResolveInviteAction;
use SevenKC\Action\Groups\ListSuggestionsAction;
use SevenKC\Action\Groups\LikeSuggestionAction;
use SevenKC\Action\Groups\CommentSuggestionAction;
use SevenKC\Action\Groups\CreateSuggestionAction;
use SevenKC\Action\Ingredients\DictionaryAction;
use SevenKC\Action\Ingredients\ListIngredientsAction;
use SevenKC\Action\Ingredients\ParseAction;
use SevenKC\Action\Ingredients\ScanImageAction;
use SevenKC\Action\ConfigAction;
use SevenKC\Action\Recipes\PublicCollectionAction;
use SevenKC\Action\Recipes\PublicRecipeAction;
use SevenKC\Action\Recipes\SitemapAction;
use SevenKC\Action\Retailers\ListRetailersAction;
use SevenKC\Action\Stats\StatsAction;
use SevenKC\Action\Lists\AddListItemsAction;
use SevenKC\Action\Lists\ArchiveListAction;
use SevenKC\Action\Lists\CreateListAction;
use SevenKC\Action\Lists\DeleteListItemAction;
use SevenKC\Action\Lists\GetListAction;
use SevenKC\Action\Lists\ListListsAction;
use SevenKC\Action\Lists\MarkAllBoughtAction;
use SevenKC\Action\Lists\MoveBoughtToPantryAction;
use SevenKC\Action\Lists\RenameListAction;
use SevenKC\Action\Lists\RestockListAction;
use SevenKC\Action\Lists\ToggleBoughtAction;
use SevenKC\Action\Pantry\AddPantryItemAction;
use SevenKC\Action\Pantry\DeletePantryItemAction;
use SevenKC\Action\Pantry\ListPantryAction;
use SevenKC\Action\Pantry\SeedStaplesAction;
use SevenKC\Action\Pantry\UpdatePantryItemAction;
use SevenKC\Action\Recipes\CookRecipeAction;
use SevenKC\Action\Recipes\CookedRecipesAction;
use SevenKC\Action\Recipes\FavouriteRecipesAction;
use SevenKC\Action\Recipes\ToggleFavouriteAction;
use SevenKC\Action\MealPlan\GetMealPlanAction;
use SevenKC\Action\MealPlan\SetMealPlanAction;
use SevenKC\Action\MealPlan\ClearMealPlanAction;
use SevenKC\Action\MealPlan\BuildListFromWeekAction;
use SevenKC\Action\Recipes\CreateRecipeAction;
use SevenKC\Action\Recipes\ImportRecipeAction;
use SevenKC\Action\Recipes\ListRecipeCommentsAction;
use SevenKC\Action\Recipes\AddRecipeCommentAction;
use SevenKC\Action\Recipes\DeleteRecipeCommentAction;
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
        $g->get('/config', ConfigAction::class);
        $g->get('/ingredients', ListIngredientsAction::class);
        $g->get('/ingredients/dictionary', DictionaryAction::class);
        $g->post('/ingredients/parse', ParseAction::class);

        // public SEO / landing (no auth)
        $g->get('/public/recipes/{slug}', PublicRecipeAction::class);
        $g->get('/public/collections/{tag}', PublicCollectionAction::class);
        $g->get('/public/retailers', ListRetailersAction::class);
        $g->get('/public/groups/{token}', ResolveInviteAction::class);
        $g->get('/unsubscribe', DigestUnsubscribeAction::class);

        // authenticated
        $g->group('', function (RouteCollectorProxy $a) {
            $a->get('/auth/me', MeAction::class);
            $a->post('/ingredients/scan-image', ScanImageAction::class);
            $a->post('/auth/diet', SetDietAction::class);
            $a->post('/auth/sign-out-everywhere', SignOutEverywhereAction::class);
            $a->post('/auth/digest-optin', SetDigestOptinAction::class);
            $a->get('/push/key', GetVapidKeyAction::class);
            $a->post('/push/subscribe', SubscribeAction::class);
            $a->post('/push/unsubscribe', UnsubscribeAction::class);
            $a->get('/auth/me/export', ExportUserAction::class);
            $a->delete('/auth/me', DeleteUserAction::class);
            $a->get('/stats', StatsAction::class);

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
            $a->post('/lists/{id}/restock', RestockListAction::class);

            $a->get('/pantry', ListPantryAction::class);
            $a->post('/pantry/seed-staples', SeedStaplesAction::class);
            $a->post('/pantry/items', AddPantryItemAction::class);
            $a->patch('/pantry/items/{id}', UpdatePantryItemAction::class);
            $a->delete('/pantry/items/{id}', DeletePantryItemAction::class);

            $a->get('/recipes', ListRecipesAction::class);
            $a->get('/recipes/suggestions', SuggestionsAction::class);
            $a->get('/recipes/cooked', CookedRecipesAction::class);
            $a->get('/recipes/favourites', FavouriteRecipesAction::class);
            $a->get('/recipes/{slug}', GetRecipeAction::class);
            $a->post('/recipes', CreateRecipeAction::class);
            $a->post('/recipes/import', ImportRecipeAction::class);
            $a->post('/recipes/{slug}/cook', CookRecipeAction::class);
            $a->post('/recipes/{slug}/favourite', ToggleFavouriteAction::class);
            $a->get('/recipes/{slug}/comments', ListRecipeCommentsAction::class);
            $a->post('/recipes/{slug}/comments', AddRecipeCommentAction::class);
            $a->delete('/recipes/{slug}/comments/{id}', DeleteRecipeCommentAction::class);

            $a->get('/meal-plan', GetMealPlanAction::class);
            $a->put('/meal-plan', SetMealPlanAction::class);
            $a->delete('/meal-plan', ClearMealPlanAction::class);
            $a->post('/meal-plan/build-list', BuildListFromWeekAction::class);

            $a->post('/groups', CreateGroupAction::class);
            $a->get('/groups/mine', GetMyGroupAction::class);
            $a->post('/groups/join', JoinGroupAction::class);
            $a->post('/groups/leave', LeaveGroupAction::class);
            $a->get('/groups/feed', GetFeedAction::class);
            $a->get('/groups/unread', UnreadFeedAction::class);
            $a->post('/groups/feed/seen', MarkFeedSeenAction::class);
            $a->get('/groups/suggestions', ListSuggestionsAction::class);
            $a->post('/groups/suggestions', CreateSuggestionAction::class);
            $a->post('/groups/suggestions/{id}/like', LikeSuggestionAction::class);
            $a->post('/groups/suggestions/{id}/comment', CommentSuggestionAction::class);
        })->add($auth);
    });
};
