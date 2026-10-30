import { useState } from 'react';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { FilterChips } from '@/components/backoffice/filter-chips';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { SearchInput } from '@/components/backoffice/search-input';
import { StatTile } from '@/components/backoffice/stat-tile';
import { formatNumber, formatSigned, formatSignedFc } from '@/lib/format';
import { inventoryLines, inventorySession } from '@/lib/mock/inventory';
import type { InventoryLine } from '@/lib/mock/inventory';
import { showNotAvailableYet } from '@/lib/not-available';
import { cn } from '@/lib/utils';

type CountFilter = 'all' | 'differences' | 'uncounted';

/** Counted units typed per lot; an empty string means not counted. */
type Counts = Record<string, string>;

function parseCount(text: string | undefined): number | null {
    const digits = (text ?? '').replace(/\s/g, '');

    return /^\d+$/.test(digits) ? Number(digits) : null;
}

export default function InventoryIndex() {
    const [counts, setCounts] = useState<Counts>(() =>
        Object.fromEntries(
            inventoryLines.map((line) => [
                line.id,
                line.countedUnits === null ? '' : String(line.countedUnits),
            ]),
        ),
    );
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<CountFilter>('all');

    const differenceOf = (line: InventoryLine): number | null => {
        const counted = parseCount(counts[line.id]);

        return counted === null ? null : counted - line.systemUnits;
    };

    const query = search.trim().toLowerCase();
    const visibleLines = inventoryLines.filter((line) => {
        const difference = differenceOf(line);
        const matchesFilter =
            filter === 'all' ||
            (filter === 'differences' &&
                difference !== null &&
                difference !== 0) ||
            (filter === 'uncounted' && difference === null);
        const matchesSearch =
            query === '' ||
            `${line.medicine} ${line.lotCode} ${line.shelf}`
                .toLowerCase()
                .includes(query);

        return matchesFilter && matchesSearch;
    });

    const progressPercent = Math.round(
        (inventorySession.countedLots / inventorySession.totalLots) * 100,
    );

    const columns: DataTableColumn<InventoryLine>[] = [
        {
            key: 'medicine',
            header: 'Médicament',
            render: (line) => (
                <CellLines
                    main={line.medicine}
                    detail={
                        <>
                            exp.{' '}
                            <span className="font-mono">{line.expiry}</span>
                        </>
                    }
                />
            ),
        },
        {
            key: 'lot',
            header: 'Lot',
            width: '110px',
            render: (line) => (
                <span className="font-mono text-[13px]">{line.lotCode}</span>
            ),
        },
        {
            key: 'shelf',
            header: 'Rayon',
            width: '70px',
            render: (line) => (
                <span className="text-ink-muted">{line.shelf}</span>
            ),
        },
        {
            key: 'system',
            header: 'Système',
            width: '110px',
            align: 'right',
            render: (line) => formatNumber(line.systemUnits),
        },
        {
            key: 'counted',
            header: 'Compté',
            width: '130px',
            align: 'right',
            render: (line) => (
                <input
                    type="text"
                    inputMode="numeric"
                    value={counts[line.id] ?? ''}
                    onChange={(event) =>
                        setCounts((current) => ({
                            ...current,
                            [line.id]: event.target.value,
                        }))
                    }
                    placeholder="—"
                    aria-label={`Quantité comptée, ${line.medicine} lot ${line.lotCode}`}
                    className="h-10 w-24 rounded-chip border-[1.5px] border-border-strong bg-surface px-2.5 text-right font-mono text-sm outline-none placeholder:text-ink-muted focus:border-primary"
                />
            ),
        },
        {
            key: 'difference',
            header: 'Écart',
            width: '100px',
            align: 'right',
            render: (line) => {
                const difference = differenceOf(line);

                if (difference === null) {
                    return (
                        <span className="font-sans text-[13px] text-ink-faint">
                            à compter
                        </span>
                    );
                }

                return (
                    <span
                        className={cn(
                            difference === 0 &&
                                'font-medium text-on-primary-soft',
                            difference > 0 && 'font-bold text-info',
                            difference < 0 && 'font-bold text-danger',
                        )}
                    >
                        {formatSigned(difference)}
                    </span>
                );
            },
        },
        {
            key: 'value',
            header: 'Valeur',
            width: '130px',
            align: 'right',
            render: (line) => {
                const difference = differenceOf(line);

                return (
                    <span className="text-ink-muted">
                        {difference === null
                            ? ''
                            : formatSignedFc(difference * line.unitCost)}
                    </span>
                );
            },
        },
    ];

    return (
        <>
            <PageHeader
                title={inventorySession.title}
                subtitle={
                    <>
                        Ouvert le{' '}
                        <span className="font-mono">
                            {inventorySession.openedAt}
                        </span>{' '}
                        · ventes bloquées sur les produits en cours de comptage
                    </>
                }
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => showNotAvailableYet('Impression')}
                    >
                        Imprimer la feuille de comptage
                    </Button>
                }
            />
            <PageContent>
                <div className="flex flex-wrap gap-3.5">
                    <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-2.5 rounded-card bg-surface px-5 py-[18px] shadow-card">
                        <div className="flex justify-between gap-3 text-sm">
                            <span
                                className="font-semibold"
                                id="inventory-progress-label"
                            >
                                Avancement
                            </span>
                            <span className="font-mono">
                                {formatNumber(inventorySession.countedLots)} /{' '}
                                {formatNumber(inventorySession.totalLots)} lots
                            </span>
                        </div>
                        <div
                            role="progressbar"
                            aria-labelledby="inventory-progress-label"
                            aria-valuemin={0}
                            aria-valuemax={inventorySession.totalLots}
                            aria-valuenow={inventorySession.countedLots}
                            className="h-2.5 overflow-hidden rounded-full bg-divider"
                        >
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-[13px] text-ink-muted">
                            {inventorySession.progressNote}
                        </p>
                    </div>
                    <StatTile
                        label="Lots avec écart"
                        value={formatNumber(
                            inventorySession.lotsWithDifference,
                        )}
                        isCompact
                        isLabelMuted
                        className="flex-[1_1_160px]"
                    />
                    <StatTile
                        label="Valeur des écarts"
                        value={formatSignedFc(inventorySession.differenceValue)}
                        tone="danger"
                        isCompact
                        className="flex-[1_1_160px]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <SearchInput
                        label="Rechercher dans l'inventaire"
                        placeholder="Médicament, lot ou rayon"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="flex-[1_1_260px]"
                    />
                    <FilterChips
                        label="Filtrer les lots"
                        options={[
                            { value: 'all', label: 'Tous' },
                            {
                                value: 'differences',
                                label: 'Écarts seulement',
                                count: inventorySession.lotsWithDifference,
                            },
                            {
                                value: 'uncounted',
                                label: 'Non comptés',
                                count: inventorySession.uncountedLots,
                            },
                        ]}
                        selected={filter}
                        onSelect={setFilter}
                    />
                </div>

                <Card isPadded={false} className="overflow-hidden">
                    <DataTable
                        columns={columns}
                        rows={visibleLines}
                        rowKey={(line) => line.id}
                        minWidth={860}
                        caption="Lots à compter"
                        emptyMessage="Aucun lot ne correspond à ces filtres"
                    />
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                    <p className="flex-[1_1_320px] text-sm text-ink-muted">
                        À la clôture, chaque écart devient un ajustement signé à
                        votre nom. Les lots non comptés gardent leur quantité.
                    </p>
                    <Button
                        variant="secondary"
                        size="large"
                        onClick={() => setFilter('differences')}
                    >
                        Voir la liste des écarts
                    </Button>
                    <Button
                        size="large"
                        className="px-[22px]"
                        onClick={() => showNotAvailableYet('Clôture')}
                    >
                        Clôturer l'inventaire
                    </Button>
                </div>
            </PageContent>
        </>
    );
}
