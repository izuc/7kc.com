<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddUserTokenVersion extends AbstractMigration
{
    public function change(): void
    {
        // Bumping this invalidates every outstanding JWT for the user ("sign out
        // everywhere"). Default 0 so existing rows + already-issued (tv-less) tokens
        // stay valid until the user explicitly bumps it.
        $this->table('users')
            ->addColumn('token_version', 'integer', ['default' => 0, 'null' => false])
            ->update();
    }
}
