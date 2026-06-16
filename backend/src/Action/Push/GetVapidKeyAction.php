<?php
declare(strict_types=1);

namespace SevenKC\Action\Push;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;

/** Returns the VAPID public key the browser needs to subscribe — or null when push isn't configured. */
final class GetVapidKeyAction
{
    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $key = (string)($_ENV['VAPID_PUBLIC_KEY'] ?? '');
        return Json::send($res, ['key' => $key !== '' ? $key : null]);
    }
}
