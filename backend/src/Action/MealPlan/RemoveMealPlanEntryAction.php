<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\MealPlanRepository;
use SevenKC\Infrastructure\Http\Json;

/** Remove a single planned meal (owner-scoped by id). */
final class RemoveMealPlanEntryAction
{
    public function __construct(private readonly MealPlanRepository $plan) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $id = (string)($args['id'] ?? '');
        if (!$this->plan->removeEntry($userId, $id)) {
            return Json::error($res, 'not_found', 'Planned meal not found', 404);
        }
        return Json::send($res, ['ok' => true]);
    }
}
