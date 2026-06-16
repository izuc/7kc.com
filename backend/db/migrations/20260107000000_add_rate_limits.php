<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRateLimits extends AbstractMigration
{
    public function change(): void
    {
        $this->table('rate_limits', ['id' => false, 'primary_key' => ['bucket']])
            ->addColumn('bucket', 'string', ['limit' => 191, 'null' => false])
            ->addColumn('count', 'integer', ['default' => 0])
            ->addColumn('window_start', 'integer', ['null' => false])
            ->create();
    }
}
