<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Reports\DashboardSummary;
use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Tableau de bord": today's sales, stock value, alerts, latest receptions and devices.
 */
class DashboardController extends Controller
{
    public function __invoke(DashboardSummary $summary): Response
    {
        return Inertia::render('dashboard', [
            'summary' => $summary->handle(),
            'exchangeRate' => ExchangeRate::query()->inForceOn(today()->toDateString())->value('usd_to_cdf'),
            'today' => today()->toDateString(),
        ]);
    }
}
