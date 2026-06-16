<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPushSubscriptions extends AbstractMigration
{
    public function change(): void
    {
        // One row per browser push subscription. endpoint is the unique key (long
        // FCM/Apple URLs → 500 chars, under the InnoDB utf8mb4 unique-index byte cap).
        $this->table('push_subscriptions', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('endpoint', 'string', ['limit' => 500, 'null' => false])
            ->addColumn('p256dh', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('auth', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex('endpoint', ['unique' => true])
            ->addIndex('user_id')
            ->create();
    }
}
