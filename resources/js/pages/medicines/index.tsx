import { Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Badge } from '@/components/backoffice/badge';
import type { BadgeTone } from '@/components/backoffice/badge';
import { ButtonLink } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { FilterChips } from '@/components/backoffice/filter-chips';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { Pagination } from '@/components/backoffice/pagination';
import { SearchInput } from '@/components/backoffice/search-input';
import { formatFc, formatNumber } from '@/lib/format';
import type {
    CategoryOption,
    MedicineListFilter,
    MedicineRow,
    Paginated,
    StockStatus,
} from '@/lib/medicines';
import { create, edit, index } from '@/routes/medicines';
import { create as stockImport } from '@/routes/stock-import';

const statusDisplay: Record<StockStatus, { label: string; tone: BadgeTone }> = {
    ok: { label: 'OK', tone: 'ok' },
    low: { label: 'Stock bas', tone: 'warning' },
    out: { label: 'Rupture', tone: 'danger' },
};

/** Waits this long after the last keystroke before searching. */
const searchDelayMs = 300;

/** "1 840 u · 184 bt", or "30 u" for products sold one by one. */
function stockLabel(medicine: MedicineRow): string {
    if (medicine.sellable_units === 0) {
        return '0';
    }
    if (medicine.units_per_pack === 1) {
        return `${formatNumber(medicine.sellable_units)} u`;
    }

    return `${formatNumber(medicine.sellable_units)} u · ${formatNumber(medicine.sellable_packs)} bt`;
}

const columns: DataTableColumn<MedicineRow>[] = [
    {
        key: 'name',
        header: 'Médicament',
        render: (medicine) => (
            <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-input bg-background">
                    {medicine.image_url ? (
                        <img
                            src={medicine.image_url}
                            alt=""
                            loading="lazy"
                            className="size-9 object-contain"
                        />
                    ) : null}
                </div>
                <CellLines
                    main={
                        <span className="flex items-center gap-2">
                            {medicine.name}
                            {medicine.prescription_required ? (
                                <abbr
                                    title="Sur ordonnance"
                                    className="text-[11px] font-bold text-rx no-underline"
                                >
                                    Rx
                                </abbr>
                            ) : null}
                        </span>
                    }
                    detail={
                        [medicine.dci, medicine.form]
                            .filter(Boolean)
                            .join(' · ') || undefined
                    }
                />
            </div>
        ),
    },
    {
        key: 'category',
        header: 'Catégorie',
        width: '130px',
        render: (medicine) => (
            <span className="text-ink-muted">
                {medicine.categories.join(', ') || '—'}
            </span>
        ),
    },
    {
        key: 'units',
        header: 'Unités / bte',
        width: '90px',
        align: 'right',
        render: (medicine) => medicine.units_per_pack,
    },
    {
        key: 'boxPrice',
        header: 'Prix boîte',
        width: '110px',
        align: 'right',
        render: (medicine) => formatFc(Number(medicine.sale_price_pack)),
    },
    {
        key: 'unitPrice',
        header: 'Prix unité',
        width: '100px',
        align: 'right',
        render: (medicine) =>
            medicine.sale_price_unit === null
                ? '—'
                : formatFc(Number(medicine.sale_price_unit)),
    },
    {
        key: 'stock',
        header: 'Stock',
        width: '140px',
        align: 'right',
        render: (medicine) => (
            <>
                <div>{stockLabel(medicine)}</div>
                <div className="font-sans text-xs text-ink-muted">
                    seuil{' '}
                    <span className="font-mono">
                        {formatNumber(medicine.min_stock_units)}
                    </span>
                </div>
            </>
        ),
    },
    {
        key: 'status',
        header: 'Statut',
        width: '120px',
        render: (medicine) => {
            const display = statusDisplay[medicine.stock_status];

            return <Badge tone={display.tone}>{display.label}</Badge>;
        },
    },
    {
        key: 'edit',
        header: 'Action',
        width: '70px',
        isHeaderHidden: true,
        render: (medicine) => (
            <div className="text-right">
                <Link
                    href={edit(medicine.id)}
                    className="text-[13px] font-semibold text-primary hover:text-primary-hover"
                    aria-label={`Modifier ${medicine.name}`}
                >
                    Modifier
                </Link>
            </div>
        ),
    },
];

