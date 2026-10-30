import { Link } from '@inertiajs/react';
import { Badge } from '@/components/backoffice/badge';
import type { BadgeTone } from '@/components/backoffice/badge';
import { buttonVariants } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatFc, formatNumber } from '@/lib/format';
import { showNotAvailableYet } from '@/lib/not-available';
import { monthLabel } from '@/lib/reports';
import type { ConsumptionReportData, ConsumptionRow } from '@/lib/reports';
import { cn } from '@/lib/utils';
import { index as adjustments } from '@/routes/adjustments';
import {
    exportMethod as exportConsumption,
    order,
} from '@/routes/reports/consumption';

type ConsumptionReportProps = {
    report: ConsumptionReportData;
    /** "À commander" aims for this many months of cover. */
    targetCoverMonths: number;
};

const otherReports = [
    'État du stock',
    'Achats par fournisseur',
    'Inventaires clôturés',
    'Mouvements par lot',
    'Produits les plus utilisés',
];

function coverTone(cover: number | null): BadgeTone {
    if (cover === null) {
        return 'ok';
    }
    if (cover < 0.5) {
        return 'danger';
    }

    return cover < 1 ? 'warning' : 'ok';
}

function formatCover(cover: number | null): string {
    if (cover === null) {
        return '—';
    }

    return cover < 0.05
        ? '0 mois'
        : `${cover.toFixed(1).replace('.', ',')} mois`;
}

/** "2026-05" → "mai". */
const shortMonth = (month: string) => monthLabel(month, false);

/** "mai" → "mai", "octobre" → "oct.". */
const abbreviatedMonth = (month: string) => {
    const label = shortMonth(month);

    return label.length > 4 ? `${label.slice(0, 3)}.` : label;
};

function Sparkline({
    values,
    months,
    label,
}: {
    values: number[];
    months: string[];
    label: string;
}) {
    const highest = Math.max(...values, 1);

    return (
        <div
            role="img"
            aria-label={label}
            className="flex h-[30px] items-end gap-1"
        >
            {values.map((units, index) => (
                <div
                    key={months[index]}
                    className={cn(
                        'flex-1 rounded-[2px]',
                        index === values.length - 1
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

export default function ConsumptionReport({
    report,
    targetCoverMonths,
}: ConsumptionReportProps) {
    const { months, rows, expiring } = report;
    const firstMonth = months[0] ?? '';
    const lastMonth = months.at(-1) ?? '';
    const highestExpiringValue = Math.max(
        ...expiring.map((month) => Number(month.value)),
        1,
    );

    const columns: DataTableColumn<ConsumptionRow>[] = [
        {
            key: 'medicine',
            header: 'Médicament',
            render: (row) => (
                <CellLines
                    main={row.medicine}
                    detail={
                        row.units_per_pack > 1
                            ? `en unités · boîte de ${row.units_per_pack}`
                            : 'en unités'
                    }
                />
            ),
        },
        {
            key: 'trend',
            header: `${abbreviatedMonth(firstMonth).replace(/^./, (letter) => letter.toUpperCase())} → ${abbreviatedMonth(lastMonth)}`,
            width: '150px',
            render: (row) => (
                <Sparkline
                    values={row.months}
                    months={months}
                    label={`${row.medicine} : de ${row.months[0] ?? 0} à ${row.months.at(-1) ?? 0} unités par mois`}
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
                <Badge tone={coverTone(row.cover_months)} isMono>
                    {formatCover(row.cover_months)}
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
                    {row.order_packs > 0
                        ? `${formatNumber(row.order_packs)} ${row.order_packs === 1 ? 'bte' : 'btes'}`
                        : '—'}
                </span>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Consommation et péremptions"
                subtitle={
                    <>
                        <span className="font-mono">{months.length}</span>{' '}
                        derniers mois · sert à préparer les commandes
                    </>
                }
                actions={
                    <>
                        <a
                            href={exportConsumption().url}
                            className={buttonVariants({ variant: 'secondary' })}
                        >
                            Exporter Excel
                        </a>
                        <a href={order().url} className={buttonVariants()}>
                            Bon de commande suggéré
                        </a>
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
                            rowKey={(row) => row.medicine_id}
                            minWidth={820}
                            caption="Consommation mensuelle et couverture du stock"
                            emptyMessage="Aucune vente sur ces mois"
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
                                {expiring.map((month) => {
                                    const name = month.is_expired
                                        ? 'Expirés'
                                        : (() => {
                                              const label = shortMonth(
                                                  month.month ?? '',
                                              );

                                              return (
                                                  label
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  label.slice(1)
                                              );
                                          })();
                                    const detail =
                                        month.lot_count === 0
                                            ? 'Aucun lot'
                                            : month.lot_count === 1 &&
                                                month.first_lot
                                              ? `${month.first_lot.medicine} ${month.first_lot.lot_number} · ${formatNumber(month.first_lot.units)} u`
                                              : `${formatNumber(month.lot_count)} lots${month.is_expired ? ' · à retirer' : ''}`;

                                    return (
                                        <li
                                            key={month.month ?? 'expired'}
                                            className="flex flex-col gap-1.5"
                                        >
                                            <div className="flex justify-between gap-3 text-sm">
                                                <span>{name}</span>
                                                <span className="font-mono font-semibold">
                                                    {formatFc(
                                                        Number(month.value),
                                                    )}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-divider">
                                                <div
                                                    className={cn(
                                                        'h-full',
                                                        month.is_expired
                                                            ? 'bg-danger'
                                                            : 'bg-warning-dot',
                                                    )}
                                                    style={{
                                                        width: `${Math.round((Number(month.value) / highestExpiringValue) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="text-xs text-ink-muted">
                                                {detail}
                                            </div>
                                        </li>
                                    );
                                })}
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
