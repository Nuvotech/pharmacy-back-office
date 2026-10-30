<?php

declare(strict_types=1);

namespace App\Exports;

use App\Domain\Reports\SalesReport;
use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * "Exporter Excel" on the sales report: one sheet of sales per day, one of the best sellers.
 *
 * @phpstan-import-type SalesDay from SalesReport
 * @phpstan-import-type BestSeller from SalesReport
 */
class SalesReportExport implements Export, WithMultipleSheets
{
    /**
     * @param  array{days: list<SalesDay>, best_sellers: list<BestSeller>}  $report
     */
    public function __construct(private readonly array $report) {}

    /**
     * @return list<ReportExport>
     */
    public function sheets(): array
    {
        return [
            new ReportExport(
                'Ventes par jour',
                ['Date', 'Espèces (FC)', 'Mobile money (FC)', 'Total (FC)'],
                array_map(fn (array $day): array => [
                    $day['date'],
                    (float) $day['cash'],
                    (float) $day['mobile_money'],
                    (float) bcadd($day['cash'], $day['mobile_money'], 2),
                ], $this->report['days']),
            ),
            new ReportExport(
                'Meilleures ventes',
                ['Médicament', 'Boîtes', 'Unités', "Chiffre d'affaires (FC)"],
                array_map(fn (array $row): array => [
                    $row['medicine'],
                    $row['packs'],
                    $row['units'],
                    (float) $row['revenue'],
                ], $this->report['best_sellers']),
            ),
        ];
    }
}
