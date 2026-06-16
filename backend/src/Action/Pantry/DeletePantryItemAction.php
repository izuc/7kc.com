<?php
declare(strict_types=1);

namespace SevenKC\Action\Pantry;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\PantryRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class DeletePantryItemAction
{
    public function __construct(
        private readonly PantryRepository $pantry,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        $item = $this->pantry->findForUser($args['id'], $userId, $groupId);
        if (!$item) {
            return Json::error($res, 'not_found', 'Pantry item not found', 404);
        }
        // 'tossed' is logged for the waste stats; a plain remove (correcting a mistake) is not.
        $reason = (string)($req->getQueryParams()['reason'] ?? 'removed');
        if ($reason === 'tossed') {
            $this->pantry->logRemoval($userId, $groupId, $item['ingredient_id'], $item['custom_name'], 'tossed');
        }
        $this->pantry->delete($args['id']);
        return Json::send($res, ['ok' => true]);
    }
}
