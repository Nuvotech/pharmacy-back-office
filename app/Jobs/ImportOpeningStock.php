<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Stock\Import\ImportOpeningStock as ImportOpeningStockService;
use App\Models\StockImport;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Imports a checked opening-stock file. Idempotent: an import that is no longer "checked" is refused by
 * the service, so running the job twice imports the stock once.
 */
class ImportOpeningStock implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public StockImport $stockImport,
        public User $user,
    ) {}

    public function handle(ImportOpeningStockService $importOpeningStock): void
    {
        $importOpeningStock->handle($this->stockImport, $this->user);
    }
}
