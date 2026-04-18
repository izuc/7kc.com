<?php
declare(strict_types=1);

namespace SevenKC\Action\Pantry;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Infrastructure\Http\Json;

final class DeletePantryItemAction
{
    public function __construct(private readonly PantryRepository $pantry) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $this->pantry->delete($args['id']);
        return Json::send($res, ['ok' => true]);
    }
}
