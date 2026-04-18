<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Infrastructure\Http\Json;

final class MarkAllBoughtAction
{
    public function __construct(private readonly ShoppingListRepository $lists) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $n = $this->lists->markAllBought($args['id'], $userId);
        return Json::send($res, ['marked' => $n]);
    }
}
