<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Infrastructure\Http\Json;

final class ArchiveListAction
{
    public function __construct(private readonly ShoppingListRepository $lists) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        if (!$this->lists->find($args['id'])) return Json::error($res, 'not_found', 'List not found', 404);
        $this->lists->setArchived($args['id'], true);
        return Json::send($res, ['ok' => true]);
    }
}
