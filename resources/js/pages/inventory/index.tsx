import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { FilterChips } from '@/components/backoffice/filter-chips';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { SearchInput } from '@/components/backoffice/search-input';
import { StatTile } from '@/components/backoffice/stat-tile';
import { formatNumber, formatSigned, formatSignedFc } from '@/lib/format';
import type { InventoryCountData, InventoryLine } from '@/lib/inventory';
import { cn } from '@/lib/utils';
import { close, print, store } from '@/routes/inventory';
import { update as updateLine } from '@/routes/inventory/lines';

type InventoryIndexProps = {
    /** The open count, or null when none is running. */
    count: InventoryCountData | null;
    /** Its lots, by medicine then expiry. */
    lines: InventoryLine[];
    /** When the last count was closed (ISO), or null. */
    lastClosedAt: string | null;
};

type CountFilter = 'all' | 'differences' | 'uncounted';

/** Counted units typed per line; an empty string means not counted. */
type Counts = Record<number, string>;

function parseCount(text: string | undefined): number | null {
    const digits = (text ?? '').replace(/\s/g, '');

    return /^\d+$/.test(digits) ? Number(digits) : null;
}

const dateTime = (iso: string) =>
    new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
        .format(new Date(iso))
        .replace(' ', ' à ');

export default function InventoryIndex({
    count,
    lines,
    lastClosedAt,
}: InventoryIndexProps) {
    if (count === null) {
        return <NoCountOpen lastClosedAt={lastClosedAt} />;
    }

    return <OpenCount key={count.id} count={count} lines={lines} />;
}

function NoCountOpen({ lastClosedAt }: { lastClosedAt: string | null }) {
    const [isStarting, setIsStarting] = useState(false);

    const start = () => {
        router.post(
            store(),
            {},
            {
                onStart: () => setIsStarting(true),
                onFinish: () => setIsStarting(false),
            },
        );
    };

    return (
        <>
            <PageHeader
                title="Inventaire"
                subtitle={
                    lastClosedAt
                        ? `Dernier inventaire clôturé le ${dateTime(lastClosedAt)}`
                        : 'Aucun inventaire encore réalisé'
                }
            />
            <PageContent>
                <Card isRoomy className="max-w-[640px]">
                    <p className="text-sm text-ink-muted">
                        L'inventaire liste chaque lot en stock avec la quantité
                        attendue par le système. Comptez les rayons, saisissez
                        les quantités, puis clôturez : chaque écart devient un
                        ajustement signé à votre nom.
                    </p>
                    <Button
                        size="large"
                        className="self-start px-[22px]"
                        disabled={isStarting}
                        onClick={start}
                    >
                        Démarrer l'inventaire
                    </Button>
                </Card>
            </PageContent>
        </>
    );
}

