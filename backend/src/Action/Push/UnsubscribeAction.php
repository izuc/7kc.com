<?php
declare(strict_types=1);

namespace SevenKC\Action\Push;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PushSubscriptionRepository;
use SevenKC\Infrastructure\Http\Json;

final class UnsubscribeAction
{
    public function __construct(private readonly PushSubscriptionRepository $subs) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $body = (array)($req->getParsedBody() ?? []);
        $endpoint = trim((string)($body['endpoint'] ?? ''));
        if ($endpoint === '') {
            return Json::error($res, 'bad_request', 'An endpoint is required.', 400);
        }
        // Scoped to the caller — can't drop someone else's subscription.
        $this->subs->deleteForUserByEndpoint($userId, $endpoint);
        return Json::send($res, ['ok' => true]);
    }
}
