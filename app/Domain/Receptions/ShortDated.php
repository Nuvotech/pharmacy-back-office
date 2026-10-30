<?php

declare(strict_types=1);

namespace App\Domain\Receptions;

use Carbon\CarbonInterface;

/**
 * A lot is short-dated when it expires less than 6 months after the reception date. Short-dated lots can
 * be received, but only once the user has confirmed them.
 */
final class ShortDated
{
    public const MONTHS = 6;

    /**
     * @param  CarbonInterface  $expiresOn  last day of the expiry month
     */
    public static function isShortDated(CarbonInterface $expiresOn, CarbonInterface $receivedOn): bool
    {
        return $expiresOn->toDateString() < $receivedOn->copy()->addMonthsNoOverflow(self::MONTHS)->toDateString();
    }
}
