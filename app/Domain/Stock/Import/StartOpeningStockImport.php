<?php

declare(strict_types=1);

namespace App\Domain\Stock\Import;

use App\Jobs\ImportOpeningStock;
use App\Models\StockImport;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * "Importer les lignes valides": marks a checked file (or one whose import failed) as being imported and
 * queues the import. The page follows its status until it is done.
 */
class StartOpeningStockImport
{
    /**
     * @throws ValidationException when the file was already imported, is being imported, or has nothing to import
     */
    public function handle(StockImport $stockImport, User $user): void
    {
        DB::transaction(function () use ($stockImport, $user): void {
            $stockImport = StockImport::query()->whereKey($stockImport->id)->lockForUpdate()->firstOrFail();

            if (! in_array($stockImport->status, ['checked', 'failed'], true)) {
                throw ValidationException::withMessages(['import' => __('stock_import.already_imported', locale: 'fr')]);
            }
            if ($stockImport->valid_rows === []) {
                throw ValidationException::withMessages(['import' => __('stock_import.nothing_to_import', locale: 'fr')]);
            }

            $stockImport->forceFill(['status' => 'importing'])->save();

            ImportOpeningStock::dispatch($stockImport, $user)->afterCommit();
        });
    }
}
