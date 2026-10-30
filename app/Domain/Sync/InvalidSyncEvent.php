<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use RuntimeException;

/**
 * A pushed event the server refuses for good (bad payload, unknown type): it is logged as failed and
 * reported back, so the tablet stops resending it.
 */
class InvalidSyncEvent extends RuntimeException {}
