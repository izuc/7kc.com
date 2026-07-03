<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

/** Append a meal to a day — days hold as many meals as the user wants. */
final class AddMealPlanAction
{
    public function __construct(
        private readonly MealPlanRepository $plan,
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $body = (array)($req->getParsedBody() ?? []);

        $date = trim((string)($body['date'] ?? ''));
        if (!MealPlanDates::isValid($date)) {
            return Json::error($res, 'bad_request', 'A valid date (YYYY-MM-DD) is required.', 400);
        }

        $meal = MealPayload::resolve($body, $this->recipes, $userId, $groupId);
        if (isset($meal['error'])) {
            return Json::error($res, $meal['status'] === 404 ? 'not_found' : 'bad_request', $meal['error'], $meal['status']);
        }

        $id = $this->plan->addEntry($userId, $date, $meal['recipe_id'], $meal['recipe_title'], $meal['label']);
        $summary = $meal['recipe_id'] ? ($this->recipes->summariesByIds([$meal['recipe_id']])[$meal['recipe_id']] ?? null) : null;

        return Json::send($res, [
            'entry' => [
                'id' => $id,
                'date' => $date,
                'label' => $meal['label'],
                'recipe_id' => $meal['recipe_id'],
                'recipe_title' => $meal['recipe_title'],
                'recipe' => $summary,
            ],
        ]);
    }
}
