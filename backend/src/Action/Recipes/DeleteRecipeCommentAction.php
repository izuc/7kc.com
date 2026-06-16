<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\RecipeCommentRepository;
use SevenKC\Infrastructure\Http\Json;

final class DeleteRecipeCommentAction
{
    public function __construct(private readonly RecipeCommentRepository $comments) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $comment = $this->comments->find((string)$args['id']);
        // Only the author can delete their own comment (404, not 403, to avoid leaking existence).
        if (!$comment || $comment['user_id'] !== $userId) {
            return Json::error($res, 'not_found', 'Comment not found', 404);
        }
        $this->comments->delete((string)$args['id']);
        return Json::send($res, ['ok' => true]);
    }
}
