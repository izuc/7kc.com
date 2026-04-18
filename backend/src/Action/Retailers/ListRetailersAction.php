<?php
declare(strict_types=1);

namespace SevenKC\Action\Retailers;

use Doctrine\DBAL\Connection;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use SevenKC\Infrastructure\Http\Json;

/**
 * Returns enabled retailers + a basket URL pre-filled with ingredient names from the
 * current list. Frontend uses this to render "Order via Woolworths" style CTAs.
 */
final class ListRetailersAction
{
    public function __construct(private readonly Connection $db) {}

    public function __invoke(ServerRequestInterface $req, ResponseInterface $res): ResponseInterface
    {
        $rows = $this->db->fetchAllAssociative(
            'SELECT id, display, region, basket_url_template, affiliate_id FROM retailers WHERE enabled = 1 ORDER BY sort_order, display'
        );
        $params = $req->getQueryParams();
        $query = trim((string)($params['q'] ?? ''));

        $out = array_map(function ($r) use ($query) {
            $url = $r['basket_url_template'];
            $url = str_replace('{query}', rawurlencode($query), $url);
            if (!empty($r['affiliate_id'])) {
                $sep = str_contains($url, '?') ? '&' : '?';
                $url .= $sep . 'tag=' . rawurlencode($r['affiliate_id']);
            }
            return [
                'id' => $r['id'],
                'display' => $r['display'],
                'region' => $r['region'],
                'basket_url' => $url,
            ];
        }, $rows);

        return Json::send($res, ['retailers' => $out]);
    }
}
