<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * A medicine's stock level, as the alerts and the Médicaments list show it. Same rule as the
 * `v_medicine_stock` view: expired lots don't count, and a level at or below the minimum is low.
 */
enum StockStatus: string
{
    case Ok = 'ok';
    case Low = 'low';
    case Out = 'out';

    /**
     * @param  int  $sellableUnits  units in lots that have not expired
     * @param  int  $minimumUnits  the medicine's minimum stock
     */
    public static function fromUnits(int $sellableUnits, int $minimumUnits): self
    {
        return match (true) {
            $sellableUnits <= 0 => self::Out,
            $sellableUnits <= $minimumUnits => self::Low,
            default => self::Ok,
        };
    }
}
