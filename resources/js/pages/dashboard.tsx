import { Link, usePage } from '@inertiajs/react';
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
import { useInitials } from '@/hooks/use-initials';
import { formatLongDate, formatNumber } from '@/lib/format';
import {
    alertCount,
    dashboardTiles,
    devices,
    recentDeliveries,
    stockAlerts,
} from '@/lib/mock/dashboard';
import type { AlertKind, StockAlert } from '@/lib/mock/dashboard';
import { fcPerUsd } from '@/lib/mock/medicines';
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
        render: (alert) => alert.stock,
    },
    {
        key: 'threshold',
        header: 'Seuil',
        width: '90px',
        align: 'right',
        render: (alert) => (
            <span className="text-ink-muted">{alert.threshold}</span>
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

export default function Dashboard() {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');

    const visibleAlerts = stockAlerts.filter((alert) =>
        alertFilterKinds[alertFilter].includes(alert.kind),
    );

    return (
        <>
            <PageHeader
                title="Tableau de bord"
                subtitle={formatLongDate(new Date())}
                actions={
                    <>
                        <Link
                            href={settings()}
                            className="flex h-10 items-center gap-2 rounded-input bg-background px-3.5 text-sm text-ink hover:bg-divider"
                        >
                            <span className="text-ink-muted">Taux du jour</span>
                            <span className="font-mono font-semibold">
                                1 USD = {formatNumber(fcPerUsd)} FC
                            </span>
                        </Link>
                        <div className="flex items-center gap-2.5 text-sm">
                            <div
                                className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-[13px] font-bold text-on-primary-soft"
                                aria-hidden
                            >
                                {getInitials(auth.user.name)}
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {auth.user.name}
                                </div>
                                <div className="text-xs text-ink-muted">
                                    Pharmacien
                                </div>
                            </div>
                        </div>
                    </>
                }
            />
            <PageContent>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
                    <StatTile
                        label="Ventes du jour"
                        value={dashboardTiles.salesToday.value}
                        sub={dashboardTiles.salesToday.sub}
                        href={sales()}
                    />
                    <StatTile
                        label="Valeur du stock"
                        value={dashboardTiles.stockValue.value}
                        sub={dashboardTiles.stockValue.sub}
                        href={medicines()}
                    />
                    <StatTile
                        label="Ruptures"
                        value={dashboardTiles.outOfStock.value}
                        sub={dashboardTiles.outOfStock.sub}
                        tone="danger"
                        href={medicines()}
                    />
                    <StatTile
                        label="Stock bas"
                        value={dashboardTiles.lowStock.value}
                        sub={dashboardTiles.lowStock.sub}
                        tone="warning"
                        href={medicines()}
                    />
                    <StatTile
                        label="Expire < 90 jours"
                        value={dashboardTiles.expiringSoon.value}
                        sub={dashboardTiles.expiringSoon.sub}
                        tone="warning"
                        href={adjustments()}
                    />
                    <StatTile
                        label="Expirés"
                        value={dashboardTiles.expired.value}
                        sub={dashboardTiles.expired.sub}
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
                                Voir les {alertCount} alertes
                            </Link>
                        </div>
                    </Card>

                    <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                        <Card title="Dernières réceptions">
                            <ul className="flex flex-col gap-3">
                                {recentDeliveries.map((delivery) => (
                                    <li
                                        key={delivery.reference}
                                        className="flex justify-between gap-3 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-mono font-semibold">
                                                {delivery.reference}
                                            </div>
                                            <div className="text-xs text-ink-muted">
                                                {delivery.supplier}
                                            </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                            <div className="font-mono">
                                                {delivery.lineCount} lignes
                                            </div>
                                            <div className="text-xs text-ink-muted">
                                                {delivery.date}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
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
                                        key={device.name}
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
