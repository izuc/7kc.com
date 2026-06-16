<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddUserDiet extends AbstractMigration
{
    public function change(): void
    {
        $this->table('users')
            ->addColumn('diet_json', 'text', ['null' => true])
            ->update();
    }
}
