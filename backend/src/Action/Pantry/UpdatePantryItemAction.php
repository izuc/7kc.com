<?php
declare(strict_types=1);

namespace SevenKC\Action\Pantry;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Infrastructure\Http\Json;

final class UpdatePantryItemAction
{
    public function __construct(private readonly PantryRepository $pantry) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $body = (array)($req->getParsedBody() ?? []);
        $this->pantry->update($args['id'], $body);
        return Json::send($res, ['item' => $this->pantry->find($args['id'])]);
    }
}
