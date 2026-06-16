<?php
declare(strict_types=1);

namespace SevenKC\Action\Auth;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

/** GDPR data export: a JSON bundle of everything tied to the account. */
final class ExportUserAction
{
    public function __construct(private readonly Connection $db) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $userId = (string)$req->getAttribute('user_id');
        $data = [
            'exported_at' => date('c'),
            'user' => $this->db->fetchAssociative('SELECT id, email, display_name, created_at FROM users WHERE id = ?', [$userId]),
            'shopping_lists' => $this->db->fetchAllAssociative('SELECT * FROM shopping_lists WHERE owner_user_id = ?', [$userId]),
            'shopping_list_items' => $this->db->fetchAllAssociative(
                'SELECT i.* FROM shopping_list_items i JOIN shopping_lists l ON l.id = i.list_id WHERE l.owner_user_id = ?',
                [$userId]
            ),
            'pantry_items' => $this->db->fetchAllAssociative('SELECT * FROM pantry_items WHERE owner_user_id = ?', [$userId]),
            'cooked_meals' => $this->db->fetchAllAssociative('SELECT * FROM cooked_meals WHERE user_id = ?', [$userId]),
            'favourites' => $this->db->fetchAllAssociative('SELECT recipe_id, created_at FROM recipe_favourites WHERE user_id = ?', [$userId]),
            'custom_recipes' => $this->db->fetchAllAssociative('SELECT * FROM recipes WHERE owner_user_id = ?', [$userId]),
        ];

        $res->getBody()->write((string)json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        return $res
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Content-Disposition', 'attachment; filename="7kc-export.json"');
    }
}