function OpenCount({
    count,
    lines,
}: {
    count: InventoryCountData;
    lines: InventoryLine[];
}) {
    const [counts, setCounts] = useState<Counts>(() =>
        Object.fromEntries(
            lines.map((line) => [
                line.id,
                line.counted_units === null ? '' : String(line.counted_units),
            ]),
        ),
    );
    const [saved, setSaved] = useState<Counts>(counts);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<CountFilter>('all');
    const [isClosing, setIsClosing] = useState(false);

    const differenceOf = (line: InventoryLine): number | null => {
        const counted = parseCount(counts[line.id]);

        return counted === null ? null : counted - line.expected_units;
    };
    const isInvalid = (line: InventoryLine) =>
        (counts[line.id] ?? '').trim() !== '' &&
        parseCount(counts[line.id]) === null;

    const countedLots = lines.filter(
        (line) => differenceOf(line) !== null,
    ).length;
    const uncountedLots = lines.length - countedLots;
    const linesWithDifference = lines.filter((line) => {
        const difference = differenceOf(line);

        return difference !== null && difference !== 0;
    });
    const differenceValue = Math.round(
        linesWithDifference.reduce(
            (sum, line) =>
                sum + (differenceOf(line) ?? 0) * Number(line.unit_cost),
            0,
        ),
    );
    const progressPercent =
        lines.length === 0 ? 0 : Math.round((countedLots / lines.length) * 100);

    const query = search.trim().toLowerCase();
    const visibleLines = lines.filter((line) => {
        const difference = differenceOf(line);
        const matchesFilter =
            filter === 'all' ||
            (filter === 'differences' &&
                difference !== null &&
                difference !== 0) ||
            (filter === 'uncounted' && difference === null);
        const matchesSearch =
            query === '' ||
            `${line.medicine} ${line.lot_number} ${line.shelf ?? ''}`
                .toLowerCase()
                .includes(query);

        return matchesFilter && matchesSearch;
    });

    /** Saves a line when the user leaves its box, if it changed and reads as a number (or is blank). */
    const saveLine = (line: InventoryLine) => {
        const text = (counts[line.id] ?? '').trim();
        if (text === (saved[line.id] ?? '') || isInvalid(line)) {
            return;
        }

        router.patch(
            updateLine(line.id),
            { counted_units: text },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['lines'],
                onSuccess: () =>
                    setSaved((current) => ({ ...current, [line.id]: text })),
            },
        );
    };

    const closeCount = () => {
        const message =
            linesWithDifference.length === 0
                ? 'Clôturer l’inventaire ? Aucun écart ne sera enregistré.'
                : `Clôturer l’inventaire ? ${linesWithDifference.length} ${linesWithDifference.length === 1 ? 'écart deviendra un ajustement' : 'écarts deviendront des ajustements'} signés à votre nom. Les lots non comptés gardent leur quantité.`;

        if (!window.confirm(message)) {
            return;
        }

        router.post(
            close(count.id),
            {},
            {
                onStart: () => setIsClosing(true),
                onFinish: () => setIsClosing(false),
            },
        );
    };

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
                <span className="font-mono text-[13px]">{line.lot_number}</span>
            ),
        },
        {
            key: 'shelf',
            header: 'Rayon',
            width: '70px',
            render: (line) =>
                line.shelf ? (
                    <span className="text-ink-muted">{line.shelf}</span>
                ) : (
                    <span className="text-ink-faint">—</span>
                ),
        },
        {
            key: 'system',
            header: 'Système',
            width: '110px',
            align: 'right',
            render: (line) => formatNumber(line.expected_units),
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
                    onBlur={() => saveLine(line)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.currentTarget.blur();
                        }
                    }}
                    placeholder="—"
                    aria-label={`Quantité comptée, ${line.medicine} lot ${line.lot_number}`}
                    aria-invalid={isInvalid(line) ? true : undefined}
                    className={cn(
                        'h-10 w-24 rounded-chip border-[1.5px] border-border-strong bg-surface px-2.5 text-right font-mono text-sm outline-none placeholder:text-ink-muted focus:border-primary',
                        isInvalid(line) && 'border-danger focus:border-danger',
                    )}
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
                            : formatSignedFc(
                                  Math.round(
                                      difference * Number(line.unit_cost),
                                  ),
                              )}
                    </span>
                );
            },
        },
    ];

    const title = `Inventaire · ${new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(count.started_at))}`;

    return (
        <>
            <PageHeader
                title={title}
                subtitle={
                    <>
                        Ouvert le{' '}
                        <span className="font-mono">
                            {dateTime(count.started_at)}
                        </span>
                    </>
                }
                actions={
                    <a
                        href={print(count.id).url}
                        target="_blank"
                        rel="noopener"
                        className={buttonVariants({ variant: 'secondary' })}
                    >
                        Imprimer la feuille de comptage
                    </a>
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
                                {formatNumber(countedLots)} /{' '}
                                {formatNumber(lines.length)} lots
                            </span>
                        </div>
                        <div
                            role="progressbar"
                            aria-labelledby="inventory-progress-label"
                            aria-valuemin={0}
                            aria-valuemax={lines.length}
                            aria-valuenow={countedLots}
                            className="h-2.5 overflow-hidden rounded-full bg-divider"
                        >
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-[13px] text-ink-muted">
                            {uncountedLots === 0
                                ? 'Tous les lots sont comptés'
                                : `${formatNumber(uncountedLots)} ${uncountedLots === 1 ? 'lot restant' : 'lots restants'} à compter`}
                        </p>
                    </div>
                    <StatTile
                        label="Lots avec écart"
                        value={formatNumber(linesWithDifference.length)}
                        isCompact
                        isLabelMuted
                        className="flex-[1_1_160px]"
                    />
                    <StatTile
                        label="Valeur des écarts"
                        value={formatSignedFc(differenceValue)}
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
                                count: linesWithDifference.length,
                            },
                            {
                                value: 'uncounted',
                                label: 'Non comptés',
                                count: uncountedLots,
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
                        rowKey={(line) => String(line.id)}
                        minWidth={860}
                        caption="Lots à compter"
                        emptyMessage={
                            lines.length === 0
                                ? 'Aucun lot en stock à compter'
                                : 'Aucun lot ne correspond à ces filtres'
                        }
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
                        disabled={isClosing}
                        onClick={closeCount}
                    >
                        Clôturer l'inventaire
                    </Button>
                </div>
            </PageContent>
        </>
    );
}
