<?php

declare(strict_types=1);

namespace App\Domain\Reports;

use App\Models\Medicine;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * "Consommation et péremptions": units sold per medicine over the last 6 months (the current one
 * included), stock cover at that rate and what to order for 2 months of cover, rounded up to whole boxes;
 * plus the purchase value of the lots in stock that have expired or expire in the next 3 months.
 *
 * @phpstan-type ConsumptionRow array{medicine_id: string, medicine: string, units_per_pack: int, months: list<int>, average: float, stock: int, cover_months: float|null, order_units: int, order_packs: int}
 * @phpstan-type ExpiringMonth array{month: string|null, is_expired: bool, value: string, lot_count: int, first_lot: array{medicine: string, lot_number: string, units: int}|null}
 */
class ConsumptionReport
{
    public const MONTHS = 6;

    /** "À commander" aims for this many months of cover. */
    public const TARGET_COVER_MONTHS = 2;

    /** Months of upcoming expiries shown after the expired lots. */
    public const EXPIRY_MONTHS = 3;

    /**
     * @return array{months: list<string>, rows: list<ConsumptionRow>, expiring: list<ExpiringMonth>}
     */
    public function handle(?CarbonInterface $now = null): array
    {
        $now = CarbonImmutable::instance($now ?? now());
        $firstMonth = $now->startOfMonth()->subMonthsNoOverflow(self::MONTHS - 1);
        $months = array_map(
            fn (int $offset): string => $firstMonth->addMonthsNoOverflow($offset)->format('Y-m'),
            range(0, self::MONTHS - 1),
        );

        return [
            'months' => $months,
            'rows' => $this->rows($months, $firstMonth),
            'expiring' => $this->expiring($now),
        ];
    }

    /**
     * Medicines sold in the period, most used first.
     *
     * @param  list<string>  $months
     * @return list<ConsumptionRow>
     */
    private function rows(array $months, CarbonImmutable $from): array
    {
        $monthExpression = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', sales.sold_at)"
            : "DATE_FORMAT(sales.sold_at, '%Y-%m')";

        $usage = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.sold_at', '>=', $from)
            ->where('sales.status', '!=', 'returned')
            ->groupBy('sale_items.medicine_id', DB::raw($monthExpression))
            ->select('sale_items.medicine_id')
            ->selectRaw("{$monthExpression} as month")
            ->selectRaw('SUM(sale_items.qty_units) as units')
            ->get()
            ->groupBy('medicine_id');

        $medicines = Medicine::query()
            ->whereKey($usage->keys()->all())
            ->withSellableUnits()
            ->get()
            ->keyBy('id');

        $rows = [];
        foreach ($usage as $medicineId => $monthRows) {
            $medicine = $medicines->get($medicineId);
            if ($medicine === null) {
                continue;
            }

            $byMonth = $monthRows->pluck('units', 'month');
            $perMonth = array_map(fn (string $month): int => (int) ($byMonth[$month] ?? 0), $months);
            $average = array_sum($perMonth) / count($perMonth);
            $stock = (int) $medicine->sellable_units;
            $unitsPerPack = max(1, $medicine->units_per_pack);
            $orderUnits = max(0, (int) ceil($average * self::TARGET_COVER_MONTHS - $stock));
            $orderPacks = (int) ceil($orderUnits / $unitsPerPack);

            $rows[] = [
                'medicine_id' => $medicine->id,
                'medicine' => $medicine->name,
                'units_per_pack' => $unitsPerPack,
                'months' => $perMonth,
                'average' => round($average, 1),
                'stock' => $stock,
                'cover_months' => $average > 0 ? round($stock / $average, 1) : null,
                'order_units' => $orderPacks * $unitsPerPack,
                'order_packs' => $orderPacks,
            ];
        }

        usort($rows, fn (array $first, array $second): int => $second['average'] <=> $first['average']);

        return $rows;
    }

    /**
     * Expired lots still in stock, then each of the next 3 months.
     *
     * @return list<ExpiringMonth>
     */
    private function expiring(CarbonImmutable $now): array
    {
        $today = $now->toDateString();
        $ranges = [[null, null, $today, true]];
        for ($offset = 0; $offset < self::EXPIRY_MONTHS; $offset++) {
            $month = $now->startOfMonth()->addMonthsNoOverflow($offset);
            $ranges[] = [
                $month->format('Y-m'),
                $offset === 0 ? $today : $month->subDay()->toDateString(),
                $month->endOfMonth()->toDateString(),
                false,
            ];
        }

        $result = [];
        foreach ($ranges as [$month, $after, $until, $isExpired]) {
            $lots = DB::table('batches')
                ->join('medicines', 'medicines.id', '=', 'batches.medicine_id')
                ->where('batches.qty_on_hand', '>', 0)
                ->when($after !== null, fn ($query) => $query->whereDate('batches.expiry_date', '>', $after))
                ->whereDate('batches.expiry_date', '<=', $until)
                ->orderByRaw('batches.qty_on_hand * batches.purchase_price_unit DESC')
                ->get(['medicines.name', 'batches.lot_number', 'batches.qty_on_hand', 'batches.purchase_price_unit']);

            $value = '0';
            foreach ($lots as $lot) {
                $units = is_numeric($lot->qty_on_hand) ? (string) $lot->qty_on_hand : '0';
                $unitCost = is_numeric($lot->purchase_price_unit) ? (string) $lot->purchase_price_unit : '0';
                $value = bcadd($value, bcmul($units, $unitCost, 4), 4);
            }
            $first = $lots->first();

            $result[] = [
                'month' => $month,
                'is_expired' => $isExpired,
                'value' => bcadd($value, '0', 2),
                'lot_count' => $lots->count(),
                'first_lot' => $first === null ? null : [
                    'medicine' => (string) $first->name,
                    'lot_number' => (string) $first->lot_number,
                    'units' => (int) $first->qty_on_hand,
                ],
            ];
        }

        return $result;
    }
}
