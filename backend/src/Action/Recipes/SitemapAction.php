<?php
declare(strict_types=1);

namespace SevenKC\Action\Recipes;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final class SitemapAction
{
    public function __construct(private readonly Connection $db) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $origin = $req->getUri()->getScheme() . '://' . $req->getUri()->getHost();
        if ($req->getUri()->getPort()) $origin .= ':' . $req->getUri()->getPort();
        $base = rtrim($_ENV['PUBLIC_WEB_ORIGIN'] ?? $origin, '/');

        $rows = $this->db->fetchAllAssociative(
            'SELECT slug FROM recipes WHERE is_custom = 0 ORDER BY slug'
        );

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach (['/', '/recipes', '/lists', '/pantry'] as $path) {
            $xml .= "  <url><loc>" . htmlspecialchars($base . $path) . "</loc><changefreq>weekly</changefreq></url>\n";
        }
        foreach ($rows as $r) {
            $xml .= "  <url><loc>" . htmlspecialchars($base . '/recipes/' . $r['slug']) . "</loc><changefreq>monthly</changefreq></url>\n";
        }
        $xml .= '</urlset>';

        $res->getBody()->write($xml);
        return $res->withHeader('Content-Type', 'application/xml');
    }
}
