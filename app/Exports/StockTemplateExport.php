<?php

declare(strict_types=1);

namespace App\Exports;

use App\Domain\Stock\Import\CheckStockFile;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * "Télécharger le modèle Excel": the opening-stock columns, one row per lot to fill in.
 */
class StockTemplateExport implements FromArray, ShouldAutoSize, WithHeadings
{
    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return CheckStockFile::COLUMNS;
    }

    /**
     * @return list<list<string>>
     */
    public function array(): array
    {
        return [];
    }
}
