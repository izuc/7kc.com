<?php
declare(strict_types=1);

namespace SevenKC\Action\Pantry;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class AddPantryItemAction
{
    public function __construct(
        private readonly PantryRepository $pantry,
        private readonly IngredientRepository $ingredients,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $body = (array)($req->getParsedBody() ?? []);
        $ingId = $body['ingredient_id'] ?? null;
        $custom = $body['custom_name'] ?? null;
        if (!$ingId && !$custom) return Json::error($res, 'bad_request', 'ingredient_id or custom_name required', 400);

        $expires = isset($body['expires_at']) ? (int)$body['expires_at'] : null;
        if (!$expires && $ingId) {
            $expires = time() + $this->ingredients->shelfLife($ingId) * 86400;
        }
        $id = $this->pantry->add($userId, $groupId, $ingId, $custom, $expires, !empty($body['running_low']));
        return Json::send($res, ['item' => $this->pantry->find($id)], 201);
    }
}
