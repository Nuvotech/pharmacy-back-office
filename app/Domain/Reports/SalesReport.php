<?php

declare(strict_types=1);

namespace App\Domain\Reports;

use App\Models\Sale;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * "Rapport des ventes" for one month (the current month runs to today): sales per day split into cash
 * and mobile money, tickets, and the best sellers by revenue. Only synced sales count; returned sales are
 * left out. Amounts in CDF.
 *
 * @phpstan-type SalesDay array{date: string, day: int, cash: numeric-string, mobile_money: numeric-string}
 * @phpstan-type BestSeller array{medicine_id: string, medicine: string, packs: int, units: int, revenue: numeric-string}
 */
class SalesReport
{
    /** Months offered in the period picker, the current one first. */
    public const PERIOD_MONTHS = 6;

    public const BEST_SELLERS = 10;

    /**
     * @param  string  $month  "YYYY-MM"
     * @return array{month: string, from: string, to: string, days: list<SalesDay>, total: string, cash: string, mobile_money: string, tickets: int, best_sellers: list<BestSeller>, synced_until: string|null}
     */
    public function handle(string $month, ?CarbonInterface $now = null): array
    {
        $now = CarbonImmutable::instance($now ?? now());
        $from = CarbonImmutable::createFromFormat('!Y-m', $month) ?: $now->startOfMonth();
        $to = $from->isSameMonth($now) ? $now->endOfDay() : $from->endOfMonth();

        $sales = Sale::query()
            ->whereBetween('sold_at', [$from->startOfDay(), $to])
            ->where('status', '!=', 'returned');

        $perDay = $sales->clone()
            ->selectRaw('DATE(sold_at) as day')
            ->selectRaw("SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash")
            ->selectRaw("SUM(CASE WHEN payment_method = 'mobile_money' THEN total ELSE 0 END) as mobile_money")
            ->groupBy(DB::raw('DATE(sold_at)'))
            ->get()
            ->keyBy(fn (Sale $row): string => (string) $row->getAttribute('day'));

        $days = [];
        for ($day = $from; $day->lessThanOrEqualTo($to); $day = $day->addDay()) {
            $row = $perDay->get($day->toDateString());
            $days[] = [
                'date' => $day->toDateString(),
                'day' => $day->day,
                'cash' => $this->decimal($row?->getAttribute('cash')),
                'mobile_money' => $this->decimal($row?->getAttribute('mobile_money')),
            ];
        }

        $cash = '0';
        $mobileMoney = '0';
        foreach ($days as $day) {
            $cash = bcadd($cash, $day['cash'], 2);
            $mobileMoney = bcadd($mobileMoney, $day['mobile_money'], 2);
        }

        return [
            'month' => $from->format('Y-m'),
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'days' => $days,
            'total' => bcadd($cash, $mobileMoney, 2),
            'cash' => $cash,
            'mobile_money' => $mobileMoney,
            'tickets' => $sales->clone()->count(),
            'best_sellers' => $this->bestSellers($from, $to),
            'synced_until' => Sale::query()->max('synced_at') === null
                ? null
                : CarbonImmutable::parse((string) Sale::query()->max('synced_at'))->utc()->toIso8601ZuluString(),
        ];
    }

    /**
     * The months in the period picker: "YYYY-MM", the current one first.
     *
     * @return list<string>
     */
    public function months(?CarbonInterface $now = null): array
    {
        $current = CarbonImmutable::instance($now ?? now())->startOfMonth();

        return array_map(
            fn (int $offset): string => $current->subMonthsNoOverflow($offset)->format('Y-m'),
            range(0, self::PERIOD_MONTHS - 1),
        );
    }

    /**
     * @return list<BestSeller>
     */
    private function bestSellers(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $rows = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('medicines', 'medicines.id', '=', 'sale_items.medicine_id')
            ->whereBetween('sales.sold_at', [$from->startOfDay(), $to])
            ->where('sales.status', '!=', 'returned')
            ->groupBy('sale_items.medicine_id', 'medicines.name')
            ->select('sale_items.medicine_id', 'medicines.name')
            ->selectRaw("SUM(CASE WHEN sale_items.sell_mode = 'pack' THEN sale_items.quantity ELSE 0 END) as packs")
            ->selectRaw("SUM(CASE WHEN sale_items.sell_mode = 'unit' THEN sale_items.quantity ELSE 0 END) as units")
            ->selectRaw('SUM(sale_items.line_total) as revenue')
            ->orderByDesc('revenue')
            ->limit(self::BEST_SELLERS)
            ->get();

        $bestSellers = [];
        foreach ($rows as $row) {
            $bestSellers[] = [
                'medicine_id' => (string) $row->medicine_id,
                'medicine' => (string) $row->name,
                'packs' => (int) $row->packs,
                'units' => (int) $row->units,
                'revenue' => $this->decimal($row->revenue),
            ];
        }

        return $bestSellers;
    }

    /**
     * @return numeric-string
     */
    private function decimal(mixed $value): string
    {
        return is_numeric($value) ? bcadd((string) $value, '0', 2) : '0.00';
    }
}
