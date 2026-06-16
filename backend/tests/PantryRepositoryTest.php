<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\PantryRepository;

final class PantryRepositoryTest extends TestCase
{
    public function testFindForUserScoping(): void
    {
        $repo = new PantryRepository($this->db);
        $id = $repo->add('userA', null, 'milk', null, null, false);
        $this->assertNotNull($repo->findForUser($id, 'userA', null));
        $this->assertNull($repo->findForUser($id, 'userB', null));
    }

    public function testAddOrRefreshDoesNotDuplicate(): void
    {
        $repo = new PantryRepository($this->db);
        $repo->add('userA', null, 'milk', null, null, true); // stocked + running low
        $repo->addOrRefresh('userA', null, 'milk', null, 999); // re-bought

        $milk = array_values(array_filter(
            $repo->forUser('userA', null),
            fn ($i) => $i['ingredient_id'] === 'milk'
        ));
        $this->assertCount(1, $milk, 're-buying a staple must not create a duplicate row');
        $this->assertFalse($milk[0]['running_low'], 'running_low cleared on refresh');
        $this->assertSame(999, $milk[0]['expires_at']);
    }

    public function testRunningLowReturnsOnlyFlagged(): void
    {
        $repo = new PantryRepository($this->db);
        $repo->add('userA', null, 'milk', null, null, true);
        $repo->add('userA', null, 'eggs', null, null, false);
        $low = $repo->runningLow('userA', null);
        $this->assertCount(1, $low);
        $this->assertSame('milk', $low[0]['ingredient_id']);
    }
}
