import { useForm } from '@inertiajs/react';
import { useId } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatFc, formatNumber, formatUsd } from '@/lib/format';
import { medicineForms } from '@/lib/medicines';
import type {
    CategoryOption,
    MedicineFormData,
    MedicineLot,
} from '@/lib/medicines';
import { index, store, update } from '@/routes/medicines';

type MedicineFormProps = {
    /** Set when editing; null for "Nouveau médicament". */
    medicine: MedicineFormData | null;
    /** Sellable lots, first expired first. */
    lots: MedicineLot[];
    /** Cost of one box in the latest lot received, in FC, for the margin. */
    latestCostPerPack: string | null;
    categories: CategoryOption[];
    /** 1 USD in CDF in force today, or null when no rate is recorded. */
    exchangeRate: string | null;
};

type FormData = {
    name: string;
    dci: string;
    dosage: string;
    form: string;
    barcode: string;
    shelf: string;
    units_per_pack: string;
    sale_price_pack: string;
    sells_by_unit: boolean;
    sale_price_unit: string;
    min_stock_units: string;
    prescription_required: boolean;
    category_slugs: string[];
};

/** Digits only, so "2 500" and "2500" both read as 2500. */
function parseAmount(text: string): number | null {
    const digits = text.replace(/\s/g, '');

    return /^\d+$/.test(digits) ? Number(digits) : null;
}

