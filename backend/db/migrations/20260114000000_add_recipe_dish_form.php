<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRecipeDishForm extends AbstractMigration
{
    public function change(): void
    {
        // Data-driven MealPlate artwork: a recipe declares its art form here instead
        // of needing a frontend registry edit. Nullable → falls back to the slug map.
        $this->table('recipes')
            ->addColumn('dish_form', 'string', ['limit' => 40, 'null' => true, 'default' => null])
            ->update();
    }
}
