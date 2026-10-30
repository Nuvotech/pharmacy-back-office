import { Link } from '@inertiajs/react';
import { Badge } from '@/components/backoffice/badge';
import type { BadgeTone } from '@/components/backoffice/badge';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatFc, formatNumber } from '@/lib/format';
import {
    consumptionMonths,
    expiringValue,
    monthlyConsumption,
    otherReports,
    targetCoverMonths,
} from '@/lib/mock/consumption';
import type { MonthlyConsumption } from '@/lib/mock/consumption';
import { showNotAvailableYet } from '@/lib/not-available';
import { cn } from '@/lib/utils';
import { index as adjustments } from '@/routes/adjustments';

type ConsumptionRow = MonthlyConsumption & {
    average: number;
    /** Months of stock left at the average rate. */
    cover: number;
    /** Units to order for the target cover, rounded up to whole boxes. */
    orderQuantity: number;
};

/** avg = mean of the months; cover = stock ÷ avg; order = max(0, ceil(avg × 2 − stock)) in whole boxes. */
const rows: ConsumptionRow[] = monthlyConsumption.map((item) => {
    const average =
        item.months.reduce((sum, units) => sum + units, 0) / item.months.length;
    const shortfall = Math.max(
        0,
        Math.ceil(average * targetCoverMonths - item.stock),
    );

    return {
        ...item,
        average,
        cover: average === 0 ? 0 : item.stock / average,
        orderQuantity:
            Math.ceil(shortfall / item.unitsPerBox) * item.unitsPerBox,
    };
});

function coverTone(cover: number): BadgeTone {
    if (cover < 0.5) {
        return 'danger';
    }

    return cover < 1 ? 'warning' : 'ok';
}

function formatCover(cover: number): string {
    return cover < 0.05
        ? '0 mois'
        : `${cover.toFixed(1).replace('.', ',')} mois`;
}

/** The six months of `MonthlyConsumption.months`, in order. */
const monthNames = ['mai', 'juin', 'juillet', 'août', 'septembre', 'octobre'];

function Sparkline({ months, label }: { months: number[]; label: string }) {
    const highest = Math.max(...months, 1);

    return (
        <div
            role="img"
            aria-label={label}
            className="flex h-[30px] items-end gap-1"
        >
            {months.map((units, index) => (
                <div
                    key={monthNames[index]}
                    className={cn(
                        'flex-1 rounded-[2px]',
                        index === months.length - 1
                            ? 'bg-primary'
                            : 'bg-primary-tint',
                    )}
                    style={{
                        height: `${Math.max(3, Math.round((units / highest) * 30))}px`,
                    }}
                />
            ))}
        </div>
    );
}

const columns: DataTableColumn<ConsumptionRow>[] = [
    {
        key: 'medicine',
        header: 'Médicament',
        render: (row) => (
            <CellLines main={row.medicine} detail={`en ${row.unitLabel}`} />
        ),
    },
    {
        key: 'trend',
        header: 'Mai → oct.',
        width: '150px',
        render: (row) => (
            <Sparkline
                months={row.months}
                label={`${row.medicine} : de ${row.months[0]} à ${row.months.at(-1)} ${row.unitLabel} par mois`}
            />
        ),
    },
    {
        key: 'average',
        header: 'Moy. / mois',
        width: '100px',
        align: 'right',
        render: (row) => formatNumber(row.average),
    },
    {
        key: 'stock',
        header: 'Stock',
        width: '90px',
        align: 'right',
        render: (row) => formatNumber(row.stock),
    },
    {
        key: 'cover',
        header: 'Couverture',
        width: '110px',
        align: 'right',
        render: (row) => (
            <Badge tone={coverTone(row.cover)} isMono>
                {formatCover(row.cover)}
            </Badge>
        ),
    },
    {
        key: 'order',
        header: 'À commander',
        width: '120px',
        align: 'right',
        render: (row) => (
            <span className="font-semibold">
                {row.orderQuantity > 0 ? formatNumber(row.orderQuantity) : '—'}
            </span>
        ),
    },
];

export default function ConsumptionReport() {
    const highestExpiringValue = Math.max(
        ...expiringValue.map((month) => month.value),
        1,
    );

    return (
        <>
            <PageHeader
                title="Consommation et péremptions"
                subtitle={
                    <>
                        <span className="font-mono">{consumptionMonths}</span>{' '}
                        derniers mois · sert à préparer les commandes
                    </>
                }
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => showNotAvailableYet('Export Excel')}
                        >
                            Exporter Excel
                        </Button>
                        <Button
                            onClick={() =>
                                showNotAvailableYet('Bon de commande')
                            }
                        >
                            Bon de commande suggéré
                        </Button>
                    </>
                }
            />
            <PageContent>
                <div className="flex flex-wrap items-start gap-5">
                    <Card
                        title="Consommation mensuelle"
                        isPadded={false}
                        className="flex-[3_1_620px] overflow-hidden"
                        actions={
                            <span className="text-[13px] text-ink-muted">
                                Couverture = stock ÷ moyenne mensuelle
                            </span>
                        }
                    >
                        <DataTable
                            columns={columns}
                            rows={rows}
                            rowKey={(row) => row.medicine}
                            minWidth={820}
                            caption="Consommation mensuelle et couverture du stock"
                        />
                        <p className="px-5 py-3.5 text-[13px] text-ink-muted">
                            « À commander » vise{' '}
                            <span className="font-mono">
                                {targetCoverMonths}
                            </span>{' '}
                            mois de couverture, arrondi à la boîte.
                        </p>
                    </Card>

                    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                        <Card title="Valeur qui expire">
                            <p className="text-[13px] text-ink-muted">
                                Prix d'achat des lots encore en stock
                            </p>
                            <ul className="flex flex-col gap-3.5">
                                {expiringValue.map((month) => (
                                    <li
                                        key={month.month}
                                        className="flex flex-col gap-1.5"
                                    >
                                        <div className="flex justify-between gap-3 text-sm">
                                            <span>{month.month}</span>
                                            <span className="font-mono font-semibold">
                                                {formatFc(month.value)}
                                            </span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-divider">
                                            <div
                                                className={cn(
                                                    'h-full',
                                                    month.isExpired
                                                        ? 'bg-danger'
                                                        : 'bg-warning-dot',
                                                )}
                                                style={{
                                                    width: `${Math.round((month.value / highestExpiringValue) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-ink-muted">
                                            {month.detail}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={adjustments()}
                                className="text-sm font-semibold text-primary hover:text-primary-hover"
                            >
                                Gérer les lots
                            </Link>
                        </Card>

                        <Card title="Autres rapports">
                            <ul className="flex flex-col gap-2.5">
                                {otherReports.map((report) => (
                                    <li key={report}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                showNotAvailableYet(report)
                                            }
                                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-input bg-background px-3 text-left text-sm font-semibold text-ink hover:bg-divider"
                                        >
                                            {report}
                                            <span className="text-ink-muted">
                                                PDF · Excel
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>
            </PageContent>
        </>
    );
}
