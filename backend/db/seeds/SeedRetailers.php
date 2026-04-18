<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class SeedRetailers extends AbstractSeed
{
    public function run(): void
    {
        $existing = $this->getAdapter()->fetchRow('SELECT COUNT(*) AS c FROM retailers');
        if ((int)($existing['c'] ?? 0) > 0) return;

        $this->table('retailers')->insert([
            [
                'id' => 'woolworths',
                'display' => 'Woolworths',
                'region' => 'AU',
                'basket_url_template' => 'https://www.woolworths.com.au/shop/search/products?searchTerm={query}',
                'affiliate_id' => null,
                'enabled' => 1,
                'sort_order' => 1,
            ],
            [
                'id' => 'coles',
                'display' => 'Coles',
                'region' => 'AU',
                'basket_url_template' => 'https://www.coles.com.au/search?q={query}',
                'affiliate_id' => null,
                'enabled' => 1,
                'sort_order' => 2,
            ],
            [
                'id' => 'amazon_fresh',
                'display' => 'Amazon Fresh',
                'region' => 'INTL',
                'basket_url_template' => 'https://www.amazon.com/s?k={query}',
                'affiliate_id' => null,
                'enabled' => 0,
                'sort_order' => 3,
            ],
        ])->save();
    }
}
