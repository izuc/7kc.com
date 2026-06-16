<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Support\Parser;

final class ParserTest extends TestCase
{
    private function seed(): void
    {
        foreach ([
            ['milk', 'Milk', 'dairy'],
            ['soy_sauce', 'Soy sauce', 'pantry'],
            ['frozen_peas', 'Frozen peas', 'frozen'],
            ['tomato', 'Tomatoes', 'produce'],
            ['bananas', 'Bananas', 'produce'],
            ['chicken_breast', 'Chicken breast', 'meat'],
        ] as [$id, $display, $section]) {
            $this->db->insert('ingredients', [
                'id' => $id, 'display' => $display, 'section' => $section,
                'shelf_life_days' => 7, 'aliases_json' => '[]',
            ]);
        }
    }

    public function testExactMatchIsConfident(): void
    {
        $this->seed();
        $m = (new Parser($this->db))->match('milk');
        $this->assertNotNull($m);
        $this->assertSame('milk', $m['id']);
        $this->assertSame('confident', $m['confidence']);
    }

    public function testSharedWordDoesNotProduceConfidentWrongMatch(): void
    {
        $this->seed();
        $m = (new Parser($this->db))->match('tomato sauce');
        // Must never confidently resolve to soy sauce just because both contain "sauce".
        $this->assertTrue($m === null || $m['confidence'] !== 'confident' || $m['id'] !== 'soy_sauce');
        if ($m !== null) {
            $this->assertNotSame('soy_sauce', $m['id']);
        }
    }

    public function testFrozenPizzaDoesNotMatchFrozenPeas(): void
    {
        $this->seed();
        $m = (new Parser($this->db))->match('frozen pizza');
        $this->assertTrue($m === null || $m['id'] !== 'frozen_peas');
    }

    public function testQuantityAndNoiseStripped(): void
    {
        $this->seed();
        $items = (new Parser($this->db))->parse('2 chicken breasts');
        $this->assertCount(1, $items);
        $this->assertNotNull($items[0]['match']);
        $this->assertSame('chicken_breast', $items[0]['match']['id']);
    }
}
