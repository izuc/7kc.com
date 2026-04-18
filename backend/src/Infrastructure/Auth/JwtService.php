<?php
declare(strict_types=1);

namespace SevenKC\Infrastructure\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService
{
    public function __construct(
        private readonly string $secret,
        private readonly string $alg,
        private readonly int $ttlHours
    ) {}

    public function issue(string $userId, array $claims = []): string
    {
        $now = time();
        $payload = array_merge([
            'iat' => $now,
            'exp' => $now + $this->ttlHours * 3600,
            'sub' => $userId,
        ], $claims);
        return JWT::encode($payload, $this->secret, $this->alg);
    }

    public function verify(string $token): array
    {
        $decoded = JWT::decode($token, new Key($this->secret, $this->alg));
        return (array)$decoded;
    }
}
