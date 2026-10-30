import { Link, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/backoffice/badge';
import type { BadgeTone } from '@/components/backoffice/badge';
import { ButtonLink } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { FilterChips } from '@/components/backoffice/filter-chips';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { StatTile } from '@/components/backoffice/stat-tile';
import { formatCompactAmount } from '@/lib/dashboard';
import type { AlertKind, DashboardSummary, StockAlert } from '@/lib/dashboard';
import { formatLongDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { index as adjustments } from '@/routes/adjustments';
import { index as medicines } from '@/routes/medicines';
import { edit as settings } from '@/routes/profile';
import { create as newReception } from '@/routes/receptions';
import { sales } from '@/routes/reports';

type AlertFilter = 'all' | 'out' | 'low' | 'expiry';

const alertFilterKinds: Record<AlertFilter, AlertKind[]> = {
    all: ['out', 'low', 'expiring', 'expired'],
    out: ['out'],
    low: ['low'],
    expiry: ['expiring', 'expired'],
};

const alertDisplay: Record<
    AlertKind,
    { badge: string; tone: BadgeTone; action: string; isReception: boolean }
> = {
    out: {
        badge: 'Rupture',
        tone: 'danger',
        action: 'Commander',
        isReception: true,
    },
    low: {
        badge: 'Stock bas',
        tone: 'warning',
        action: 'Commander',
        isReception: true,
    },
    expiring: {
        badge: 'Expire bientôt',
        tone: 'warning',
        action: 'Voir le lot',
        isReception: false,
    },
    expired: {
        badge: 'Expiré',
        tone: 'danger',
        action: 'Retirer',
        isReception: false,
    },
};

const alertColumns: DataTableColumn<StockAlert>[] = [
    {
        key: 'name',
        header: 'Médicament',
        render: (alert) => (
            <CellLines main={alert.name} detail={alert.detail} />
        ),
    },
    {
        key: 'stock',
        header: 'Stock',
        width: '110px',
        align: 'right',
        render: (alert) => formatNumber(alert.stock),
    },
    {
        key: 'threshold',
        header: 'Seuil',
        width: '90px',
        align: 'right',
        render: (alert) => (
            <span className="text-ink-muted">
                {alert.threshold === null ? '—' : formatNumber(alert.threshold)}
            </span>
        ),
    },
    {
        key: 'alert',
        header: 'Alerte',
        width: '130px',
        render: (alert) => (
            <Badge tone={alertDisplay[alert.kind].tone}>
                {alertDisplay[alert.kind].badge}
            </Badge>
        ),
    },
    {
        key: 'action',
        header: 'Action',
        width: '120px',
        isHeaderHidden: true,
        render: (alert) => {
            const display = alertDisplay[alert.kind];

            return (
                <div className="text-right">
                    <Link
                        href={
                            display.isReception ? newReception() : adjustments()
                        }
                        className="text-[13px] font-semibold text-primary hover:text-primary-hover"
                    >
                        {display.action}
                    </Link>
                </div>
            );
        },
    },
];

type DashboardProps = {
    summary: DashboardSummary;
    /** 1 USD in CDF in force today, or null when no rate is recorded. */
    exchangeRate: string | null;
    /** "YYYY-MM-DD", server date. */
    today: string;
};

/** "23/10" from "2026-10-23". */
const dayMonth = (isoDate: string) =>
    `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;

/** "Hors ligne depuis 09:15" today, "depuis le 29/10" before; "Jamais synchronisé" without a sync. */
function deviceStatus(
    isOnline: boolean,
    lastSyncAt: string | null,
    today: string,
): string {
    if (isOnline) {
        return 'En ligne';
    }
    if (lastSyncAt === null) {
        return 'Jamais synchronisé';
    }

    const lastSync = new Date(lastSyncAt);
    const localDate = `${lastSync.getFullYear()}-${String(lastSync.getMonth() + 1).padStart(2, '0')}-${String(lastSync.getDate()).padStart(2, '0')}`;

    return localDate === today
        ? `Hors ligne depuis ${new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(lastSync)}`
        : `Hors ligne depuis le ${dayMonth(localDate)}`;
}

export default function Dashboard({
    summary,
    exchangeRate,
    today,
}: DashboardProps) {
    const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');

    // Sales, stock and device status change while the page is open (tablets sync every minute).
    usePoll(30_000, { only: ['summary'] });

    const { counts } = summary;
    const alertCount =
        counts.out + counts.low + counts.expiring + counts.expired;
    const visibleAlerts = summary.alerts.filter((alert) =>
        alertFilterKinds[alertFilter].includes(alert.kind),
    );
    const devices = [
        ...summary.devices.map((device) => ({
            key: device.id,
            name: device.name,
            isOnline: device.is_online,
            status: [
                device.user_name,
                deviceStatus(device.is_online, device.last_sync_at, today),
            ]
                .filter(Boolean)
                .join(' · '),
        })),
        {
            key: 'this-browser',
            name: 'Ce navigateur',
            isOnline: true,
            status: 'En ligne · cette session',
        },
    ];

    return (
        <>
            <PageHeader
                title="Tableau de bord"
                subtitle={formatLongDate(new Date())}
                actions={
                    <Link
                        href={settings()}
                        className="flex h-[38px] items-center gap-2 rounded bg-surface px-3 text-sm text-ink-body shadow-card hover:bg-surface-muted"
                    >
                        <span className="text-ink-muted">Taux du jour</span>
                        <span className="font-semibold text-ink tabular-nums">
                            {exchangeRate
                                ? `1 USD = ${formatNumber(Number(exchangeRate))} FC`
                                : '—'}
                        </span>
                    </Link>
                }
            />
            <PageContent>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-6">
                    <StatTile
                        label="Ventes du jour"
                        value={formatNumber(Number(summary.sales_today.total))}
                        sub={`FC · ${formatNumber(summary.sales_today.tickets)} ${summary.sales_today.tickets === 1 ? 'ticket' : 'tickets'}`}
                        href={sales()}
                    />
                    <StatTile
                        label="Valeur du stock"
                        value={formatCompactAmount(Number(summary.stock_value))}
                        sub="FC · prix d'achat"
                        href={medicines()}
                    />
                    <StatTile
                        label="Ruptures"
                        value={formatNumber(counts.out)}
                        sub="médicaments à 0"
                        tone="danger"
                        href={medicines({ query: { filter: 'out' } })}
                    />
                    <StatTile
                        label="Stock bas"
                        value={formatNumber(counts.low)}
                        sub="sous le seuil"
                        tone="warning"
                        href={medicines({ query: { filter: 'low' } })}
                    />
                    <StatTile
                        label="Expire < 90 jours"
                        value={formatNumber(counts.expiring)}
                        sub={counts.expiring === 1 ? 'lot' : 'lots'}
                        tone="warning"
                        href={adjustments()}
                    />
                    <StatTile
                        label="Expirés"
                        value={formatNumber(counts.expired)}
                        sub={
                            counts.expired === 1
                                ? 'lot à retirer'
                                : 'lots à retirer'
                        }
                        tone="danger"
                        href={adjustments()}
                    />
                </div>

                <div className="flex flex-wrap items-start gap-5">
                    <Card
                        title="À traiter"
                        isPadded={false}
                        className="flex-[2_1_560px]"
                        actions={
                            <FilterChips
                                label="Filtrer les alertes"
                                options={[
                                    {
                                        value: 'all',
                                        label: 'Tout',
                                        count: alertCount,
                                    },
                                    { value: 'out', label: 'Ruptures' },
                                    { value: 'low', label: 'Stock bas' },
                                    { value: 'expiry', label: 'Péremptions' },
                                ]}
                                selected={alertFilter}
                                onSelect={setAlertFilter}
                                isCompact
                            />
                        }
                    >
                        <DataTable
                            columns={alertColumns}
                            rows={visibleAlerts}
                            rowKey={(alert) => alert.id}
                            minWidth={620}
                            caption="Alertes à traiter"
                            emptyMessage="Aucune alerte"
                        />
                        <div className="px-5 py-3.5">
                            <Link
                                href={medicines()}
                                className="text-sm font-semibold text-primary hover:text-primary-hover"
                            >
                                Voir les {formatNumber(alertCount)} alertes
                            </Link>
                        </div>
                    </Card>

                    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                        <Card title="Dernières réceptions">
                            {summary.receptions.length === 0 ? (
                                <p className="text-sm text-ink-muted">
                                    Aucune réception validée.
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {summary.receptions.map((delivery) => (
                                        <li
                                            key={delivery.id}
                                            className="flex justify-between gap-3 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <div className="font-mono font-semibold">
                                                    {delivery.reference ?? '—'}
                                                </div>
                                                <div className="text-xs text-ink-muted">
                                                    {delivery.supplier ?? '—'}
                                                </div>
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <div className="font-mono">
                                                    {delivery.line_count}{' '}
                                                    {delivery.line_count === 1
                                                        ? 'ligne'
                                                        : 'lignes'}
                                                </div>
                                                <div className="text-xs text-ink-muted">
                                                    {delivery.received_on ===
                                                    today
                                                        ? "Aujourd'hui"
                                                        : dayMonth(
                                                              delivery.received_on,
                                                          )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <ButtonLink
                                href={newReception()}
                                className="mt-1 w-full text-[15px]"
                            >
                                Nouvelle réception
                            </ButtonLink>
                        </Card>

                        <Card title="Appareils">
                            <ul className="flex flex-col gap-3">
                                {devices.map((device) => (
                                    <li
                                        key={device.key}
                                        className="flex items-center gap-2.5"
                                    >
                                        <span
                                            className={cn(
                                                'size-2.5 shrink-0 rounded-full',
                                                device.isOnline
                                                    ? 'bg-primary'
                                                    : 'bg-warning-dot',
                                            )}
                                            aria-hidden
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold">
                                                {device.name}
                                            </div>
                                            <div className="text-xs text-ink-muted">
                                                {device.status}
                                            </div>
                                        </div>
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
