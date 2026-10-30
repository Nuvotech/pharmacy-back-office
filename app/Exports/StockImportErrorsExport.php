<?php

declare(strict_types=1);

namespace App\Exports;

use App\Domain\Stock\Import\CheckStockFile;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

/**
 * "Télécharger la liste (Excel)": every error found in the uploaded file.
 *
 * @phpstan-import-type StockRowError from CheckStockFile
 */
class StockImportErrorsExport implements FromArray, ShouldAutoSize, WithHeadings
{
    /**
     * @param  list<StockRowError>  $errors
     */
    public function __construct(private readonly array $errors) {}

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return ['Ligne', 'Médicament', 'Colonne', 'Problème'];
    }

    /**
     * @return list<list<int|string>>
     */
    public function array(): array
    {
        return array_map(
            fn (array $error): array => [$error['line'], $error['medicine'], $error['column'], $error['problem']],
            $this->errors,
        );
    }
}
