<?php
declare(strict_types=1);

namespace SevenKC\Action\Lists;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\ShoppingListRepository;
use SevenKC\Infrastructure\Http\Json;

final class AddListItemsAction
{
    public function __construct(
        private readonly ShoppingListRepository $lists,
        private readonly IngredientRepository $ingredients,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $listId = $args['id'];
        if (!$this->lists->find($listId)) return Json::error($res, 'not_found', 'List not found', 404);
        $body = (array)($req->getParsedBody() ?? []);
        $items = $body['items'] ?? [];
        $created = [];
        foreach ($items as $it) {
            $ingId = $it['ingredient_id'] ?? null;
            $custom = $it['custom_name'] ?? null;
            $section = $it['section'] ?? 'other';
            if ($ingId) {
                $ing = $this->ingredients->find($ingId);
                if ($ing) $section = $ing['section'];
            }
            if (!$ingId && !$custom) continue;
            $created[] = $this->lists->addItem($listId, $userId, $ingId, $custom, $section);
        }
        return Json::send($res, [
            'list' => $this->lists->findWithItems($listId),
            'added' => $created,
        ], 201);
    }
}
