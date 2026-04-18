<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Infrastructure\Http\Json;

final class DeleteListItemAction
{
    public function __construct(private readonly ShoppingListRepository $lists) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $this->lists->deleteItem($args['itemId']);
        return Json::send($res, ['ok' => true]);
    }
}
