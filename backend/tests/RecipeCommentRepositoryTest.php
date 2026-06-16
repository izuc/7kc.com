<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use SevenKC\Domain\Repository\RecipeCommentRepository;

final class RecipeCommentRepositoryTest extends TestCase
{
    private function seedUser(string $id, ?string $name, string $email): void
    {
        $this->db->insert('users', ['id' => $id, 'email' => $email, 'display_name' => $name, 'created_at' => time()]);
    }

    private function insertAt(string $id, string $recipeId, string $userId, string $content, int $at): void
    {
        $this->db->insert('recipe_comments', [
            'id' => $id, 'recipe_id' => $recipeId, 'user_id' => $userId, 'content' => $content, 'created_at' => $at,
        ]);
    }

    public function testListNewestFirstWithAuthor(): void
    {
        $this->seedUser('u1', 'Sam', 's@x.test');
        $this->seedUser('u2', null, 'jordan@x.test');
        $this->insertAt('c1', 'r1', 'u1', 'Great with extra garlic.', 100);
        $this->insertAt('c2', 'r1', 'u2', 'Halved the chilli for the kids.', 200);
        $this->insertAt('c3', 'r2', 'u1', 'On a different recipe.', 150);

        $repo = new RecipeCommentRepository($this->db);
        $list = $repo->forRecipe('r1');
        $this->assertCount(2, $list);
        $this->assertSame('Halved the chilli for the kids.', $list[0]['content']); // newest first
        $this->assertSame('Sam', $list[1]['author']);
        $this->assertSame('jordan', $list[0]['author']); // no display_name → email local part, never the full email
        $this->assertSame(1, $repo->count('r2'));
    }

    public function testAddPersistsAComment(): void
    {
        $this->seedUser('u1', 'Sam', 's@x.test');
        $repo = new RecipeCommentRepository($this->db);
        $id = $repo->add('r1', 'u1', 'Made it tonight — delicious.');
        $this->assertSame('Made it tonight — delicious.', $repo->find($id)['content']);
        $this->assertSame(1, $repo->count('r1'));
    }

    public function testDeleteRemovesOnlyThatComment(): void
    {
        $this->seedUser('u1', 'Sam', 's@x.test');
        $repo = new RecipeCommentRepository($this->db);
        $id = $repo->add('r1', 'u1', 'first');
        $repo->add('r1', 'u1', 'second');

        $this->assertSame('u1', $repo->find($id)['user_id']);
        $repo->delete($id);
        $this->assertNull($repo->find($id));
        $this->assertCount(1, $repo->forRecipe('r1'));
    }
}
