<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mirrors `receptions.currency`: the currency of the supplier's invoice. CDF is shown as "FC".
 */
enum InvoiceCurrency: string
{
    case Usd = 'USD';
    case Cdf = 'CDF';
}
