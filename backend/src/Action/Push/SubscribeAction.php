<?php
declare(strict_types=1);

namespace SevenKC\Action\Push;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PushSubscriptionRepository;
use SevenKC\Infrastructure\Http\Json;

final class SubscribeAction
{
    public function __construct(private readonly PushSubscriptionRepository $subs) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $body = (array)($req->getParsedBody() ?? []);
        $sub = (array)($body['subscription'] ?? $body);

        $endpoint = trim((string)($sub['endpoint'] ?? ''));
        $keys = (array)($sub['keys'] ?? []);
        $p256dh = trim((string)($keys['p256dh'] ?? ''));
        $auth = trim((string)($keys['auth'] ?? ''));

        if ($endpoint === '' || $p256dh === '' || $auth === '') {
            return Json::error($res, 'bad_request', 'A complete push subscription is required.', 400);
        }
        // Match the column limit so a rare long endpoint is a clean 400, not a silent
        // truncation on MySQL (which would then never match the cron's prune-by-endpoint).
        if (strlen($endpoint) > 500) {
            return Json::error($res, 'bad_request', 'Push endpoint is too long.', 400);
        }

        $this->subs->upsertForUser($userId, $endpoint, $p256dh, $auth);
        return Json::send($res, ['ok' => true]);
    }
}
