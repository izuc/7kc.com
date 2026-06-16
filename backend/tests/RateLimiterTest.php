<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Support\RateLimiter;

final class RateLimiterTest extends TestCase
{
    public function testAllowsUpToLimitThenBlocks(): void
    {
        $rl = new RateLimiter($this->db);
        for ($i = 1; $i <= 3; $i++) {
            $this->assertNull($rl->check('bucket', 3, 60), "hit $i should be allowed");
        }
        $retry = $rl->check('bucket', 3, 60);
        $this->assertNotNull($retry, 'the 4th hit is over the limit');
        $this->assertGreaterThan(0, $retry);
        $this->assertLessThanOrEqual(60, $retry);
    }

    public function testBucketsAreIndependent(): void
    {
        $rl = new RateLimiter($this->db);
        $this->assertNull($rl->check('a', 1, 60));
        $this->assertNotNull($rl->check('a', 1, 60));
        $this->assertNull($rl->check('b', 1, 60), 'a different bucket is unaffected');
    }
}
