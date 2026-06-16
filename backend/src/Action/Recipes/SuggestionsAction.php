<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class SuggestionsAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly PantryRepository $pantry,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);

        $pantry = $this->pantry->forUser($userId, $groupId);
        $now = time();
        $pantryIds = [];
        $expiringIds = [];
        foreach ($pantry as $p) {
            if ($p['ingredient_id']) {
                $pantryIds[$p['ingredient_id']] = true;
                if ($p['expires_at'] !== null) {
                    $days = (int)round(($p['expires_at'] - $now) / 86400);
                    if ($days >= 0 && $days <= 3) {
                        $expiringIds[$p['ingredient_id']] = true;
                    }
                }
            }
        }

        $recentlyCooked = array_flip($this->recipes->recentlyCookedIds($userId, $now - 7 * 86400));
        $recipeIngredientMap = $this->recipes->ingredientIdsForAll();
        $diet = $this->users->dietFor($userId);
        $recipes = $this->recipes->all($userId, $groupId);
        $ranked = [];
        foreach ($recipes as $r) {
            // Enforce the user's dietary profile before ranking, so the hero pick + grid are safe.
            if ($diet) {
                $passes = true;
                foreach ($diet as $d) {
                    if (empty($r['diet'][$d])) {
                        $passes = false;
                        break;
                    }
                }
                if (!$passes) continue;
            }
            $ings = $recipeIngredientMap[$r['id']] ?? [];
            $have = array_filter($ings, fn ($id) => isset($pantryIds[$id]));
            $missing = array_values(array_diff($ings, $have));
            $expiring = array_filter($ings, fn ($id) => isset($expiringIds[$id]));
            $pct = count($ings) ? count($have) / count($ings) : 0;
            $score = $pct * 100 + count($expiring) * 20;
            if (isset($recentlyCooked[$r['id']])) $score -= 30;
            $ranked[] = [
                'recipe' => $r,
                'pantry_match' => $pct,
                'have_ingredient_ids' => array_values($have),
                'missing_ingredient_ids' => $missing,
                'expiring_hits' => count($expiring),
                'score' => $score,
            ];
        }
        usort($ranked, fn ($a, $b) => $b['score'] <=> $a['score']);
        return Json::send($res, ['ranked' => $ranked]);
    }
}
