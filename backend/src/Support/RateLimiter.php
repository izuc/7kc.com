<?php
declare(strict_types=1);

namespace SevenKC\Support;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;

/**
 * Simple DB-backed fixed-window rate limiter (works on both MySQL and SQLite).
 * Per-FPM-worker stores like APCu don't fit this shared-nothing stack, so a tiny
 * table is the pragmatic choice at this scale.
 */
final class RateLimiter
{
    public function __construct(private readonly Connection $db) {}

    /** Returns null if allowed, or the Retry-After seconds if the bucket is over its limit. */
    public function check(string $bucket, int $limit, int $windowSec): ?int
    {
        $now = time();
        $row = $this->db->fetchAssociative('SELECT count, window_start FROM rate_limits WHERE bucket = ?', [$bucket]);
        if (!$row || ((int)$row['window_start'] + $windowSec) <= $now) {
            $this->db->executeStatement(
                'REPLACE INTO rate_limits (bucket, count, window_start) VALUES (?, 1, ?)',
                [$bucket, $now]
            );
            return null;
        }
        $count = (int)$row['count'] + 1;
        if ($count > $limit) {
            return ((int)$row['window_start'] + $windowSec) - $now;
        }
        $this->db->executeStatement('UPDATE rate_limits SET count = ? WHERE bucket = ?', [$count, $bucket]);
        return null;
    }

    public static function clientIp(ServerRequestInterface $req): string
    {
        $xff = $req->getHeaderLine('X-Forwarded-For');
        if ($xff !== '') {
            $first = trim(explode(',', $xff)[0]);
            if ($first !== '') return $first;
        }
        return (string)($req->getServerParams()['REMOTE_ADDR'] ?? 'unknown');
    }

    public static function tooMany(ResponseInterface $res, int $retry): ResponseInterface
    {
        return Json::error($res, 'rate_limited', 'Too many attempts — please wait a moment.', 429)
            ->withHeader('Retry-After', (string)max(1, $retry));
    }
}