type MedicinesIndexProps = {
    medicines: Paginated<MedicineRow>;
    categories: CategoryOption[];
    filters: { search: string; category: string; filter: MedicineListFilter };
    activeCount: number;
};

export default function MedicinesIndex({
    medicines,
    categories,
    filters,
    activeCount,
}: MedicinesIndexProps) {
    const categoryId = useId();
    const [search, setSearch] = useState(filters.search);
    const isFirstRender = useRef(true);

    /** Reloads the list with new filters, back on page 1; the filters live in the URL. */
    const applyFilters = (changes: Partial<MedicinesIndexProps['filters']>) => {
        const next = { ...filters, search, ...changes };
        const query = Object.fromEntries(
            Object.entries(next).filter(
                ([key, value]) =>
                    value !== '' && !(key === 'filter' && value === 'all'),
            ),
        );

        router.get(index.url({ query }), undefined, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return undefined;
        }

        const timer = setTimeout(() => applyFilters({ search }), searchDelayMs);

        return () => clearTimeout(timer);
        // Only a change of the typed text triggers this search.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <>
            <PageHeader
                title="Médicaments"
                subtitle={`${formatNumber(activeCount)} médicaments · prix synchronisés avec la caisse`}
                actions={
                    <>
                        <ButtonLink href={stockImport()} variant="secondary">
                            Importer (Excel)
                        </ButtonLink>
                        <ButtonLink href={create()}>
                            <Plus strokeWidth={2.6} aria-hidden />
                            Nouveau médicament
                        </ButtonLink>
                    </>
                }
            />
            <PageContent>
                <div className="-mb-1 flex flex-wrap items-center gap-2.5">
                    <SearchInput
                        label="Rechercher un médicament"
                        placeholder="Nom, molécule ou code-barres"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="flex-[1_1_280px]"
                    />
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor={categoryId}
                            className="text-[13px] text-ink-muted"
                        >
                            Catégorie
                        </label>
                        <select
                            id={categoryId}
                            value={filters.category}
                            onChange={(event) =>
                                applyFilters({ category: event.target.value })
                            }
                            className="h-11 rounded-control bg-surface px-2.5 text-sm text-ink shadow-card outline-none focus-visible:outline-2 focus-visible:outline-primary"
                        >
                            <option value="">Toutes</option>
                            {categories.map((category) => (
                                <option
                                    key={category.slug}
                                    value={category.slug}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <FilterChips
                        label="Filtrer les médicaments"
                        options={[
                            { value: 'all', label: 'Tous' },
                            { value: 'out', label: 'Ruptures' },
                            { value: 'low', label: 'Stock bas' },
                            { value: 'prescription', label: 'Ordonnance' },
                        ]}
                        selected={filters.filter}
                        onSelect={(filter: MedicineListFilter) =>
                            applyFilters({ filter })
                        }
                    />
                </div>

                <Card isPadded={false} className="overflow-hidden">
                    <DataTable
                        columns={columns}
                        rows={medicines.data}
                        rowKey={(medicine) => medicine.id}
                        minWidth={900}
                        caption="Liste des médicaments"
                        emptyMessage="Aucun médicament ne correspond à ces filtres"
                    />
                    <Pagination
                        from={medicines.meta.from ?? 0}
                        to={medicines.meta.to ?? 0}
                        total={medicines.meta.total}
                        previousHref={medicines.links.prev ?? undefined}
                        nextHref={medicines.links.next ?? undefined}
                    />
                </Card>
            </PageContent>
        </>
    );
}
