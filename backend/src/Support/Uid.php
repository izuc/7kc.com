<?php
declare(strict_types=1);

namespace SevenKC\Support;

use Ramsey\Uuid\Uuid;

final class Uid
{
    public static function new(): string
    {
        return Uuid::uuid4()->toString();
    }

    public static function token(int $len = 24): string
    {
        return rtrim(strtr(base64_encode(random_bytes($len)), '+/', '-_'), '=');
    }
}
