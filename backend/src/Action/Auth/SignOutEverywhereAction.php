<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

/** Revoke every outstanding token for the current user (this device included). */
final class SignOutEverywhereAction
{
    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $this->users->bumpTokenVersion($userId);
        return Json::send($res, ['ok' => true]);
    }
}
