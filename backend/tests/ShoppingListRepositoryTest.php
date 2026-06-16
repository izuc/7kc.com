<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\ShoppingListRepository;

final class ShoppingListRepositoryTest extends TestCase
{
    private function repo(): ShoppingListRepository
    {
        return new ShoppingListRepository($this->db);
    }

    public function testOwnerCanAccessButOtherUserCannot(): void
    {
        $repo = $this->repo();
        $id = $repo->create('userA', null, 'Weekly');
        $this->assertNotNull($repo->findForUser($id, 'userA', null));
        // BOLA guard: a different user must not be able to resolve the list.
        $this->assertNull($repo->findForUser($id, 'userB', null));
    }

    public function testGroupMemberCanAccessSharedList(): void
    {
        $repo = $this->repo();
        $id = $repo->create('userA', 'grp1', 'Shared');
        $this->assertNotNull($repo->findForUser($id, 'userB', 'grp1'));
        $this->assertNull($repo->findForUser($id, 'userB', 'grp2'));
    }

    public function testItemListIdResolves(): void
    {
        $repo = $this->repo();
        $listId = $repo->create('userA', null, 'L');
        $itemId = $repo->addItem($listId, 'userA', 'milk', null, 'dairy');
        $this->assertSame($listId, $repo->itemListId($itemId));
        $this->assertNull($repo->itemListId('nope'));
    }
}
