<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;
use SevenKC\Support\RateLimiter;
use SevenKC\Support\RecipeImporter;

final class ImportRecipeAction
{
    public function __construct(
        private readonly RecipeImporter $importer,
        private readonly RateLimiter $limiter,
    ) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $ip = RateLimiter::clientIp($req);
        if (($retry = $this->limiter->check("import:ip:$ip", 10, 60)) !== null) {
            return RateLimiter::tooMany($res, $retry);
        }

        $body = (array)($req->getParsedBody() ?? []);
        $url = trim((string)($body['url'] ?? ''));
        if ($url === '') {
            return Json::error($res, 'bad_request', 'A recipe URL is required.', 400);
        }

        try {
            $draft = $this->importer->import($url);
        } catch (\RuntimeException $e) {
            return Json::error($res, 'import_failed', $e->getMessage(), 422);
        }

        if (trim((string)$draft['title']) === '' || $draft['ingredients'] === []) {
            return Json::error($res, 'import_failed', "We found a recipe but couldn't read its title or ingredients.", 422);
        }

        return Json::send($res, ['draft' => $draft]);
    }
}
