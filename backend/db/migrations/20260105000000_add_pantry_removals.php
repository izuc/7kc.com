<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPantryRemovals extends AbstractMigration
{
    public function change(): void
    {
        $this->table('pantry_removals', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('ingredient_id', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('custom_name', 'string', ['limit' => 160, 'null' => true])
            ->addColumn('reason', 'string', ['limit' => 16, 'null' => false])
            ->addColumn('removed_at', 'integer', ['null' => false])
            ->addIndex(['user_id', 'removed_at'])
            ->create();
    }
}
