<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class CreateRecipeAction
{
    public function __construct(
        private readonly RecipeRepository $recipes,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $body = (array)($req->getParsedBody() ?? []);
        if (empty($body['title'])) return Json::error($res, 'bad_request', 'Title required', 400);
        $groupId = !empty($body['share_with_group']) ? $this->users->groupIdFor($userId) : null;
        $id = $this->recipes->createCustom($userId, $groupId, $body);
        return Json::send($res, ['recipe' => $this->recipes->findById($id)], 201);
    }
}
