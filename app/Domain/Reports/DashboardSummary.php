<?php

declare(strict_types=1);

namespace App\Domain\Reports;

use App\Enums\ReceptionStatus;
use App\Enums\StockStatus;
use App\Models\Batch;
use App\Models\Device;
use App\Models\Medicine;
use App\Models\Reception;
use App\Models\Sale;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * The figures of the back-office dashboard, computed from stock, lots, receptions and synced sales.
 * Stock counts only lots that have not expired; amounts are in CDF.
 *
 * @phpstan-type Alert array{id: string, kind: 'out'|'low'|'expiring'|'expired', name: string, detail: string, stock: int, threshold: int|null}
 */
class DashboardSummary
{
    /** "Expire < 90 jours" on the dashboard. */
    public const EXPIRING_DAYS = 90;

    /** Rows of each alert kind sent to the page; the counts cover all of them. */
    public const ALERTS_PER_KIND = 10;

    /**
     * A device that synced within this many minutes is shown online. Online tablets pull stock every
     * minute, so this is two missed pulls.
     */
    public const ONLINE_MINUTES = 2;

    /**
     * @return array{
     *     sales_today: array{total: string, tickets: int},
     *     stock_value: string,
     *     counts: array{out: int, low: int, expiring: int, expired: int},
     *     alerts: list<Alert>,
     *     receptions: list<array{id: string, reference: string|null, supplier: string|null, line_count: int, received_on: string}>,
     *     devices: list<array{id: string, name: string, user_name: string|null, is_online: bool, last_sync_at: string|null}>,
     *     open_discrepancies: int,
     * }
     */
    public function handle(?CarbonInterface $now = null): array
    {
        $now ??= now();
        $today = $now->toDateString();
        $expiringBefore = $now->copy()->addDays(self::EXPIRING_DAYS)->toDateString();

        $sales = Sale::query()
            ->whereBetween('sold_at', [$now->copy()->startOfDay(), $now->copy()->endOfDay()])
            ->where('status', '!=', 'returned');

        return [
            'sales_today' => [
                'total' => bcadd((string) ($sales->clone()->sum('total') ?: '0'), '0', 2),
                'tickets' => $sales->clone()->count(),
            ],
            'stock_value' => bcadd((string) (Batch::query()
                ->where('qty_on_hand', '>', 0)
                ->whereDate('expiry_date', '>', $today)
                ->sum(DB::raw('qty_on_hand * purchase_price_unit')) ?: '0'), '0', 2),
            'counts' => [
                'out' => $this->activeMedicines()->whereStockStatus(StockStatus::Out)->count(),
                'low' => $this->activeMedicines()->whereStockStatus(StockStatus::Low)->count(),
                'expiring' => $this->lotsWithStock()
                    ->whereDate('expiry_date', '>', $today)
                    ->whereDate('expiry_date', '<=', $expiringBefore)
                    ->count(),
                'expired' => $this->lotsWithStock()->whereDate('expiry_date', '<=', $today)->count(),
            ],
            'alerts' => [
                ...$this->stockAlerts(StockStatus::Out),
                ...$this->stockAlerts(StockStatus::Low),
                ...$this->expiryAlerts('expiring', $today, $expiringBefore),
                ...$this->expiryAlerts('expired', $today, $expiringBefore),
            ],
            'receptions' => array_values(Reception::query()
                ->where('status', ReceptionStatus::Validated)
                ->with('supplier:id,name')
                ->withCount('lines')
                ->latest('received_at')
                ->latest('validated_at')
                ->limit(3)
                ->get()
                ->map(fn (Reception $reception): array => [
                    'id' => $reception->id,
                    'reference' => $reception->invoice_ref,
                    'supplier' => $reception->supplier?->name,
                    'line_count' => (int) $reception->getAttribute('lines_count'),
                    'received_on' => $reception->received_at->toDateString(),
                ])
                ->all()),
            'devices' => array_values(Device::query()
                ->where('is_active', true)
                ->with('lastUser:id,name')
                ->orderBy('name')
                ->get()
                ->map(fn (Device $device): array => [
                    'id' => $device->id,
                    'name' => $device->name,
                    'user_name' => $device->lastUser?->name,
                    'is_online' => $device->last_sync_at !== null
                        && $device->last_sync_at->greaterThan($now->copy()->subMinutes(self::ONLINE_MINUTES)),
                    'last_sync_at' => $device->last_sync_at?->utc()->toIso8601ZuluString(),
                ])
                ->all()),
            'open_discrepancies' => DB::table('stock_discrepancies')->where('status', 'open')->count(),
        ];
    }

    /**
     * @return Builder<Medicine>
     */
    private function activeMedicines(): Builder
    {
        return Medicine::query()->where('is_active', true);
    }

    /**
     * @return Builder<Batch>
     */
    private function lotsWithStock(): Builder
    {
        return Batch::query()->where('qty_on_hand', '>', 0);
    }

    /**
     * Out of stock or low, medicines that have had stock first (they are the ones being sold).
     *
     * @return list<Alert>
     */
    private function stockAlerts(StockStatus $status): array
    {
        $medicines = $this->activeMedicines()
            ->withSellableUnits()
            ->withCount('batches')
            ->whereStockStatus($status)
            ->orderByDesc('batches_count')
            ->orderBy('name')
            ->limit(self::ALERTS_PER_KIND)
            ->get();

        $alerts = [];
        foreach ($medicines as $medicine) {
            $lotCount = (int) $medicine->getAttribute('batches_count');

            $alerts[] = [
                'id' => $medicine->id,
                'kind' => $status === StockStatus::Out ? 'out' : 'low',
                'name' => $medicine->name,
                'detail' => match (true) {
                    $lotCount === 0 => 'Aucun lot reçu',
                    $status === StockStatus::Out => 'Stock épuisé',
                    default => $lotCount === 1 ? '1 lot' : "{$lotCount} lots",
                },
                'stock' => (int) $medicine->sellable_units,
                'threshold' => $medicine->min_stock_units,
            ];
        }

        return $alerts;
    }

    /**
     * Lots with stock that expire within 90 days, or have expired, soonest first.
     *
     * @param  'expiring'|'expired'  $kind
     * @return list<Alert>
     */
    private function expiryAlerts(string $kind, string $today, string $expiringBefore): array
    {
        $lots = $this->lotsWithStock()
            ->with('medicine:id,name')
            ->when(
                $kind === 'expired',
                fn (Builder $query) => $query->whereDate('expiry_date', '<=', $today),
                fn (Builder $query) => $query
                    ->whereDate('expiry_date', '>', $today)
                    ->whereDate('expiry_date', '<=', $expiringBefore),
            )
            ->orderBy('expiry_date')
            ->limit(self::ALERTS_PER_KIND)
            ->get();

        $alerts = [];
        foreach ($lots as $lot) {
            $alerts[] = [
                'id' => $lot->id,
                'kind' => $kind,
                'name' => "{$lot->medicine->name} · lot {$lot->lot_number}",
                'detail' => ($kind === 'expired' ? 'Expiré le ' : 'Expire le ').Carbon::parse($lot->expiry_date)->format('d/m/Y'),
                'stock' => $lot->qty_on_hand,
                'threshold' => null,
            ];
        }

        return $alerts;
    }
}
