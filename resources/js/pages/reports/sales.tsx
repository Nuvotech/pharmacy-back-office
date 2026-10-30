import { router } from '@inertiajs/react';
import { useId } from 'react';
import { Button, buttonVariants } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { SalesChart } from '@/components/backoffice/sales-chart';
import { StatTile } from '@/components/backoffice/stat-tile';
import { formatFc, formatNumber } from '@/lib/format';
import { showNotAvailableYet } from '@/lib/not-available';
import { monthLabel, periodLabel } from '@/lib/reports';
import type { BestSeller, SalesReportData } from '@/lib/reports';
import { sales } from '@/routes/reports';
import { exportMethod as exportSales } from '@/routes/reports/sales';

type SalesReportProps = {
    report: SalesReportData;
    /** "YYYY-MM" months in the period picker, the current one first. */
    months: string[];
    /** 1 USD in CDF in force today, or null when no rate is recorded. */
    exchangeRate: string | null;
};

/** A share of this size fills the whole bar, so the best sellers' bars stay readable. */
const shareBarFullScale = 0.12;

type RankedProduct = BestSeller & { rank: number; share: number };

function formatPercent(share: number, decimals: number): string {
    return `${(share * 100).toFixed(decimals).replace('.', ',')} %`;
}

/** "12 btes", "30 u", or "12 btes · 30 u". */
function quantityLabel(product: BestSeller): string {
    return [
        product.packs > 0
            ? `${formatNumber(product.packs)} ${product.packs === 1 ? 'bte' : 'btes'}`
            : null,
        product.units > 0 ? `${formatNumber(product.units)} u` : null,
    ]
        .filter(Boolean)
        .join(' · ');
}

const productColumns: DataTableColumn<RankedProduct>[] = [
    {
        key: 'rank',
        header: '#',
        width: '48px',
        render: (product) => (
            <span className="font-mono text-ink-muted">{product.rank}</span>
        ),
    },
    {
        key: 'medicine',
        header: 'Médicament',
        render: (product) => (
            <span className="font-semibold">{product.medicine}</span>
        ),
    },
    {
        key: 'quantity',
        header: 'Quantité',
        width: '140px',
        align: 'right',
        render: (product) => quantityLabel(product),
    },
    {
        key: 'revenue',
        header: "Chiffre d'affaires",
        width: '160px',
        align: 'right',
        render: (product) => formatFc(Number(product.revenue)),
    },
    {
        key: 'share',
        header: 'Part du CA',
        width: '36%',
        render: (product) => (
            <div className="flex items-center gap-2.5">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-divider">
                    <div
                        className="h-full bg-primary"
                        style={{
                            width: `${Math.min(100, (product.share / shareBarFullScale) * 100)}%`,
                        }}
                    />
                </div>
                <span className="w-[52px] text-right font-mono text-[13px]">
                    {formatPercent(product.share, 1)}
                </span>
            </div>
        ),
    },
];

