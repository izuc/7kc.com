<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRecipeFavourites extends AbstractMigration
{
    public function change(): void
    {
        $this->table('recipe_favourites', ['id' => false, 'primary_key' => ['user_id', 'recipe_id']])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex(['user_id'])
            ->create();
    }
}
