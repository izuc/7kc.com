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
        // Atomic increment (single locked statement on MariaDB + SQLite) avoids the
        // lost-update race a read-modify-write SELECT+UPDATE has — parallel requests
        // can't all read the same stale count and each write count+1. The window guard
        // skips a window a concurrent request just reset via REPLACE.
        $this->db->executeStatement(
            'UPDATE rate_limits SET count = count + 1 WHERE bucket = ? AND window_start = ?',
            [$bucket, (int)$row['window_start']]
        );
        $count = (int)$this->db->fetchOne('SELECT count FROM rate_limits WHERE bucket = ?', [$bucket]);
        if ($count > $limit) {
            return ((int)$row['window_start'] + $windowSec) - $now;
        }
        return null;
    }

    public static function clientIp(ServerRequestInterface $req): string
    {
        // Never trust a client-supplied X-Forwarded-For unless the direct peer is a
        // configured trusted proxy — otherwise per-IP limits are bypassable by rotating
        // a forged header. With TRUSTED_PROXIES unset (default), key strictly on REMOTE_ADDR.
        $remote = (string)($req->getServerParams()['REMOTE_ADDR'] ?? '');
        $trusted = array_values(array_filter(array_map('trim', explode(',', (string)($_ENV['TRUSTED_PROXIES'] ?? '')))));
        if ($remote !== '' && in_array($remote, $trusted, true)) {
            $xff = $req->getHeaderLine('X-Forwarded-For');
            if ($xff !== '') {
                $hops = array_map('trim', explode(',', $xff));
                // Walk right-to-left; the first hop that isn't one of our trusted proxies
                // is the real client (left-most entries are attacker-controllable).
                for ($i = count($hops) - 1; $i >= 0; $i--) {
                    if ($hops[$i] !== '' && !in_array($hops[$i], $trusted, true)) {
                        return $hops[$i];
                    }
                }
            }
        }
        return $remote !== '' ? $remote : 'unknown';
    }

    public static function tooMany(ResponseInterface $res, int $retry): ResponseInterface
    {
        return Json::error($res, 'rate_limited', 'Too many attempts — please wait a moment.', 429)
            ->withHeader('Retry-After', (string)max(1, $retry));
    }
}
