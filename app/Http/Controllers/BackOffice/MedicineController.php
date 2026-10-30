<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Enums\StockStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\BackOffice\ListMedicinesRequest;
use App\Http\Resources\MedicineListResource;
use App\Models\Category;
use App\Models\Medicine;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Médicaments": the catalogue, searchable and filtered from the URL query string.
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
}
