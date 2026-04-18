<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class InitialSchema extends AbstractMigration
{
    public function change(): void
    {
        $this->table('users', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('email', 'string', ['limit' => 191, 'null' => false])
            ->addColumn('password_hash', 'string', ['limit' => 255, 'null' => false])
            ->addColumn('display_name', 'string', ['limit' => 80, 'null' => true])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex('email', ['unique' => true])
            ->addIndex('group_id')
            ->create();

        $this->table('groups', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('name', 'string', ['limit' => 120, 'null' => false])
            ->addColumn('owner_user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('invite_token', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex('invite_token', ['unique' => true])
            ->create();

        $this->table('group_members', ['id' => false, 'primary_key' => ['group_id', 'user_id']])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('role', 'string', ['limit' => 16, 'default' => 'member'])
            ->addColumn('joined_at', 'integer', ['null' => false])
            ->addColumn('display_name', 'string', ['limit' => 80, 'null' => true])
            ->addColumn('color', 'string', ['limit' => 16, 'null' => true])
            ->create();

        $this->table('ingredients', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 64, 'null' => false])
            ->addColumn('display', 'string', ['limit' => 120, 'null' => false])
            ->addColumn('section', 'string', ['limit' => 20, 'null' => false])
            ->addColumn('shelf_life_days', 'integer', ['null' => false])
            ->addColumn('aliases_json', 'text', ['null' => true])
            ->create();

        $this->table('shopping_lists', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('owner_user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('name', 'string', ['limit' => 120, 'null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addColumn('archived_at', 'integer', ['null' => true])
            ->addIndex('owner_user_id')
            ->addIndex('group_id')
            ->create();

        $this->table('shopping_list_items', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('list_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('ingredient_id', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('custom_name', 'string', ['limit' => 160, 'null' => true])
            ->addColumn('section', 'string', ['limit' => 20, 'default' => 'other'])
            ->addColumn('note', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('is_bought', 'boolean', ['default' => false])
            ->addColumn('bought_by_user_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('bought_at', 'integer', ['null' => true])
            ->addColumn('added_by_user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('added_at', 'integer', ['null' => false])
            ->addColumn('moved_to_pantry', 'boolean', ['default' => false])
            ->addColumn('sort_order', 'integer', ['default' => 0])
            ->addIndex('list_id')
            ->create();

        $this->table('pantry_items', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('owner_user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('ingredient_id', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('custom_name', 'string', ['limit' => 160, 'null' => true])
            ->addColumn('added_at', 'integer', ['null' => false])
            ->addColumn('expires_at', 'integer', ['null' => true])
            ->addColumn('running_low', 'boolean', ['default' => false])
            ->addColumn('notes', 'string', ['limit' => 255, 'null' => true])
            ->addIndex('owner_user_id')
            ->addIndex('group_id')
            ->create();

        $this->table('recipes', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('slug', 'string', ['limit' => 160, 'null' => false])
            ->addColumn('title', 'string', ['limit' => 160, 'null' => false])
            ->addColumn('description', 'text', ['null' => true])
            ->addColumn('prep_time', 'integer', ['default' => 0])
            ->addColumn('cook_time', 'integer', ['default' => 0])
            ->addColumn('servings', 'integer', ['default' => 2])
            ->addColumn('tags_json', 'text', ['null' => true])
            ->addColumn('palette_json', 'text', ['null' => true])
            ->addColumn('source', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('image_url', 'string', ['limit' => 400, 'null' => true])
            ->addColumn('is_custom', 'boolean', ['default' => false])
            ->addColumn('owner_user_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex('slug', ['unique' => true])
            ->addIndex('owner_user_id')
            ->create();

        $this->table('recipe_ingredients', ['id' => false, 'primary_key' => ['recipe_id', 'sort_order']])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('sort_order', 'integer', ['null' => false])
            ->addColumn('ingredient_id', 'string', ['limit' => 64, 'null' => true])
            ->addColumn('amount_text', 'string', ['limit' => 120, 'null' => true])
            ->addColumn('is_optional', 'boolean', ['default' => false])
            ->create();

        $this->table('recipe_steps', ['id' => false, 'primary_key' => ['recipe_id', 'sort_order']])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('sort_order', 'integer', ['null' => false])
            ->addColumn('content', 'text', ['null' => false])
            ->addColumn('timer_seconds', 'integer', ['null' => true])
            ->create();

        $this->table('cooked_meals', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('cooked_at', 'integer', ['null' => false])
            ->addColumn('removed_pantry_json', 'text', ['null' => true])
            ->addIndex('user_id')
            ->addIndex('recipe_id')
            ->create();

        $this->table('meal_suggestions', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('suggested_by_user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('recipe_id', 'string', ['limit' => 36, 'null' => true])
            ->addColumn('recipe_title', 'string', ['limit' => 160, 'null' => false])
            ->addColumn('suggested_for_date', 'string', ['limit' => 20, 'null' => true])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addColumn('cooked_meal_id', 'string', ['limit' => 36, 'null' => true])
            ->addIndex('group_id')
            ->create();

        $this->table('suggestion_likes', ['id' => false, 'primary_key' => ['suggestion_id', 'user_id']])
            ->addColumn('suggestion_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->create();

        $this->table('suggestion_comments', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('suggestion_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('content', 'text', ['null' => false])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex('suggestion_id')
            ->create();

        $this->table('group_feed_events', ['id' => false, 'primary_key' => ['id']])
            ->addColumn('id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('group_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('user_id', 'string', ['limit' => 36, 'null' => false])
            ->addColumn('kind', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('payload_json', 'text', ['null' => true])
            ->addColumn('created_at', 'integer', ['null' => false])
            ->addIndex(['group_id', 'created_at'])
            ->create();
    }
}
