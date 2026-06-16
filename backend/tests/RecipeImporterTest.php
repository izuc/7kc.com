<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Support\Parser;
use SevenKC\Support\RecipeImporter;

final class RecipeImporterTest extends TestCase
{
    private function importer(): RecipeImporter
    {
        foreach ([
            ['flour', 'Flour', 'pantry'],
            ['spaghetti', 'Spaghetti', 'pantry'],
            ['garlic', 'Garlic', 'produce'],
            ['olive_oil', 'Olive oil', 'pantry'],
            ['parmesan', 'Parmesan', 'dairy'],
        ] as [$id, $display, $section]) {
            $this->db->insert('ingredients', [
                'id' => $id, 'display' => $display, 'section' => $section,
                'shelf_life_days' => 30, 'aliases_json' => '[]',
            ]);
        }
        return new RecipeImporter(new Parser($this->db));
    }

    private const HTML = <<<'HTML'
    <html><head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {"@type": "WebPage", "name": "ignore me"},
        {
          "@type": "Recipe",
          "name": "Garlic Spaghetti",
          "description": "A quick weeknight pasta.",
          "prepTime": "PT10M",
          "cookTime": "PT15M",
          "recipeYield": "4 servings",
          "image": {"url": "https://img.example/pasta.jpg"},
          "recipeIngredient": ["400g spaghetti", "4 cloves garlic", "60ml olive oil", "grated parmesan"],
          "recipeInstructions": [
            {"@type": "HowToStep", "text": "Boil the spaghetti until al dente."},
            {"@type": "HowToStep", "text": "Soften the garlic in the olive oil."}
          ]
        }
      ]
    }
    </script></head><body>...</body></html>
    HTML;

    public function testExtractsRecipeFromJsonLd(): void
    {
        $d = $this->importer()->parseHtml(self::HTML, 'https://example.com/pasta');
        $this->assertSame('Garlic Spaghetti', $d['title']);
        $this->assertSame('A quick weeknight pasta.', $d['description']);
        $this->assertSame(10, $d['prep_time']);
        $this->assertSame(15, $d['cook_time']);
        $this->assertSame(4, $d['servings']);
        $this->assertSame('https://img.example/pasta.jpg', $d['image_url']);
        $this->assertSame('https://example.com/pasta', $d['source']);
        $this->assertCount(4, $d['ingredients']);
        $this->assertCount(2, $d['steps']);
        $this->assertSame('Boil the spaghetti until al dente.', $d['steps'][0]['content']);
    }

    public function testIngredientLinesAreMatchedToTheDictionary(): void
    {
        $d = $this->importer()->parseHtml(self::HTML, 'https://example.com/pasta');
        $byRaw = [];
        foreach ($d['ingredients'] as $ing) {
            $byRaw[$ing['raw']] = $ing['match']['id'] ?? null;
        }
        $this->assertSame('spaghetti', $byRaw['400g spaghetti']);
        $this->assertSame('garlic', $byRaw['4 cloves garlic']);
        $this->assertSame('olive_oil', $byRaw['60ml olive oil']);
    }

    public function testParsesIsoDurationWithHoursAndMinutes(): void
    {
        $html = str_replace('"PT15M"', '"PT1H30M"', self::HTML);
        $d = $this->importer()->parseHtml($html, 'https://example.com/pasta');
        $this->assertSame(90, $d['cook_time']);
    }

    public function testThrowsWhenNoRecipeData(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->importer()->parseHtml('<html><body>no structured data here</body></html>', 'https://example.com/x');
    }

    public function testRejectsNonHttpScheme(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('http(s)');
        $this->importer()->import('ftp://example.com/recipe');
    }

    public function testRejectsLoopbackAddress(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('private or local');
        $this->importer()->import('http://127.0.0.1/recipe');
    }

    public function testRejectsLinkLocalAddress(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('private or local');
        // 169.254.169.254 — the classic cloud metadata SSRF target.
        $this->importer()->import('http://169.254.169.254/latest/meta-data/');
    }

    public function testRejectsPrivateRangeAddress(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('private or local');
        $this->importer()->import('http://192.168.1.1/recipe');
    }
}
