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

    public function testSetBoughtIsIdempotent(): void
    {
        // The offline outbox may replay a setBought more than once; the explicit
        // target must converge regardless of how many times (or in what order) it lands.
        $repo = $this->repo();
        $listId = $repo->create('userA', null, 'L');
        $itemId = $repo->addItem($listId, 'userA', 'milk', null, 'dairy');

        $this->assertTrue($repo->setBought($itemId, 'userA', true));
        $this->assertTrue($repo->setBought($itemId, 'userA', true)); // replay → still bought
        $this->assertSame(1, (int)$this->db->fetchOne('SELECT is_bought FROM shopping_list_items WHERE id = ?', [$itemId]));

        $this->assertFalse($repo->setBought($itemId, 'userA', false));
        $row = $this->db->fetchAssociative('SELECT is_bought, bought_by_user_id, bought_at FROM shopping_list_items WHERE id = ?', [$itemId]);
        $this->assertSame(0, (int)$row['is_bought']);
        $this->assertNull($row['bought_by_user_id']);
        $this->assertNull($row['bought_at']);
    }

    public function testToggleStillFlips(): void
    {
        $repo = $this->repo();
        $listId = $repo->create('userA', null, 'L');
        $itemId = $repo->addItem($listId, 'userA', 'milk', null, 'dairy');
        $this->assertTrue($repo->toggleBought($itemId, 'userA'));
        $this->assertFalse($repo->toggleBought($itemId, 'userA'));
    }
}
