<?php

declare(strict_types=1);

namespace App\Domain\Stock\Import;

use App\Imports\StockFileImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

/**
 * Reads the first sheet of an uploaded stock file (.xlsx or .csv) into rows keyed by column name. The
 * header row is the first line; headers are matched without accents or case ("Unités par boîte" =
 * `unites_par_boite`).
 */
class ReadStockFile
{
    /**
     * @return list<array<string, mixed>>
     *
     * @throws ValidationException when the file can't be read or misses columns
     */
    public function handle(UploadedFile $file): array
    {
        // The upload's temporary path has no extension, so the format comes from the original file name.
        $readerType = strtolower($file->getClientOriginalExtension()) === 'xlsx' ? ExcelFormat::XLSX : ExcelFormat::CSV;

        try {
            $sheets = Excel::toArray(
                new StockFileImport,
                $file->getRealPath(),
                null,
                $readerType,
            );
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages(['file' => __('stock_import.file_unreadable', locale: 'fr')]);
        }

        /** @var list<array<string, mixed>> $rows */
        $rows = array_values($sheets[0] ?? []);
        $headers = array_keys($rows[0] ?? []);
        $missing = array_diff(['nom', 'date_expiration', 'quantite', 'unites_par_boite', 'prix_boite'], $headers);

        if ($rows !== [] && $missing !== []) {
            throw ValidationException::withMessages([
                'file' => __('stock_import.missing_columns', ['columns' => implode(', ', $missing)], 'fr'),
            ]);
        }

        if (count($rows) > CheckStockFile::MAX_ROWS) {
            throw ValidationException::withMessages([
                'file' => __('stock_import.too_many_rows', ['max' => CheckStockFile::MAX_ROWS], 'fr'),
            ]);
        }

        return $rows;
    }
}
