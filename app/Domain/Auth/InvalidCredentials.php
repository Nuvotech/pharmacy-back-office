<?php

declare(strict_types=1);

namespace App\Domain\Auth;

use RuntimeException;

/**
 * The username and PIN do not match an active account.
 */
class InvalidCredentials extends RuntimeException {}
