<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddUserLastSeenFeed extends AbstractMigration
{
    public function change(): void
    {
        $this->table('users')
            ->addColumn('last_seen_feed_at', 'integer', ['null' => true])
            ->update();
    }
}
