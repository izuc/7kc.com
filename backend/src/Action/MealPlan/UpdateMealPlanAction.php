<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

/** Replace one planned meal's recipe and/or label (owner-scoped by id). */
final class UpdateMealPlanAction
{
    public function __construct(
        private readonly MealPlanRepository $plan,
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $body = (array)($req->getParsedBody() ?? []);
        $id = (string)($args['id'] ?? '');

        $meal = MealPayload::resolve($body, $this->recipes, $userId, $groupId);
        if (isset($meal['error'])) {
            return Json::error($res, $meal['status'] === 404 ? 'not_found' : 'bad_request', $meal['error'], $meal['status']);
        }

        if (!$this->plan->updateEntry($userId, $id, $meal['recipe_id'], $meal['recipe_title'], $meal['label'])) {
            return Json::error($res, 'not_found', 'Planned meal not found', 404);
        }
        $summary = $meal['recipe_id'] ? ($this->recipes->summariesByIds([$meal['recipe_id']])[$meal['recipe_id']] ?? null) : null;

        return Json::send($res, [
            'entry' => [
                'id' => $id,
                'label' => $meal['label'],
                'recipe_id' => $meal['recipe_id'],
                'recipe_title' => $meal['recipe_title'],
                'recipe' => $summary,
            ],
        ]);
    }
}
