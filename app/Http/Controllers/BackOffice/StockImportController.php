<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Stock\Import\CheckStockFile;
use App\Domain\Stock\Import\ReadStockFile;
use App\Domain\Stock\Import\StartOpeningStockImport;
use App\Exports\StockImportErrorsExport;
use App\Exports\StockTemplateExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\BackOffice\UploadStockFileRequest;
use App\Models\StockImport;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * "Import du stock initial": template → upload → check → import. Nothing reaches stock until the user
 * confirms the import.
 */
class StockImportController extends Controller
{
    /** Errors shown on the page; the rest are in the downloadable list. */
    public const ERRORS_SHOWN = 50;

    public function create(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $current = StockImport::query()
            ->where('user_id', $user->id)
            ->whereIn('status', ['checked', 'importing', 'failed'])
            ->latest()
            ->first();
        $done = is_string($request->query('done'))
            ? StockImport::query()->whereKey($request->query('done'))->where('status', 'imported')->first()
            : null;

        return Inertia::render('stock-import/create', [
            'stockImport' => $current === null ? null : [
                'id' => $current->id,
                'status' => $current->status,
                'file_name' => $current->file_name,
                'row_count' => $current->row_count,
                'valid_count' => count($current->valid_rows),
                'error_row_count' => count(array_unique(array_column($current->errors, 'line'))),
                'errors' => array_slice($current->errors, 0, self::ERRORS_SHOWN),
                'error_count' => count($current->errors),
                'uploaded_at' => $current->created_at?->utc()->toIso8601ZuluString(),
            ],
            'completed' => $done === null ? null : [
                'file_name' => $done->file_name,
                'imported_lots' => $done->imported_lots,
                'created_medicines' => $done->created_medicines,
                'imported_at' => $done->imported_at?->utc()->toIso8601ZuluString(),
            ],
        ]);
    }

    public function store(UploadStockFileRequest $request, ReadStockFile $readFile, CheckStockFile $checkFile): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $file = $request->file('file');
        abort_unless($file !== null && ! is_array($file), 422);

        $result = $checkFile->handle($readFile->handle($file), today());

        if ($result['row_count'] === 0) {
            return back()->withErrors(['file' => __('stock_import.empty_file', locale: 'fr')]);
        }

        DB::transaction(function () use ($user, $file, $result): void {
            // A new file replaces the one being checked (never one being imported).
            StockImport::query()->where('user_id', $user->id)->whereIn('status', ['checked', 'failed'])->delete();

            StockImport::query()->create([
                'user_id' => $user->id,
                'file_name' => $file->getClientOriginalName(),
                'status' => 'checked',
                'row_count' => $result['row_count'],
                'valid_rows' => $result['valid'],
                'errors' => $result['errors'],
            ]);
        });

        return to_route('stock-import.create');
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(new StockTemplateExport, 'modele-stock-initial.xlsx');
    }

    public function errors(StockImport $stockImport): BinaryFileResponse
    {
        return Excel::download(new StockImportErrorsExport($stockImport->errors), 'erreurs-import-stock.xlsx');
    }

    /**
     * Queues the import; the page shows "Import en cours" and checks its status until it is done.
     */
    public function run(Request $request, StockImport $stockImport, StartOpeningStockImport $startImport): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $startImport->handle($stockImport, $user);

        return to_route('stock-import.create');
    }
}
