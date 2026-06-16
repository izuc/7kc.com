<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddRecipeIngredientIndex extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('recipe_ingredients');
        if (!$table->hasIndex(['ingredient_id'])) {
            $table->addIndex(['ingredient_id'])->update();
        }
    }
}
