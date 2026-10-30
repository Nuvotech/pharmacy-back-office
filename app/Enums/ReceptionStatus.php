<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mirrors `receptions.status`. Only a validated reception has lots and stock movements.
 */
enum ReceptionStatus: string
{
    case Draft = 'draft';
    case Validated = 'validated';
}
