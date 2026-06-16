<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Domain\Repository\UserRepository;
use SevenKC\Infrastructure\Http\Json;

final class SetDietAction
{
    private const ALLOWED = ['vegetarian', 'vegan', 'dairy_free', 'gluten_free', 'nut_free'];

    public function __construct(private readonly UserRepository $users) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $body = (array)($req->getParsedBody() ?? []);
        $diet = array_values(array_intersect(
            array_filter((array)($body['diet'] ?? []), 'is_string'),
            self::ALLOWED
        ));
        $this->users->setDiet($userId, $diet);
        return Json::send($res, ['diet' => $diet]);
    }
}
