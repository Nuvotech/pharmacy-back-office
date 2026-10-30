import { useId } from 'react';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { SalesChart } from '@/components/backoffice/sales-chart';
import { StatTile } from '@/components/backoffice/stat-tile';
import { formatFc, formatNumber } from '@/lib/format';
import { fcPerUsd } from '@/lib/mock/medicines';
import {
    dailySales,
    productSales,
    salesPeriods,
    salesSyncedUntil,
    ticketCount,
} from '@/lib/mock/sales-report';
import { showNotAvailableYet } from '@/lib/not-available';

/** A share of this size fills the whole bar, so the best sellers' bars stay readable. */
const shareBarFullScale = 0.12;

type RankedProduct = {
    rank: number;
    medicine: string;
    quantityLabel: string;
    revenue: number;
    share: number;
};

const totalRevenue = dailySales.reduce(
    (sum, day) => sum + day.cash + day.mobileMoney,
    0,
);
const mobileMoneyRevenue = dailySales.reduce(
    (sum, day) => sum + day.mobileMoney,
    0,
);
const salesDays = dailySales.map((day) => day.cash + day.mobileMoney);

const rankedProducts: RankedProduct[] = productSales
    .map((product) => ({
        medicine: product.medicine,
        quantityLabel: `${formatNumber(product.quantity)} ${product.unitLabel}`,
        revenue: product.quantity * product.unitPrice,
    }))
    .sort((first, second) => second.revenue - first.revenue)
    .map((product, index) => ({
        ...product,
        rank: index + 1,
        share: product.revenue / totalRevenue,
    }));

function formatPercent(share: number, decimals: number): string {
    return `${(share * 100).toFixed(decimals).replace('.', ',')} %`;
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
        width: '120px',
        align: 'right',
        render: (product) => product.quantityLabel,
    },
    {
        key: 'revenue',
        header: "Chiffre d'affaires",
        width: '160px',
        align: 'right',
        render: (product) => formatFc(product.revenue),
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

export default function SalesReport() {
    const periodId = useId();
    const lowestDay = Math.min(...salesDays);
    const highestDay = Math.max(...salesDays);
    const chartSummary = `Ventes quotidiennes du 1er au ${dailySales.length} octobre, entre ${formatNumber(lowestDay)} et ${formatNumber(highestDay)} FC par jour, dont ${formatPercent(mobileMoneyRevenue / totalRevenue, 0)} en mobile money.`;

    return (
        <>
            <PageHeader
                title="Rapport des ventes"
                subtitle={
                    <>
                        Inclut les ventes synchronisées jusqu'à{' '}
                        <span className="font-mono">{salesSyncedUntil}</span>
                    </>
                }
                actions={
                    <>
                        <label htmlFor={periodId} className="sr-only">
                            Période
                        </label>
                        <select
                            id={periodId}
                            className="h-11 rounded-control border border-border-strong bg-surface px-2.5 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            {salesPeriods.map((period) => (
                                <option key={period}>{period}</option>
                            ))}
                        </select>
                        <Button
                            variant="secondary"
                            onClick={() => showNotAvailableYet('Export Excel')}
                        >
                            Exporter Excel
                        </Button>
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
                            <>
                                ≈{' '}
                                <span className="font-mono">
                                    {formatNumber(totalRevenue / fcPerUsd)}
                                </span>{' '}
                                USD
                            </>
                        }
                        isLabelMuted
                        className="min-h-0"
                    />
                    <StatTile
                        label="Tickets"
                        value={formatNumber(ticketCount)}
                        sub={
                            <>
                                <span className="font-mono">
                                    {formatNumber(
                                        ticketCount / dailySales.length,
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
                        value={formatFc(totalRevenue / ticketCount)}
                        sub="par ticket"
                        isLabelMuted
                        className="min-h-0"
                    />
                    <StatTile
                        label="Mobile money"
                        value={formatPercent(
                            mobileMoneyRevenue / totalRevenue,
                            0,
                        )}
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
                    <SalesChart days={dailySales} summary={chartSummary} />
                </Card>

                <Card
                    title="Meilleures ventes de la période"
                    isPadded={false}
                    className="overflow-hidden"
                >
                    <DataTable
                        columns={productColumns}
                        rows={rankedProducts}
                        rowKey={(product) => product.medicine}
                        minWidth={680}
                        caption="Meilleures ventes de la période, triées par chiffre d'affaires"
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
