<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class Phase5SeoAndSponsors extends AbstractMigration
{
    public function change(): void
    {
        $this->table('recipes')
            ->addColumn('sponsored_by', 'string', ['limit' => 120, 'null' => true, 'after' => 'image_url'])
            ->addColumn('sponsored_url', 'string', ['limit' => 400, 'null' => true, 'after' => 'sponsored_by'])
            ->addColumn('view_count', 'integer', ['default' => 0, 'after' => 'created_at'])
            ->update();

        // retailer config for affiliate links (e.g. Woolies, Coles, Amazon Fresh)
        $this->table('retailers', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 40, 'null' => false])
            ->addColumn('display', 'string', ['limit' => 80, 'null' => false])
            ->addColumn('region', 'string', ['limit' => 8, 'default' => 'AU'])
            ->addColumn('basket_url_template', 'string', ['limit' => 500, 'null' => false])
            ->addColumn('affiliate_id', 'string', ['limit' => 120, 'null' => true])
            ->addColumn('enabled', 'boolean', ['default' => true])
            ->addColumn('sort_order', 'integer', ['default' => 0])
            ->create();
    }
}
