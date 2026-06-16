<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\GroupRepository;

final class GroupFeedTest extends TestCase
{
    private function event(string $groupId, string $userId, int $createdAt): void
    {
        $this->db->insert('group_feed_events', [
            'id' => bin2hex(random_bytes(8)),
            'group_id' => $groupId,
            'user_id' => $userId,
            'kind' => 'list_item_added',
            'payload_json' => '{}',
            'created_at' => $createdAt,
        ]);
    }

    public function testUnreadCountsOnlyNewerEventsFromOthers(): void
    {
        $repo = new GroupRepository($this->db);
        $g = 'group-1';
        $me = 'user-me';
        $other = 'user-other';

        $this->event($g, $other, 100); // before last-seen → read
        $this->event($g, $other, 200); // after  → unread
        $this->event($g, $other, 300); // after  → unread
        $this->event($g, $me, 250);    // my own action → never unread

        // last seen at t=150
        $this->assertSame(2, $repo->unreadCount($g, $me, 150));
        // caught up
        $this->assertSame(0, $repo->unreadCount($g, $me, 300));
        // never seen
        $this->assertSame(3, $repo->unreadCount($g, $me, 0));
    }

    public function testUnreadIgnoresOtherGroups(): void
    {
        $repo = new GroupRepository($this->db);
        $this->event('group-1', 'user-other', 200);
        $this->event('group-2', 'user-other', 200);
        $this->assertSame(1, $repo->unreadCount('group-1', 'user-me', 0));
    }
}
