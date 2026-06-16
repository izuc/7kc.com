<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Infrastructure\Http\Json;

final class ClearMealPlanAction
{
    public function __construct(private readonly MealPlanRepository $plan) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $params = $req->getQueryParams();
        $date = trim((string)($params['date'] ?? ''));
        if (!MealPlanDates::isValid($date)) {
            return Json::error($res, 'bad_request', 'A valid date (YYYY-MM-DD) is required.', 400);
        }
        $this->plan->clearSlot($userId, $date);
        return Json::send($res, ['ok' => true]);
    }
}
