<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class MarkFeedSeenAction
{
    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $this->users->markFeedSeen($userId, time());
        return Json::send($res, ['ok' => true]);
    }
}
