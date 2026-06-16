<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class SeedRetailers extends AbstractSeed
{
    public function run(): void
    {
        $existing = $this->getAdapter()->fetchRow('SELECT COUNT(*) AS c FROM retailers');
        if ((int)($existing['c'] ?? 0) > 0) return;

        // Source of truth lives in the repo as data, like ingredients/recipes/aliases.
        $rows = json_decode((string)file_get_contents(dirname(__DIR__, 3) . '/shared/retailers.json'), true);
        if ($rows) $this->table('retailers')->insert($rows)->save();
    }
}
