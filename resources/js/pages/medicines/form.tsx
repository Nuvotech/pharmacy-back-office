import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, ButtonLink } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatFc, formatNumber, formatUsd } from '@/lib/format';
import { showNotAvailableYet } from '@/lib/not-available';
import {
    fcPerUsd,
    findMedicine,
    medicineCategories,
    medicineForms,
    stockUnits,
} from '@/lib/mock/medicines';
import type { Medicine } from '@/lib/mock/medicines';
import { index } from '@/routes/medicines';

type MedicineFormProps = {
    /** Set when editing; absent for "Nouveau médicament". */
    medicineId?: string;
};

/** Digits only, so "2 500" and "2500" both read as 2500. */
function parseAmount(text: string): number | null {
    const digits = text.replace(/\s/g, '');

    return /^\d+$/.test(digits) ? Number(digits) : null;
}

export default function MedicineForm({ medicineId }: MedicineFormProps) {
    const medicine = medicineId ? findMedicine(medicineId) : undefined;

    if (medicineId && !medicine) {
        return (
            <>
                <PageHeader
                    title="Médicament introuvable"
                    back={{ label: 'Médicaments', href: index() }}
                />
                <PageContent>
                    <Card>
                        <p className="text-sm text-ink-muted">
                            Ce médicament n'existe pas ou a été supprimé.
                        </p>
                    </Card>
                </PageContent>
            </>
        );
    }

    return (
        <MedicineFormContent key={medicineId ?? 'new'} medicine={medicine} />
    );
}

function MedicineFormContent({ medicine }: { medicine?: Medicine }) {
    const [boxPriceText, setBoxPriceText] = useState(
        medicine ? formatNumber(medicine.boxPrice) : '',
    );
    const [sellsByUnit, setSellsByUnit] = useState(
        medicine ? medicine.unitPrice !== null : true,
    );
    const [unitPriceText, setUnitPriceText] = useState(
        medicine?.unitPrice ? formatNumber(medicine.unitPrice) : '',
    );

    const boxPrice = parseAmount(boxPriceText);
    const latestLot = medicine?.lots.at(-1);
    const marginPercent =
        boxPrice !== null && latestLot
            ? Math.floor(
                  ((boxPrice - latestLot.costPerBox) / latestLot.costPerBox) *
                      100,
              )
            : null;

    const handleSellsByUnitChange = (isChecked: boolean) => {
        setSellsByUnit(isChecked);
        if (!isChecked) {
            setUnitPriceText('');
        }
    };

    const handleSave = () => showNotAvailableYet('Enregistrement');

    return (
        <>
            <PageHeader
                title={medicine ? medicine.name : 'Nouveau médicament'}
                back={{ label: 'Médicaments', href: index() }}
                actions={
                    <>
                        <ButtonLink href={index()} variant="secondary">
                            Annuler
                        </ButtonLink>
                        <Button onClick={handleSave} className="px-[22px]">
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
                                    defaultValue={medicine?.name}
                                />
                                <TextField
                                    label="Molécule (DCI)"
                                    defaultValue={medicine?.molecule}
                                />
                                <SelectField
                                    label="Forme"
                                    defaultValue={medicine?.form ?? 'Comprimé'}
                                    options={medicineForms.map((form) => ({
                                        value: form,
                                        label: form,
                                    }))}
                                />
                                <TextField
                                    label="Dosage"
                                    defaultValue={medicine?.dosage}
                                />
                                <SelectField
                                    label="Catégorie"
                                    defaultValue={
                                        medicine?.category ??
                                        medicineCategories[0]
                                    }
                                    options={medicineCategories.map(
                                        (category) => ({
                                            value: category,
                                            label: category,
                                        }),
                                    )}
                                />
                                <TextField
                                    label="Code-barres (facultatif)"
                                    defaultValue={medicine?.barcode}
                                    isMono
                                    inputMode="numeric"
                                />
                            </div>
                            <Checkbox
                                defaultChecked={
                                    medicine?.isPrescriptionOnly ?? false
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
                                    defaultValue={medicine?.unitsPerBox}
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Prix de la boîte (FC)"
                                    value={boxPriceText}
                                    onChange={(event) =>
                                        setBoxPriceText(event.target.value)
                                    }
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Prix à l'unité (FC)"
                                    value={unitPriceText}
                                    onChange={(event) =>
                                        setUnitPriceText(event.target.value)
                                    }
                                    disabled={!sellsByUnit}
                                    isMono
                                    inputMode="numeric"
                                />
                                <TextField
                                    label="Seuil minimum (unités)"
                                    defaultValue={medicine?.threshold}
                                    isMono
                                    inputMode="numeric"
                                />
                            </div>
                            <Checkbox
                                checked={sellsByUnit}
                                onChange={handleSellsByUnitChange}
                                accentClassName="accent-primary"
                                label="Vendre aussi à l'unité (plaquette ouverte)"
                            />
                            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-input bg-background px-3.5 py-3 text-[13px] text-ink-muted">
                                <span>
                                    ≈{' '}
                                    <span className="font-mono text-ink">
                                        {boxPrice !== null
                                            ? formatUsd(boxPrice / fcPerUsd)
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

                    <LotsCard medicine={medicine} />
                </div>
            </PageContent>
        </>
    );
}

type CheckboxProps = {
    label: string;
    description?: string;
    /** Tick colour: rx blue for prescriptions, primary otherwise. */
    accentClassName: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (isChecked: boolean) => void;
};

function Checkbox({
    label,
    description,
    accentClassName,
    checked,
    defaultChecked,
    onChange,
}: CheckboxProps) {
    const id = useId();

    return (
        <div className="flex min-h-11 items-center gap-3 text-[15px]">
            <input
                id={id}
                type="checkbox"
                checked={checked}
                defaultChecked={defaultChecked}
                onChange={(event) => onChange?.(event.target.checked)}
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

function LotsCard({ medicine }: { medicine?: Medicine }) {
    const unitSuffix = medicine?.itemLabel ?? 'u';
    const lots = medicine?.lots ?? [];

    return (
        <Card
            title="Lots en stock"
            isRoomy
            className="flex-[1_1_300px]"
            actions={
                <span className="font-mono font-semibold">
                    {formatNumber(medicine ? stockUnits(medicine) : 0)}{' '}
                    {unitSuffix}
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
                            key={lot.code}
                            className="flex flex-col gap-1 rounded-control border border-border px-3.5 py-3"
                        >
                            <LotLine
                                left={
                                    <span className="font-mono font-semibold">
                                        {lot.code}
                                    </span>
                                }
                                right={
                                    <span className="font-mono">
                                        {formatNumber(lot.units)} {unitSuffix}
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
                                            {formatFc(lot.costPerBox)}
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
