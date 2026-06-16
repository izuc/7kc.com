<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class DeleteUserAction
{
    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $this->users->deleteAccount($userId);
        return Json::send($res, ['ok' => true]);
    }
}
