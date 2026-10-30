<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Stock\Import\ImportOpeningStock as ImportOpeningStockService;
use App\Models\StockImport;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Imports a stock file queued by StartOpeningStockImport. Idempotent: the service only imports a file
 * marked "importing", so running the job twice imports the stock once.
 */
class ImportOpeningStock implements ShouldQueue
{
    use Queueable;

    /** One attempt: a failed import is retried by the user from the page. */
    public int $tries = 1;

    public function __construct(
        public StockImport $stockImport,
        public User $user,
    ) {}

    public function handle(ImportOpeningStockService $importOpeningStock): void
    {
        try {
            $importOpeningStock->handle($this->stockImport, $this->user);
        } catch (ValidationException) {
            // Already imported (e.g. the job ran twice): nothing to do.
        }
    }

    /**
     * The import rolled back: the page shows the failure and the user can try again.
     */
    public function failed(?Throwable $exception): void
    {
        $this->stockImport->newQuery()
            ->whereKey($this->stockImport->id)
            ->where('status', 'importing')
            ->update(['status' => 'failed']);
    }
}
