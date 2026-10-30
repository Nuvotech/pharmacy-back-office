<?php

declare(strict_types=1);

namespace App\Domain\Auth;

use App\Models\User;
use Carbon\CarbonInterface;

/**
 * The result of a successful tablet sign-in. The plain-text token is only available here, once.
 */
final readonly class IssuedToken
{
    public function __construct(
        public User $user,
        public string $plainTextToken,
        public CarbonInterface $expiresAt,
    ) {}
}
