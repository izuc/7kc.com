<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddMealPlan extends AbstractMigration
{
    public function change(): void
    {
        // One planned meal per (owner, day). plan_date is an ISO 'YYYY-MM-DD' string
        // so lexicographic range filters are correct. group_id is reserved for future
        // shared planning; today the planner is solo (scoped by owner).
        $this->table('meal_plan', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('owner_user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('plan_date', 'string', ['limit' => 20, 'null' => false])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('recipe_title', 'string', ['limit' => 160, 'null' => true])
            ->addColumn('created_at', 'integer', ['null' => false])
            // One planned meal per (owner, day) — enforced, so concurrent upserts can't dupe.
            ->addIndex(['owner_user_id', 'plan_date'], ['unique' => true])
            ->create();
    }
}
