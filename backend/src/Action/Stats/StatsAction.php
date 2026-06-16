<?php
declare(strict_types=1);

namespace SevenKC\Action\Stats;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;

/**
 * This-month "waste & savings": items rescued (used up by cooking, from
 * cooked_meals.removed_pantry_json) vs tossed (logged on a 'Toss it'), and the
 * rescue rate. Delivers the "Waste nothing" payoff the brand promises.
 */
final class StatsAction
{
    public function __construct(private readonly Connection $db) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $monthStart = (int)(mktime(0, 0, 0, (int)date('n'), 1, (int)date('Y')) ?: 0);

        $rescued = 0;
        foreach ($this->db->fetchAllAssociative(
            'SELECT removed_pantry_json FROM cooked_meals WHERE user_id = ? AND cooked_at >= ?',
            [$userId, $monthStart]
        ) as $r) {
            $ids = json_decode((string)($r['removed_pantry_json'] ?? '[]'), true);
            if (is_array($ids)) $rescued += count($ids);
        }

        $tossed = (int)$this->db->fetchOne(
            'SELECT COUNT(*) FROM pantry_removals WHERE user_id = ? AND reason = ? AND removed_at >= ?',
            [$userId, 'tossed', $monthStart]
        );

        $total = $rescued + $tossed;
        return Json::send($res, ['stats' => [
            'rescued' => $rescued,
            'tossed' => $tossed,
            'rescue_rate' => $total > 0 ? (int)round($rescued / $total * 100) : null,
            'since' => $monthStart,
        ]]);
    }
}
