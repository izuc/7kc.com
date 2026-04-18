<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Adds a `detail` column to recipe_steps for longer, beginner-oriented
 * walkthrough text alongside the short at-a-glance content line.
 */
final class AddStepDetail extends AbstractMigration
{
    public function change(): void
    {
        $this->table('recipe_steps')
            ->addColumn('detail', 'text', ['null' => true, 'after' => 'content'])
            ->update();
    }
}
