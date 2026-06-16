<?php
declare(strict_types=1);

namespace SevenKC\Action\Groups;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\GroupRepository;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class CommentSuggestionAction
{
    public function __construct(
        private readonly GroupRepository $groups,
        private readonly UserRepository $users,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res, array $args): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $groupId = $this->users->groupIdFor($userId);
        if (!$groupId) return Json::error($res, 'forbidden', 'Not in a group', 403);
        $sug = $this->groups->findSuggestion($args['id']);
        if (!$sug || $sug['group_id'] !== $groupId) {
            return Json::error($res, 'not_found', 'Suggestion not found', 404);
        }
        $body = (array)($req->getParsedBody() ?? []);
        $content = trim((string)($body['content'] ?? ''));
        if ($content === '') return Json::error($res, 'bad_request', 'Content required', 400);
        $id = $this->groups->addComment($args['id'], $userId, $content);
        $this->groups->pushEvent($groupId, $userId, 'comment', [
            'suggestion_id' => $args['id'],
            'content' => $content,
        ]);
        return Json::send($res, ['comment_id' => $id]);
    }
}
