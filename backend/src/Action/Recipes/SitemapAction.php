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
        // Only crawlable, no-auth routes: the landing page and the public /r/<slug> recipe pages.
        $xml .= "  <url><loc>" . htmlspecialchars($base . '/') . "</loc><changefreq>weekly</changefreq></url>\n";
        foreach ($rows as $r) {
            $xml .= "  <url><loc>" . htmlspecialchars($base . '/r/' . $r['slug']) . "</loc><changefreq>monthly</changefreq></url>\n";
        }
        $xml .= '</urlset>';

        $res->getBody()->write($xml);
        return $res->withHeader('Content-Type', 'application/xml');
    }
}