export default function MedicineForm({
    medicine,
    lots,
    latestCostPerPack,
    categories,
    exchangeRate,
}: MedicineFormProps) {
    const form = useForm<FormData>({
        name: medicine?.name ?? '',
        dci: medicine?.dci ?? '',
        dosage: medicine?.dosage ?? '',
        form: medicine?.form ?? '',
        barcode: medicine?.barcode ?? '',
        shelf: medicine?.shelf ?? '',
        units_per_pack: String(medicine?.units_per_pack ?? 1),
        sale_price_pack: medicine
            ? formatNumber(Number(medicine.sale_price_pack))
            : '',
        sells_by_unit: medicine ? medicine.sale_price_unit !== null : true,
        sale_price_unit:
            medicine?.sale_price_unit != null
                ? formatNumber(Number(medicine.sale_price_unit))
                : '',
        min_stock_units: String(medicine?.min_stock_units ?? 0),
        prescription_required: medicine?.prescription_required ?? false,
        category_slugs: medicine?.category_slugs ?? [],
    });
    const { data, setData, errors, processing } = form;

    const boxPrice = parseAmount(data.sale_price_pack);
    const latestCost =
        latestCostPerPack !== null ? Number(latestCostPerPack) : null;
    const marginPercent =
        boxPrice !== null && latestCost !== null && latestCost > 0
            ? Math.floor(((boxPrice - latestCost) / latestCost) * 100)
            : null;
    const unitsPerPack = Math.max(1, parseAmount(data.units_per_pack) ?? 1);

    // The select edits the main (first) category; any others are kept.
    const [mainCategory = '', ...otherCategories] = data.category_slugs;
    const otherCategoryNames = otherCategories
        .map(
            (slug) =>
                categories.find((category) => category.slug === slug)?.name,
        )
        .filter(Boolean)
        .join(', ');
    const formOptions = [
        ...(data.form !== '' &&
        !medicineForms.includes(data.form as (typeof medicineForms)[number])
            ? [data.form]
            : []),
        ...medicineForms,
    ];

    const handleMainCategoryChange = (slug: string) => {
        const others = otherCategories.filter((other) => other !== slug);
        setData('category_slugs', slug === '' ? others : [slug, ...others]);
    };

    const handleSellsByUnitChange = (isChecked: boolean) => {
        setData((current) => ({
            ...current,
            sells_by_unit: isChecked,
            sale_price_unit: isChecked ? current.sale_price_unit : '',
        }));
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(medicine ? update(medicine.id) : store(), {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <PageHeader
                title={medicine ? medicine.name : 'Nouveau médicament'}
                back={{ label: 'Médicaments', href: index() }}
                actions={
                    <>
                        <ButtonLink href={index()} variant="secondary">
                            Annuler
                        </ButtonLink>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="px-[22px]"
                        >
                            Enregistrer
                        </Button>
                    </>
                }
            />
            <PageContent>
                <div className="flex flex-wrap items-start gap-5">
                    <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
                        <Card title="Identification" isRoomy>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-4 gap-y-3.5">
                                <TextField
                                    label="Nom commercial"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                    error={errors.name}
                                />
                                <TextField
                                    label="Molécule (DCI)"
                                    value={data.dci}
                                    onChange={(event) =>
                                        setData('dci', event.target.value)
                                    }
                                    error={errors.dci}
                                />
                                <SelectField
                                    label="Forme"
                                    value={data.form}
                                    onChange={(event) =>
                                        setData('form', event.target.value)
                                    }
                                    options={[
                                        { value: '', label: '—' },
                                        ...formOptions.map((option) => ({
                                            value: option,
                                            label: option,
                                        })),
                                    ]}
                                    error={errors.form}
                                />
                                <TextField
                                    label="Dosage"
                                    value={data.dosage}
                                    onChange={(event) =>
                                        setData('dosage', event.target.value)
                                    }
                                    error={errors.dosage}
                                />
                                <SelectField
                                    label="Catégorie"
                                    value={mainCategory}
                                    onChange={(event) =>
                                        handleMainCategoryChange(
                                            event.target.value,
                                        )
                                    }
                                    options={[
                                        { value: '', label: '—' },
                                        ...categories.map((category) => ({
                                            value: category.slug,
                                            label: category.name,
                                        })),
                                    ]}
                                    hint={
                                        otherCategoryNames
                                            ? `Aussi dans : ${otherCategoryNames}`
                                            : undefined
                                    }
                                    error={errors.category_slugs}
                                />
                                <TextField
                                    label="Code-barres (facultatif)"
                                    value={data.barcode}
                                    onChange={(event) =>
                                        setData('barcode', event.target.value)
                                    }
                                    error={errors.barcode}
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Rayon (facultatif)"
                                    value={data.shelf}
                                    onChange={(event) =>
                                        setData('shelf', event.target.value)
                                    }
                                    error={errors.shelf}
                                    hint="Ex. A2 — sert à compter l'inventaire rayon par rayon."
                                    isMono
                                    autoCapitalize="characters"
                                />
                            </div>
                            <Checkbox
                                checked={data.prescription_required}
                                onChange={(isChecked) =>
                                    setData('prescription_required', isChecked)
                                }
                                accentClassName="accent-rx"
                                label="Sur ordonnance"
                                description="La caisse demandera le prescripteur à la vente"
                            />
                        </Card>

                        <Card title="Conditionnement et prix de vente" isRoomy>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-3.5">
                                <TextField
                                    label="Unités par boîte"
                                    value={data.units_per_pack}
                                    onChange={(event) =>
                                        setData(
                                            'units_per_pack',
                                            event.target.value,
                                        )
                                    }
                                    error={errors.units_per_pack}
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Prix de la boîte (FC)"
                                    value={data.sale_price_pack}
                                    onChange={(event) =>
                                        setData(
                                            'sale_price_pack',
                                            event.target.value,
                                        )
                                    }
                                    error={errors.sale_price_pack}
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Prix à l'unité (FC)"
                                    value={data.sale_price_unit}
                                    onChange={(event) =>
                                        setData(
                                            'sale_price_unit',
                                            event.target.value,
                                        )
                                    }
                                    error={errors.sale_price_unit}
                                    disabled={!data.sells_by_unit}
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Seuil minimum (unités)"
                                    value={data.min_stock_units}
                                    onChange={(event) =>
                                        setData(
                                            'min_stock_units',
                                            event.target.value,
                                        )
                                    }
                                    error={errors.min_stock_units}
                                    isMono
                                    inputMode="numeric"
                                />
                            </div>
                            <Checkbox
                                checked={data.sells_by_unit}
                                onChange={handleSellsByUnitChange}
                                accentClassName="accent-primary"
                                label="Vendre aussi à l'unité (plaquette ouverte)"
                            />
                            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-input bg-background px-3.5 py-3 text-[13px] text-ink-muted">
                                <span>
                                    ≈{' '}
                                    <span className="font-mono text-ink">
                                        {boxPrice !== null && exchangeRate
                                            ? formatUsd(
                                                  boxPrice /
                                                      Number(exchangeRate),
                                              )
                                            : '—'}
                                    </span>{' '}
                                    la boîte au taux du jour
                                </span>
                                <span>
                                    Marge sur dernier lot :{' '}
                                    <span className="font-mono text-ink">
                                        {marginPercent !== null
                                            ? `${marginPercent} %`
                                            : '—'}
                                    </span>
                                </span>
                            </div>
                        </Card>
                    </div>

                    <LotsCard lots={lots} unitsPerPack={unitsPerPack} />
                </div>
            </PageContent>
        </form>
    );
}

type CheckboxProps = {
    label: string;
    description?: string;
    /** Tick colour: rx blue for prescriptions, primary otherwise. */
    accentClassName: string;
    checked: boolean;
    onChange: (isChecked: boolean) => void;
};

function Checkbox({
    label,
    description,
    accentClassName,
    checked,
    onChange,
}: CheckboxProps) {
    const id = useId();

    return (
        <div className="flex min-h-11 items-center gap-3 text-[15px]">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                aria-describedby={description ? `${id}-description` : undefined}
                className={`size-[22px] shrink-0 ${accentClassName}`}
            />
            <label htmlFor={id}>
                <span className="font-semibold">{label}</span>
                {description ? (
                    <span
                        id={`${id}-description`}
                        className="block text-[13px] text-ink-muted"
                    >
                        {description}
                    </span>
                ) : null}
            </label>
        </div>
    );
}

function LotsCard({
    lots,
    unitsPerPack,
}: {
    lots: MedicineLot[];
    unitsPerPack: number;
}) {
    const totalUnits = lots.reduce((sum, lot) => sum + lot.qty_on_hand, 0);
    const unitSuffix = 'u';

    return (
        <Card
            title="Lots en stock"
            isRoomy
            className="flex-[1_1_300px]"
            actions={
                <span className="font-mono font-semibold">
                    {formatNumber(totalUnits)} {unitSuffix}
                </span>
            }
        >
            <p className="text-[13px] text-ink-muted">
                Vendus dans cet ordre (premier expiré, premier sorti)
            </p>
            {lots.length === 0 ? (
                <p className="rounded-control bg-background px-3.5 py-3 text-sm text-ink-muted">
                    Aucun lot en stock
                </p>
            ) : (
                <ol className="flex flex-col gap-3.5">
                    {lots.map((lot) => (
                        <li
                            key={lot.id}
                            className="flex flex-col gap-1 rounded-control border border-border px-3.5 py-3"
                        >
                            <LotLine
                                left={
                                    <span className="font-mono font-semibold">
                                        {lot.lot_number}
                                    </span>
                                }
                                right={
                                    <span className="font-mono">
                                        {formatNumber(lot.qty_on_hand)}{' '}
                                        {unitSuffix}
                                        {unitsPerPack > 1
                                            ? ` · ${formatNumber(Math.floor(lot.qty_on_hand / unitsPerPack))} bt`
                                            : ''}
                                    </span>
                                }
                            />
                            <LotLine
                                left={
                                    <>
                                        Expire{' '}
                                        <span className="font-mono">
                                            {lot.expiry}
                                        </span>
                                    </>
                                }
                                right={
                                    <>
                                        Achat{' '}
                                        <span className="font-mono">
                                            {formatFc(
                                                Number(lot.cost_per_pack),
                                            )}
                                        </span>
                                        /bt
                                    </>
                                }
                                isMuted
                            />
                        </li>
                    ))}
                </ol>
            )}
            <span
                aria-disabled="true"
                title="Bientôt disponible"
                className="text-sm font-semibold text-ink-muted"
            >
                Historique des mouvements
            </span>
        </Card>
    );
}

function LotLine({
    left,
    right,
    isMuted = false,
}: {
    left: ReactNode;
    right: ReactNode;
    isMuted?: boolean;
}) {
    return (
        <div
            className={
                isMuted
                    ? 'flex justify-between gap-3 text-[13px] text-ink-muted'
                    : 'flex justify-between gap-3'
            }
        >
            <span>{left}</span>
            <span>{right}</span>
        </div>
    );
}
