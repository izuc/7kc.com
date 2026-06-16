<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\RecipeRepository;

final class RecipeRepositoryTest extends TestCase
{
    private function seedRecipe(string $id, string $slug, bool $custom, ?string $owner): void
    {
        $this->db->insert('recipes', [
            'id' => $id, 'slug' => $slug, 'title' => ucfirst($slug), 'description' => '',
            'prep_time' => 5, 'cook_time' => 5, 'servings' => 2, 'tags_json' => '[]', 'palette_json' => '[]',
            'source' => null, 'image_url' => null, 'view_count' => 0,
            'is_custom' => $custom ? 1 : 0, 'owner_user_id' => $owner, 'group_id' => null, 'created_at' => 0,
        ]);
    }

    public function testSeededRecipeIsPublicAndVisibleToAll(): void
    {
        $this->seedRecipe('r1', 'aglio', false, null);
        $repo = new RecipeRepository($this->db);
        $this->assertNotNull($repo->findPublicBySlug('aglio'));
        $this->assertNotNull($repo->findBySlugForUser('aglio', 'anyUser', null));
    }

    public function testPrivateCustomRecipeHiddenFromOthersAndPublic(): void
    {
        $this->seedRecipe('r2', 'secret', true, 'ownerX');
        $repo = new RecipeRepository($this->db);
        $this->assertNotNull($repo->findBySlugForUser('secret', 'ownerX', null), 'owner sees their own custom recipe');
        $this->assertNull($repo->findBySlugForUser('secret', 'intruder', null), 'others must not see a private custom recipe');
        $this->assertNull($repo->findPublicBySlug('secret'), 'custom recipes are never public');
    }

    public function testGroupSharedCustomVisibleToGroup(): void
    {
        $this->db->insert('recipes', [
            'id' => 'r3', 'slug' => 'house-curry', 'title' => 'Curry', 'description' => '',
            'prep_time' => 5, 'cook_time' => 5, 'servings' => 2, 'tags_json' => '[]', 'palette_json' => '[]',
            'source' => null, 'image_url' => null, 'view_count' => 0,
            'is_custom' => 1, 'owner_user_id' => 'ownerX', 'group_id' => 'grp1', 'created_at' => 0,
        ]);
        $repo = new RecipeRepository($this->db);
        $this->assertNotNull($repo->findBySlugForUser('house-curry', 'someoneElse', 'grp1'));
        $this->assertNull($repo->findBySlugForUser('house-curry', 'someoneElse', 'grp2'));
    }
}
