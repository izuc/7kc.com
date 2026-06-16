<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;

/**
 * Public, no-auth unsubscribe landing for the weekly digest (email links carry no JWT).
 * Keyed by an unguessable per-user token; only ever flips the opt-in OFF. Always returns
 * the same 200 page regardless of token validity, so it's not an account-enumeration oracle.
 */
final class DigestUnsubscribeAction
{
    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $token = trim((string)($req->getQueryParams()['token'] ?? ''));
        if ($token !== '') {
            $user = $this->users->byUnsubscribeToken($token);
            if ($user) $this->users->setDigestOptin($user['id'], false);
        }

        $res->getBody()->write(
            '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<title>Unsubscribed · 7 Day Kitchen</title>'
            . '<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:12vh auto;padding:0 1.5rem;color:#2b2b2b;line-height:1.6}'
            . 'h1{font-size:1.4rem}</style></head><body>'
            . '<h1>You’re unsubscribed</h1>'
            . '<p>You will no longer receive the weekly use-it-up digest. You can re-enable it any time from Settings in 7 Day Kitchen.</p>'
            . '</body></html>'
        );
        return $res->withHeader('Content-Type', 'text/html; charset=utf-8');
    }
}
