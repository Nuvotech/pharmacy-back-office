<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Inventory\CloseInventoryCount;
use App\Domain\Inventory\RecordCountedUnits;
use App\Domain\Inventory\StartInventoryCount;
use App\Http\Controllers\Controller;
use App\Http\Requests\BackOffice\RecordCountRequest;
use App\Models\InventoryCount;
use App\Models\InventoryCountLine;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Inventaire": the open stock count, its lots to count, and closing it into corrections.
 */
class InventoryController extends Controller
{
    public function index(): Response
    {
        $count = InventoryCount::query()->where('status', 'open')->latest('started_at')->first();
        $lastClosed = InventoryCount::query()->where('status', 'closed')->latest('closed_at')->first();

        return Inertia::render('inventory/index', [
            'count' => $count === null ? null : [
                'id' => $count->id,
                'started_at' => $count->started_at->utc()->toIso8601ZuluString(),
            ],
            'lines' => $count === null ? [] : $count->lines()
                ->join('batches', 'batches.id', '=', 'inventory_count_lines.batch_id')
                ->join('medicines', 'medicines.id', '=', 'batches.medicine_id')
                ->orderBy('medicines.name')
                ->orderBy('batches.expiry_date')
                ->get([
                    'inventory_count_lines.id',
                    'inventory_count_lines.expected_units',
                    'inventory_count_lines.counted_units',
                    'batches.lot_number',
                    'batches.expiry_date',
                    'batches.purchase_price_unit',
                    'medicines.name as medicine_name',
                ])
                ->map(fn (InventoryCountLine $line): array => [
                    'id' => $line->id,
                    'medicine' => (string) $line->getAttribute('medicine_name'),
                    'lot_number' => (string) $line->getAttribute('lot_number'),
                    'expiry' => substr((string) $line->getAttribute('expiry_date'), 5, 2).'/'.substr((string) $line->getAttribute('expiry_date'), 0, 4),
                    'expected_units' => $line->expected_units,
                    'counted_units' => $line->counted_units,
                    'unit_cost' => self::decimal($line->getAttribute('purchase_price_unit')),
                ])
                ->values(),
            'lastClosedAt' => $lastClosed?->closed_at?->utc()->toIso8601ZuluString(),
        ]);
    }

    /**
     * A unit cost as a 4-decimal string, whatever the database driver returns.
     */
    private static function decimal(mixed $value): string
    {
        return is_numeric($value) ? bcadd((string) $value, '0', 4) : '0.0000';
    }

    public function store(Request $request, StartInventoryCount $startCount): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $startCount->handle($user);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('inventory.started', locale: 'fr')]);

        return to_route('inventory.index');
    }

    public function updateLine(RecordCountRequest $request, InventoryCountLine $line, RecordCountedUnits $recordCount): RedirectResponse
    {
        $recordCount->handle($line, $request->countedUnits());

        return back();
    }

    public function close(Request $request, InventoryCount $count, CloseInventoryCount $closeCount): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $corrections = $closeCount->handle($count, $user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('inventory.closed', ['count' => $corrections], 'fr'),
        ]);

        return to_route('inventory.index');
    }
}
