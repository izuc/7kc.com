<?php
declare(strict_types=1);

namespace SevenKC\Action\Ingredients;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Infrastructure\Http\Json;

/** Public: the ingredient dictionary + aliases, so the client can parse instantly/offline. */
final class DictionaryAction
{
    public function __construct(private readonly IngredientRepository $ingredients) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        return Json::send($res, $this->ingredients->dictionary());
    }
}
