<?php
declare(strict_types=1);

namespace SevenKC\Action\Ingredients;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Infrastructure\Http\Json;

final class ListIngredientsAction
{
    public function __construct(private readonly IngredientRepository $repo) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $q = trim((string)($req->getQueryParams()['q'] ?? ''));
        $items = $q !== '' ? $this->repo->search($q, 30) : $this->repo->all();
        return Json::send($res, ['items' => $items]);
    }
}
