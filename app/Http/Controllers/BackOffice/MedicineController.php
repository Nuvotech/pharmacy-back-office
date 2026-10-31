<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Catalogue\SaveMedicine;
use App\Enums\StockStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\BackOffice\ListMedicinesRequest;
use App\Http\Requests\BackOffice\SaveMedicineRequest;
use App\Http\Resources\MedicineListResource;
use App\Models\Batch;
use App\Models\Category;
use App\Models\ExchangeRate;
use App\Models\Medicine;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Médicaments": the catalogue, searchable and filtered from the URL query string, and its form.
 */
class MedicineController extends Controller
{
    public const PER_PAGE = 25;

    public function index(ListMedicinesRequest $request): Response
    {
        /** @var array{search?: string|null, category?: string|null, filter?: string|null} $filters */
        $filters = $request->validated();
        $search = trim((string) ($filters['search'] ?? ''));
        $category = $filters['category'] ?? null;
        $filter = $filters['filter'] ?? 'all';

        $medicines = Medicine::query()
            ->where('is_active', true)
            ->withSellableUnits()
            ->with('categories')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $compact = str_replace(' ', '', $search);
                $query->where(fn (Builder $query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('dci', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$compact}%"));
            })
            ->when($category, fn (Builder $query, string $slug) => $query->whereHas(
                'categories',
                fn (Builder $query) => $query->where('slug', $slug),
            ))
            ->when($filter === 'out', fn (Builder $query) => $query->whereStockStatus(StockStatus::Out))
            ->when($filter === 'low', fn (Builder $query) => $query->whereStockStatus(StockStatus::Low))
            ->when($filter === 'prescription', fn (Builder $query) => $query->where('prescription_required', true))
            ->orderBy('name')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return Inertia::render('medicines/index', [
            'medicines' => MedicineListResource::collection($medicines),
            'categories' => Category::query()->orderBy('sort_order')->get(['slug', 'name']),
            'filters' => ['search' => $search, 'category' => $category ?? '', 'filter' => $filter],
            'activeCount' => Medicine::query()->where('is_active', true)->count(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('medicines/form', $this->formProps(null));
    }

    public function store(SaveMedicineRequest $request, SaveMedicine $saveMedicine): RedirectResponse
    {
        $saveMedicine->handle(null, $request->medicine());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('medicines.created', locale: 'fr')]);

        return to_route('medicines.index');
    }

    public function edit(Medicine $medicine): Response
    {
        return Inertia::render('medicines/form', $this->formProps($medicine));
    }

    public function update(SaveMedicineRequest $request, Medicine $medicine, SaveMedicine $saveMedicine): RedirectResponse
    {
        $saveMedicine->handle($medicine, $request->medicine());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('medicines.updated', locale: 'fr')]);

        return to_route('medicines.index');
    }

    /**
     * Prices are whole FC; lot costs per box are in FC at the medicine's current box size.
     *
     * @return array<string, mixed>
     */
    private function formProps(?Medicine $medicine): array
    {
        $today = today()->toDateString();
        $lots = $medicine === null ? collect() : Batch::query()
            ->where('medicine_id', $medicine->id)
            ->where('qty_on_hand', '>', 0)
            ->whereDate('expiry_date', '>', $today)
            ->orderBy('expiry_date')
            ->orderBy('received_at')
            ->get();
        $latestLot = $medicine === null ? null : Batch::query()
            ->where('medicine_id', $medicine->id)
            ->latest('received_at')
            ->first();
        $unitsPerPack = (string) max(1, $medicine->units_per_pack ?? 1);

        return [
            'medicine' => $medicine === null ? null : [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'dci' => $medicine->dci,
                'dosage' => $medicine->dosage,
                'form' => $medicine->form,
                'barcode' => $medicine->barcode,
                'shelf' => $medicine->shelf,
                'units_per_pack' => $medicine->units_per_pack,
                'sale_price_pack' => bcadd($medicine->sale_price_pack, '0', 0),
                'sale_price_unit' => $medicine->sale_price_unit === null ? null : bcadd($medicine->sale_price_unit, '0', 0),
                'min_stock_units' => $medicine->min_stock_units,
                'prescription_required' => $medicine->prescription_required,
                'category_slugs' => $medicine->categories()->pluck('slug'),
            ],
            'lots' => $lots->map(fn (Batch $lot): array => [
                'id' => $lot->id,
                'lot_number' => $lot->lot_number,
                'expiry' => $lot->expiry_date->format('m/Y'),
                'qty_on_hand' => $lot->qty_on_hand,
                'cost_per_pack' => bcmul($lot->purchase_price_unit, $unitsPerPack, 0),
            ])->values(),
            'latestCostPerPack' => $latestLot === null ? null : bcmul($latestLot->purchase_price_unit, $unitsPerPack, 0),
            'categories' => Category::query()->orderBy('sort_order')->get(['slug', 'name']),
            'exchangeRate' => ExchangeRate::query()->inForceOn($today)->value('usd_to_cdf'),
        ];
    }
}
