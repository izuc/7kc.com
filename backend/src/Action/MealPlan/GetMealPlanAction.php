<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Infrastructure\Http\Json;

final class GetMealPlanAction
{
    public function __construct(
        private readonly MealPlanRepository $plan,
        private readonly RecipeRepository $recipes,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $params = $req->getQueryParams();
        $start = MealPlanDates::validWeekStart($params['week_start'] ?? null);
        $end = MealPlanDates::addDays($start, 6);

        $rows = $this->plan->forRange($userId, $start, $end);
        $summaries = $this->recipes->summariesByIds(array_filter(array_column($rows, 'recipe_id')));

        $entries = array_map(fn ($r) => [
            'date' => $r['plan_date'],
            'recipe_id' => $r['recipe_id'],
            'recipe_title' => $r['recipe_title'],
            'recipe' => $r['recipe_id'] ? ($summaries[$r['recipe_id']] ?? null) : null,
        ], $rows);

        return Json::send($res, ['week_start' => $start, 'entries' => $entries]);
    }
}
