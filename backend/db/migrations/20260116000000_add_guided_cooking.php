<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Guided-cooking layer. Recipes gain kitchen-context fields (difficulty,
 * equipment, make-ahead / storage / leftovers notes, substitutions) and steps
 * gain a short title plus structured tips / warnings / per-step ingredient
 * ids — everything Cook Mode needs to walk a beginner through a dish.
 */
final class AddGuidedCooking extends AbstractMigration
{
    public function change(): void
    {
        $this->table('recipes')
            ->addColumn('difficulty', 'string', ['limit' => 8, 'null' => true, 'after' => 'servings'])
            ->addColumn('equipment_json', 'text', ['null' => true, 'after' => 'difficulty'])
            ->addColumn('make_ahead', 'text', ['null' => true, 'after' => 'equipment_json'])
            ->addColumn('storage', 'text', ['null' => true, 'after' => 'make_ahead'])
            ->addColumn('leftovers', 'text', ['null' => true, 'after' => 'storage'])
            ->addColumn('substitutions_json', 'text', ['null' => true, 'after' => 'leftovers'])
            ->update();

        $this->table('recipe_steps')
            ->addColumn('title', 'string', ['limit' => 80, 'null' => true, 'after' => 'sort_order'])
            ->addColumn('tips_json', 'text', ['null' => true, 'after' => 'timer_seconds'])
            ->addColumn('warnings_json', 'text', ['null' => true, 'after' => 'tips_json'])
            ->addColumn('ingredient_ids_json', 'text', ['null' => true, 'after' => 'warnings_json'])
            ->update();
    }
}
