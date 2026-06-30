<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use PHPUnit\Framework\TestCase as PHPUnitTestCase;
use SevenKC\Support\AiScanner;

final class AiScannerTest extends PHPUnitTestCase
{
    private function scanner(array $over = []): AiScanner
    {
        return new AiScanner(array_merge(
            ['endpoint' => 'http://localhost:1234/v1', 'model' => 'llava', 'api_key' => ''],
            $over
        ));
    }

    public function testIsConfiguredNeedsEndpointAndModel(): void
    {
        // configured = endpoint + model + curl available
        $this->assertSame(\function_exists('curl_init'), $this->scanner()->isConfigured());
        $this->assertFalse($this->scanner(['endpoint' => ''])->isConfigured());
        $this->assertFalse($this->scanner(['model' => ''])->isConfigured());
    }

    public function testCompletionsUrl(): void
    {
        $this->assertSame('http://x/v1/chat/completions', AiScanner::completionsUrl('http://x/v1'));
        $this->assertSame('http://x/v1/chat/completions', AiScanner::completionsUrl('http://x/v1/'));
        $this->assertSame('http://x/v1/chat/completions', AiScanner::completionsUrl('http://x/v1/chat/completions'));
    }

    public function testStripFences(): void
    {
        $this->assertSame("milk\neggs", AiScanner::stripFences("```\nmilk\neggs\n```"));
        $this->assertSame('milk', AiScanner::stripFences("```text\nmilk\n```"));
        $this->assertSame('milk', AiScanner::stripFences('  milk  '));
    }

    public function testPayloadCarriesTheImageAndModel(): void
    {
        $dataUrl = 'data:image/jpeg;base64,AAAABBBB';
        $payload = $this->scanner(['model' => 'qwen2-vl'])->buildPayload($dataUrl);

        $this->assertSame('qwen2-vl', $payload['model']);
        $parts = $payload['messages'][0]['content'];
        $image = null;
        $hasText = false;
        foreach ($parts as $part) {
            if (($part['type'] ?? '') === 'image_url') $image = $part;
            if (($part['type'] ?? '') === 'text') $hasText = true;
        }
        $this->assertNotNull($image, 'the payload includes an image part');
        $this->assertSame($dataUrl, $image['image_url']['url'], 'the image data URL is sent');
        $this->assertTrue($hasText, 'the payload includes the instruction text');
    }

    public function testTilesClampedToOneThroughFour(): void
    {
        $this->assertSame(1, $this->scanner()->tiles(), 'defaults to 1 when unset');
        $this->assertSame(1, $this->scanner(['tiles' => 0])->tiles());
        $this->assertSame(3, $this->scanner(['tiles' => 3])->tiles());
        $this->assertSame(4, $this->scanner(['tiles' => 9])->tiles(), 'clamped to 4');
    }

    public function testCleanItemStripsBulletsAndNumbering(): void
    {
        $this->assertSame('milk', AiScanner::cleanItem('- milk'));
        $this->assertSame('carrots', AiScanner::cleanItem('2. carrots'));
        $this->assertSame('cheddar cheese', AiScanner::cleanItem('• cheddar cheese'));
        $this->assertSame('', AiScanner::cleanItem('   '));
    }

    public function testMergeItemsDedupesAcrossTilesPreservingOrder(): void
    {
        // (fences are stripped per-tile in request() before mergeItems sees the text)
        $merged = AiScanner::mergeItems([
            "milk\ncarrots\n- eggs",
            "Carrots\nbutter\nmilk", // dup carrots (case-insensitive) + dup milk
            "cheese",
        ]);
        $this->assertSame(['milk', 'carrots', 'eggs', 'butter', 'cheese'], $merged);
    }
}
