<?php
declare(strict_types=1);

namespace SevenKC\Action\Pantry;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\IngredientRepository;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

/**
 * One-tap "stock common staples" so a new user's pantry isn't empty and recipe
 * suggestions rank from minute one. Only adds staples present in the dictionary
 * and not already stocked, so it's safe to call repeatedly.
 */
final class SeedStaplesAction
{
    private const STAPLES = [
        'garlic', 'olive_oil', 'salt', 'pepper', 'eggs', 'butter', 'milk',
        'flour', 'pasta', 'tomato', 'bread', 'carrot', 'potato', 'onion', 'rice',
    ];

    public function __construct(
        private readonly PantryRepository $pantry,
        private readonly IngredientRepository $ingredients,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);

        $have = [];
        foreach ($this->pantry->forUser($userId, $groupId) as $p) {
            if ($p['ingredient_id']) $have[$p['ingredient_id']] = true;
        }

        $added = 0;
        foreach (self::STAPLES as $id) {
            if (isset($have[$id])) continue;
            if (!$this->ingredients->find($id)) continue;
            $expires = time() + $this->ingredients->shelfLife($id) * 86400;
            $this->pantry->add($userId, $groupId, $id, null, $expires, false);
            $added++;
        }

        return Json::send($res, [
            'added' => $added,
            'items' => $this->pantry->forUser($userId, $groupId),
        ]);
    }
}