export default function SalesReport({
    report,
    months,
    exchangeRate,
}: SalesReportProps) {
    const periodId = useId();
    const totalRevenue = Number(report.total);
    const mobileMoneyRevenue = Number(report.mobile_money);
    const mobileShare =
        totalRevenue > 0 ? mobileMoneyRevenue / totalRevenue : 0;
    const days = report.days.map((day) => ({
        day: day.day,
        cash: Number(day.cash),
        mobileMoney: Number(day.mobile_money),
    }));
    const dayTotals = days.map((day) => day.cash + day.mobileMoney);
    const rankedProducts: RankedProduct[] = report.best_sellers.map(
        (product, index) => ({
            ...product,
            rank: index + 1,
            share:
                totalRevenue > 0 ? Number(product.revenue) / totalRevenue : 0,
        }),
    );
    const monthName = monthLabel(report.month, false);
    const chartSummary = `Ventes quotidiennes du 1er au ${days.length} ${monthName}, entre ${formatNumber(Math.min(...dayTotals, 0))} et ${formatNumber(Math.max(...dayTotals, 0))} FC par jour, dont ${formatPercent(mobileShare, 0)} en mobile money.`;
    const syncedUntil = report.synced_until
        ? new Intl.DateTimeFormat('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
          }).format(new Date(report.synced_until))
        : null;

    return (
        <>
            <PageHeader
                title="Rapport des ventes"
                subtitle={
                    syncedUntil ? (
                        <>
                            Inclut les ventes synchronisées jusqu'au{' '}
                            <span className="font-mono">{syncedUntil}</span>
                        </>
                    ) : (
                        'Aucune vente synchronisée pour le moment'
                    )
                }
                actions={
                    <>
                        <label htmlFor={periodId} className="sr-only">
                            Période
                        </label>
                        <select
                            id={periodId}
                            value={report.month}
                            onChange={(event) =>
                                router.get(
                                    sales({
                                        query: { month: event.target.value },
                                    }),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                            className="h-11 rounded-control border border-border-strong bg-surface px-2.5 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            {months.map((month) => (
                                <option key={month} value={month}>
                                    {month === report.month
                                        ? periodLabel(report)
                                        : monthLabel(month)}
                                </option>
                            ))}
                        </select>
                        <a
                            href={
                                exportSales({ query: { month: report.month } })
                                    .url
                            }
                            className={buttonVariants({ variant: 'secondary' })}
                        >
                            Exporter Excel
                        </a>
                        <Button
                            onClick={() => showNotAvailableYet('Export PDF')}
                        >
                            Exporter PDF
                        </Button>
                    </>
                }
            />
            <PageContent>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
                    <StatTile
                        label="Chiffre d'affaires"
                        value={formatFc(totalRevenue)}
                        sub={
                            exchangeRate ? (
                                <>
                                    ≈{' '}
                                    <span className="font-mono">
                                        {formatNumber(
                                            totalRevenue / Number(exchangeRate),
                                        )}
                                    </span>{' '}
                                    USD
                                </>
                            ) : (
                                'taux du jour non saisi'
                            )
                        }
                        isLabelMuted
                        className="min-h-0"
                    />
                    <StatTile
                        label="Tickets"
                        value={formatNumber(report.tickets)}
                        sub={
                            <>
                                <span className="font-mono">
                                    {formatNumber(
                                        days.length > 0
                                            ? report.tickets / days.length
                                            : 0,
                                    )}
                                </span>{' '}
                                par jour en moyenne
                            </>
                        }
                        isLabelMuted
                        className="min-h-0"
                    />
                    <StatTile
                        label="Panier moyen"
                        value={formatFc(
                            report.tickets > 0
                                ? totalRevenue / report.tickets
                                : 0,
                        )}
                        sub="par ticket"
                        isLabelMuted
                        className="min-h-0"
                    />
                    <StatTile
                        label="Mobile money"
                        value={formatPercent(mobileShare, 0)}
                        sub="du chiffre d'affaires"
                        isLabelMuted
                        className="min-h-0"
                    />
                </div>

                <Card
                    title="Ventes par jour (FC)"
                    actions={
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-muted">
                            <LegendItem label="Espèces" swatch="bg-primary" />
                            <LegendItem
                                label="Mobile money"
                                swatch="bg-mobile-money"
                            />
                        </div>
                    }
                >
                    <SalesChart
                        days={days}
                        monthName={monthName}
                        summary={chartSummary}
                    />
                </Card>

                <Card
                    title="Meilleures ventes de la période"
                    isPadded={false}
                    className="overflow-hidden"
                >
                    <DataTable
                        columns={productColumns}
                        rows={rankedProducts}
                        rowKey={(product) => product.medicine_id}
                        minWidth={680}
                        caption="Meilleures ventes de la période, triées par chiffre d'affaires"
                        emptyMessage="Aucune vente sur cette période"
                    />
                </Card>
            </PageContent>
        </>
    );
}

function LegendItem({ label, swatch }: { label: string; swatch: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`size-3 rounded-[3px] ${swatch}`} aria-hidden />
            {label}
        </span>
    );
}
