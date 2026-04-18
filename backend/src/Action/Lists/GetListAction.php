<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Infrastructure\Http\Json;

final class GetListAction
{
    public function __construct(private readonly ShoppingListRepository $lists) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $list = $this->lists->findWithItems($args['id']);
        if (!$list) return Json::error($res, 'not_found', 'List not found', 404);
        return Json::send($res, ['list' => $list]);
    }
}
