<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Reports\ConsumptionReport;
use App\Domain\Reports\SalesReport;
use App\Exports\ReportExport;
use App\Exports\SalesReportExport;
use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * "Rapports": sales ("Ventes") and consumption ("Consommation"), with their Excel exports.
 */
class ReportController extends Controller
{
    public function sales(Request $request, SalesReport $report): Response
    {
        $months = $report->months();

        return Inertia::render('reports/sales', [
            'report' => $report->handle($this->month($request, $months)),
            'months' => $months,
            'exchangeRate' => ExchangeRate::query()->inForceOn(today()->toDateString())->value('usd_to_cdf'),
        ]);
    }

    public function exportSales(Request $request, SalesReport $report): BinaryFileResponse
    {
        $data = $report->handle($this->month($request, $report->months()));

        return Excel::download(new SalesReportExport($data), "ventes-{$data['month']}.xlsx");
    }

    public function consumption(ConsumptionReport $report): Response
    {
        return Inertia::render('reports/consumption', [
            'report' => $report->handle(),
            'targetCoverMonths' => ConsumptionReport::TARGET_COVER_MONTHS,
        ]);
    }

    public function exportConsumption(ConsumptionReport $report): BinaryFileResponse
    {
        $data = $report->handle();

        return Excel::download(new ReportExport(
            'Consommation',
            ['Médicament', ...$data['months'], 'Moyenne / mois (u)', 'Stock (u)', 'Couverture (mois)', 'À commander (boîtes)'],
            array_map(fn (array $row): array => [
                $row['medicine'],
                ...$row['months'],
                $row['average'],
                $row['stock'],
                $row['cover_months'],
                $row['order_packs'],
            ], $data['rows']),
        ), 'consommation-'.today()->format('Y-m-d').'.xlsx');
    }

    /**
     * "Bon de commande suggéré": the medicines to order for 2 months of cover, in whole boxes.
     */
    public function exportOrder(ConsumptionReport $report): BinaryFileResponse
    {
        $rows = array_values(array_filter($report->handle()['rows'], fn (array $row): bool => $row['order_packs'] > 0));

        return Excel::download(new ReportExport(
            'Bon de commande',
            ['Médicament', 'Boîtes à commander', 'Unités par boîte', 'Stock (u)', 'Moyenne / mois (u)'],
            array_map(fn (array $row): array => [
                $row['medicine'],
                $row['order_packs'],
                $row['units_per_pack'],
                $row['stock'],
                $row['average'],
            ], $rows),
        ), 'bon-de-commande-'.today()->format('Y-m-d').'.xlsx');
    }

    /**
     * The month asked for in `?month=YYYY-MM` if it is one of the offered months, else the current one.
     *
     * @param  list<string>  $months
     */
    private function month(Request $request, array $months): string
    {
        $month = $request->query('month');

        return is_string($month) && in_array($month, $months, true) ? $month : $months[0];
    }
}
