<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRecipeComments extends AbstractMigration
{
    public function change(): void
    {
        // Public, per-recipe comments so cooks can share notes/tips on a dish.
        $this->table('recipe_comments', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('content', 'text', ['null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex(['recipe_id', 'created_at'])
            ->addIndex('user_id')
            ->create();
    }
}
