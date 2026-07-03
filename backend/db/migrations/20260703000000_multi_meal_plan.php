<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * The planner originally allowed one meal per (owner, day) via a UNIQUE index.
 * Days now hold any number of meals — breakfast/lunch/dinner/snacks or none of
 * those labels at all — so the index becomes non-unique and each entry carries
 * an optional label plus a per-day sort position.
 */
final class MultiMealPlan extends AbstractMigration
{
    public function up(): void
    {
        $t = $this->table('meal_plan');
        $t->removeIndex(['owner_user_id', 'plan_date'])->update();
        $t->addColumn('meal_label', 'string', ['limit' => 40, 'null' => true, 'after' => 'plan_date'])
            ->addColumn('sort_order', 'integer', ['null' => false, 'default' => 0, 'after' => 'meal_label'])
            ->addIndex(['owner_user_id', 'plan_date'], ['unique' => false])
            ->update();
    }

    public function down(): void
    {
        // Keep only the first meal of each day, then restore the unique index.
        $this->execute(
            'DELETE FROM meal_plan WHERE id NOT IN (
                SELECT keep_id FROM (
                    SELECT MIN(id) AS keep_id FROM meal_plan GROUP BY owner_user_id, plan_date
                ) k
            )'
        );
        $t = $this->table('meal_plan');
        $t->removeIndex(['owner_user_id', 'plan_date'])->update();
        $t->removeColumn('meal_label')
            ->removeColumn('sort_order')
            ->addIndex(['owner_user_id', 'plan_date'], ['unique' => true])
            ->update();
    }
}
