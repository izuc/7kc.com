<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddDigestOptin extends AbstractMigration
{
    public function change(): void
    {
        // Opt-OUT by default (transactional/opt-in guarantee). unsubscribe_token is a
        // per-user unguessable token, backfilled lazily on first opt-in.
        $this->table('users')
            ->addColumn('digest_optin', 'integer', ['default' => 0, 'null' => false])
            ->addColumn('unsubscribe_token', 'string', ['limit' => 64, 'null' => true, 'default' => null])
            ->update();
    }
}
