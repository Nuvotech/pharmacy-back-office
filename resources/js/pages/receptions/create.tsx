import { useForm } from '@inertiajs/react';
import { TriangleAlert, X } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatFc, formatInvoiceAmount, formatNumber } from '@/lib/format';
import {
    currencyLabel,
    formatDateInput,
    formatExpiry,
    isShortDated,
    monthsToExpiry,
    parseCostInput,
    parseDateInput,
    parseExpiryInput,
    toHundredths,
} from '@/lib/receptions';
import type {
    InvoiceCurrency,
    ReceptionData,
    ReceptionMedicineOption,
} from '@/lib/receptions';
import { cn } from '@/lib/utils';
import { draft, validate } from '@/routes/receptions';

type ReceptionCreateProps = {
    /** The user's latest draft, or null for a new delivery. */
    reception: ReceptionData | null;
    suppliers: { id: string; name: string }[];
    medicines: ReceptionMedicineOption[];
    /** 1 USD in CDF in force today, or null when no rate is recorded. */
    exchangeRate: string | null;
    shortDatedMonths: number;
    /** "YYYY-MM-DD", server date. */
    today: string;
};

/** A line as sent to the server. `key` only identifies the row on screen. */
type LineInput = {
    key: string;
    medicine_id: string;
    lot_number: string;
    expiry: string;
    packs: number;
    /** Units in one box as delivered; validating saves it on the medicine sheet. */
    units_per_pack: number;
    cost_per_pack: string;
};

type ReceptionFormData = {
    id: string | null;
    supplier_id: string;
    invoice_ref: string;
    received_on: string;
    currency: InvoiceCurrency;
    lines: LineInput[];
    short_dated_confirmed: boolean;
};

type EntryRow = {
    medicine: string;
    lot: string;
    expiry: string;
    boxes: string;
    unitsPerBox: string;
    cost: string;
};

const emptyEntry: EntryRow = {
    medicine: '',
    lot: '',
    expiry: '',
    boxes: '',
    unitsPerBox: '',
    cost: '',
};

const entryInputClasses =
    'h-10 w-full min-w-0 rounded-chip border-[1.5px] border-border-strong bg-surface px-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary';

let nextLineKey = 0;
const newLineKey = () => `line-${(nextLineKey += 1)}`;

function initialData(
    reception: ReceptionData | null,
    today: string,
): ReceptionFormData {
    return {
        id: reception?.id ?? null,
        supplier_id: reception?.supplier_id ?? '',
        invoice_ref: reception?.invoice_ref ?? '',
        received_on: reception?.received_on ?? today,
        currency: reception?.currency ?? 'USD',
        lines: (reception?.lines ?? []).map((line) => ({
            key: newLineKey(),
            medicine_id: line.medicine_id,
            lot_number: line.lot_number,
            expiry: line.expiry,
            packs: line.packs,
            units_per_pack: line.units_per_pack,
            cost_per_pack: line.cost_per_pack,
        })),
        short_dated_confirmed: false,
    };
}

/** "Brouillon enregistré à 09:40", in the browser's time zone. */
function savedAtLabel(updatedAt: string | null | undefined): string | null {
    if (!updatedAt) {
        return null;
    }

    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(updatedAt));
}

export default function ReceptionCreate({
    reception,
    suppliers,
    medicines,
    exchangeRate,
    shortDatedMonths,
    today,
}: ReceptionCreateProps) {
    const form = useForm<ReceptionFormData>(initialData(reception, today));
    const { data, setData, errors, processing } = form;
    const [dateText, setDateText] = useState(() =>
        formatDateInput(data.received_on),
    );
    const [entry, setEntry] = useState<EntryRow>(emptyEntry);
    const [entryError, setEntryError] = useState<string | null>(null);
    const medicineInputRef = useRef<HTMLInputElement>(null);
    const medicineListId = useId();

    const medicinesById = useMemo(
        () => new Map(medicines.map((medicine) => [medicine.id, medicine])),
        [medicines],
    );
    const medicinesByName = useMemo(
        () =>
            new Map(
                medicines.map((medicine) => [
                    medicine.name.toLocaleLowerCase('fr'),
                    medicine,
                ]),
            ),
        [medicines],
    );

    const currency = currencyLabel(data.currency);
    const lineIsShortDated = (line: LineInput) =>
        data.received_on !== '' &&
        isShortDated(line.expiry, data.received_on, shortDatedMonths);

    const boxCount = data.lines.reduce((sum, line) => sum + line.packs, 0);
    const unitCount = data.lines.reduce(
        (sum, line) => sum + line.packs * line.units_per_pack,
        0,
    );
    const invoiceTotal =
        data.lines.reduce(
            (sum, line) => sum + line.packs * toHundredths(line.cost_per_pack),
            0,
        ) / 100;
    const shortDatedLines = data.lines.filter(lineIsShortDated);
    const lineErrors = Object.entries(errors)
        .filter(([field]) => field.startsWith('lines.'))
        .map(([field, message]) => {
            const index = Number(field.split('.')[1]);

            return `Ligne ${index + 1} : ${message}`;
        });
    const savedAt = savedAtLabel(reception?.updated_at);

    const handleDateChange = (text: string) => {
        setDateText(text);
        setData('received_on', parseDateInput(text) ?? '');
    };

    const removeLine = (key: string) =>
        setData(
            'lines',
            data.lines.filter((line) => line.key !== key),
        );

    const isEntryEmpty = Object.values(entry).every(
        (value) => value.trim() === '',
    );

    /** The typed bottom row as a line, or the first thing wrong with it. */
    const parseEntry = (): { line: LineInput } | { problem: string } => {
        const medicine = medicinesByName.get(
            entry.medicine.trim().toLocaleLowerCase('fr'),
        );
        const expiry = parseExpiryInput(entry.expiry);
        const packs = /^\d+$/.test(entry.boxes.trim())
            ? Number(entry.boxes.trim())
            : 0;
        const unitsPerBox = /^\d+$/.test(entry.unitsPerBox.trim())
            ? Number(entry.unitsPerBox.trim())
            : 0;
        const cost = parseCostInput(entry.cost);

        if (!medicine) {
            return {
                problem:
                    entry.medicine.trim() === ''
                        ? 'Choisissez un médicament.'
                        : `« ${entry.medicine.trim()} » n’est pas dans la liste des médicaments. Tapez une partie du nom et choisissez-le dans les suggestions.`,
            };
        }
        if (entry.lot.trim() === '') {
            return { problem: 'Saisissez le numéro de lot.' };
        }
        if (!expiry) {
            return {
                problem: 'Expiration au format MM/AAAA, par exemple 03/2027.',
            };
        }
        if (packs <= 0) {
            return {
                problem: 'Saisissez un nombre de boîtes entier supérieur à 0.',
            };
        }
        if (unitsPerBox <= 0) {
            return {
                problem:
                    'Saisissez le nombre d’unités par boîte, par exemple 50.',
            };
        }
        if (cost === null) {
            return {
                problem:
                    'Saisissez le prix d’achat par boîte, par exemple 2,60.',
            };
        }

        return {
            line: {
                key: newLineKey(),
                medicine_id: medicine.id,
                lot_number: entry.lot.trim().toUpperCase(),
                expiry,
                packs,
                units_per_pack: unitsPerBox,
                cost_per_pack: cost,
            },
        };
    };

    /**
     * The lines to send: a filled bottom row counts as a line even if Enter wasn't pressed. Null when
     * that row is filled in but incomplete (its problem is shown).
     */
    const linesWithEntry = (): LineInput[] | null => {
        if (isEntryEmpty) {
            return data.lines;
        }

        const parsed = parseEntry();
        if ('problem' in parsed) {
            setEntryError(parsed.problem);

            return null;
        }

        const lines = [...data.lines, parsed.line];
        setData('lines', lines);
        setEntry(emptyEntry);
        setEntryError(null);

        return lines;
    };

    const addEntryLine = () => {
        if (isEntryEmpty) {
            return;
        }
        if (linesWithEntry() !== null) {
            medicineInputRef.current?.focus();
        }
    };

    /** Enter adds the line once the row is complete; before that it moves to the next empty box. */
    const handleEntryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') {
            return;
        }

        event.preventDefault();
        const row = event.currentTarget.closest('tr');
        const inputs = row
            ? Array.from(row.querySelectorAll<HTMLInputElement>('input'))
            : [];
        const nextEmpty = inputs
            .slice(inputs.indexOf(event.currentTarget) + 1)
            .find((input) => input.value.trim() === '');

        if (nextEmpty && event.currentTarget.value.trim() !== '') {
            nextEmpty.focus();

            return;
        }

        addEntryLine();
    };

    const updateEntry = (field: keyof EntryRow, value: string) =>
        setEntry((current) => ({ ...current, [field]: value }));

    /** Picking a medicine fills in its box size from the medicine sheet; it can be corrected. */
    const updateEntryMedicine = (value: string) => {
        const medicine = medicinesByName.get(
            value.trim().toLocaleLowerCase('fr'),
        );

        setEntry((current) => ({
            ...current,
            medicine: value,
            unitsPerBox: medicine
                ? String(Math.max(1, medicine.units_per_pack))
                : current.unitsPerBox,
        }));
    };

    const payload = (current: ReceptionFormData) => ({
        ...current,
        lines: current.lines.map(({ key: _key, ...line }) => line),
    });

    const saveDraft = () => {
        const lines = linesWithEntry();
        if (lines === null) {
            return;
        }

        form.transform((current) => payload({ ...current, lines }));
        form.submit(draft(), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = page.props.reception as ReceptionData | null;
                setData('id', saved?.id ?? data.id);
            },
        });
    };

    const handleValidate = () => {
        const lines = linesWithEntry();
        if (lines === null) {
            return;
        }

        form.transform((current) => payload({ ...current, lines }));
        form.submit(validate(), {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults(initialData(null, today));
                form.reset();
                setDateText(formatDateInput(today));
                setEntry(emptyEntry);
            },
        });
    };

    const columns: DataTableColumn<LineInput>[] = [
        {
            key: 'medicine',
            header: 'Médicament',
            render: (line) => {
                const medicine = medicinesById.get(line.medicine_id);
                const perPack = line.units_per_pack;

                return (
                    <CellLines
                        main={medicine?.name ?? line.medicine_id}
                        detail={perPack > 1 ? `Boîte de ${perPack}` : 'Boîte'}
                    />
                );
            },
        },
        {
            key: 'lot',
            header: 'N° de lot',
            width: '110px',
            render: (line) => (
                <span className="font-mono text-[13px]">{line.lot_number}</span>
            ),
        },
        {
            key: 'expiry',
            header: 'Expiration',
            width: '100px',
            render: (line) => (
                <span
                    className={cn(
                        'font-mono',
                        lineIsShortDated(line) && 'font-bold text-warning',
                    )}
                >
                    {formatExpiry(line.expiry)}
                </span>
            ),
        },
        {
            key: 'boxes',
            header: 'Boîtes',
            width: '80px',
            align: 'right',
            render: (line) => formatNumber(line.packs),
        },
        {
            key: 'units',
            header: 'Unités',
            width: '90px',
            align: 'right',
            render: (line) => (
                <span className="text-ink-muted">
                    {formatNumber(line.packs * line.units_per_pack)}
                </span>
            ),
        },
        {
            key: 'cost',
            header: 'Achat / bte',
            width: '110px',
            align: 'right',
            render: (line) =>
                formatInvoiceAmount(
                    toHundredths(line.cost_per_pack) / 100,
                    currency,
                ),
        },
        {
            key: 'total',
            header: 'Total',
            width: '110px',
            align: 'right',
            render: (line) => (
                <span className="font-semibold">
                    {formatInvoiceAmount(
                        (line.packs * toHundredths(line.cost_per_pack)) / 100,
                        currency,
                    )}
                </span>
            ),
        },
        {
            key: 'remove',
            header: 'Supprimer',
            width: '52px',
            isHeaderHidden: true,
            render: (line) => (
                <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    aria-label={`Supprimer la ligne ${medicinesById.get(line.medicine_id)?.name ?? ''}`}
                    className="flex size-10 items-center justify-center rounded-input text-ink-faint hover:bg-background hover:text-ink"
                >
                    <X className="size-[18px]" aria-hidden />
                </button>
            ),
        },
    ];

    const entryRow = (
        <tr className="bg-row-tint">
            <td className="py-2.5 pr-1.5 pl-5">
                <input
                    ref={medicineInputRef}
                    type="text"
                    list={medicineListId}
                    aria-label="Médicament"
                    placeholder="Chercher un médicament…"
                    value={entry.medicine}
                    onChange={(event) =>
                        updateEntryMedicine(event.target.value)
                    }
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'border-primary')}
                />
                <datalist id={medicineListId}>
                    {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.name}>
                            {medicine.units_per_pack > 1
                                ? `Boîte de ${medicine.units_per_pack}`
                                : 'Boîte'}
                        </option>
                    ))}
                </datalist>
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    aria-label="N° de lot"
                    placeholder="Lot"
                    value={entry.lot}
                    onChange={(event) => updateEntry('lot', event.target.value)}
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'font-mono uppercase')}
                />
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    aria-label="Expiration"
                    placeholder="MM/AAAA"
                    value={entry.expiry}
                    onChange={(event) =>
                        updateEntry('expiry', event.target.value)
                    }
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'font-mono')}
                />
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Boîtes"
                    placeholder="0"
                    value={entry.boxes}
                    onChange={(event) =>
                        updateEntry('boxes', event.target.value)
                    }
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'text-right font-mono')}
                />
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    inputMode="numeric"
                    aria-label="Unités par boîte"
                    title="Unités par boîte"
                    placeholder="/ bte"
                    value={entry.unitsPerBox}
                    onChange={(event) =>
                        updateEntry('unitsPerBox', event.target.value)
                    }
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'text-right font-mono')}
                />
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    inputMode="decimal"
                    aria-label="Prix d'achat par boîte"
                    placeholder="0,00"
                    value={entry.cost}
                    onChange={(event) =>
                        updateEntry('cost', event.target.value)
                    }
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'text-right font-mono')}
                />
            </td>
            <td colSpan={2} className="py-2.5 pr-5 pl-1.5 text-right">
                <Button type="button" size="small" onClick={addEntryLine}>
                    Ajouter
                </Button>
            </td>
        </tr>
    );

    return (
        // Validating is a deliberate click: Enter in a field must never validate the delivery.
        <form onSubmit={preventSubmit} noValidate>
            <PageHeader
                title="Nouvelle réception"
                subtitle={
                    savedAt ? (
                        <>
                            Brouillon enregistré à{' '}
                            <span className="font-mono">{savedAt}</span>
                        </>
                    ) : undefined
                }
                actions={
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={processing}
                            onClick={saveDraft}
                        >
                            Enregistrer le brouillon
                        </Button>
                        <Button
                            type="button"
                            className="px-5"
                            disabled={processing}
                            onClick={handleValidate}
                        >
                            Valider la réception
                        </Button>
                    </>
                }
            />
            <PageContent>
                <Card isRoomy>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-4 gap-y-3.5">
                        <SelectField
                            label="Fournisseur"
                            value={data.supplier_id}
                            onChange={(event) =>
                                setData('supplier_id', event.target.value)
                            }
                            options={[
                                { value: '', label: 'Choisir…' },
                                ...suppliers.map((supplier) => ({
                                    value: supplier.id,
                                    label: supplier.name,
                                })),
                            ]}
                            error={errors.supplier_id}
                        />
                        <TextField
                            label="N° bon de livraison / facture"
                            value={data.invoice_ref}
                            onChange={(event) =>
                                setData('invoice_ref', event.target.value)
                            }
                            error={errors.invoice_ref}
                            isMono
                        />
                        <TextField
                            label="Date de réception"
                            value={dateText}
                            onChange={(event) =>
                                handleDateChange(event.target.value)
                            }
                            placeholder="JJ/MM/AAAA"
                            error={errors.received_on}
                        />
                        <SelectField
                            label="Devise de la facture"
                            value={data.currency}
                            onChange={(event) =>
                                setData(
                                    'currency',
                                    event.target.value as InvoiceCurrency,
                                )
                            }
                            options={[
                                { value: 'USD', label: 'USD' },
                                { value: 'CDF', label: 'FC' },
                            ]}
                            error={errors.currency}
                        />
                    </div>
                </Card>

                {/* Summary beside the table only when every table column still fits. */}
                <div className="@container">
                    <div className="flex flex-col gap-5 @min-[1180px]:flex-row @min-[1180px]:items-start">
                        <Card
                            isPadded={false}
                            className="overflow-hidden @min-[1180px]:flex-[3_1_0%]"
                        >
                            <DataTable
                                columns={columns}
                                rows={data.lines}
                                rowKey={(line) => line.key}
                                minWidth={860}
                                caption="Lignes de la livraison"
                                emptyMessage="Aucune ligne. Ajoutez les médicaments livrés."
                                rowClassName={(line) =>
                                    lineIsShortDated(line)
                                        ? 'bg-warning-row'
                                        : undefined
                                }
                                appendedRow={entryRow}
                            />
                            {entryError || errors.lines || lineErrors.length ? (
                                <div
                                    role="alert"
                                    className="px-5 pt-3 text-[13px] text-danger"
                                >
                                    {[entryError, errors.lines, ...lineErrors]
                                        .filter(Boolean)
                                        .map((message) => (
                                            <p key={message}>{message}</p>
                                        ))}
                                </div>
                            ) : null}
                            <p className="px-5 py-3 text-[13px] text-ink-muted">
                                Ajouter (ou Entrée) pour ajouter la ligne · le
                                médicament se choisit dans les suggestions ·
                                unités = boîtes × unités par boîte (corrigées
                                sur la fiche du médicament à la validation)
                            </p>
                        </Card>

                        <aside className="flex flex-wrap gap-3.5 @min-[1180px]:w-[300px] @min-[1180px]:flex-none @min-[1180px]:flex-col">
                            <section className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
                                <h2 className="mb-1 text-[17px] font-bold">
                                    Récapitulatif
                                </h2>
                                <SummaryRow
                                    label="Lignes"
                                    value={formatNumber(data.lines.length)}
                                />
                                <SummaryRow
                                    label="Boîtes"
                                    value={formatNumber(boxCount)}
                                />
                                <SummaryRow
                                    label="Unités en stock"
                                    value={`+ ${formatNumber(unitCount)}`}
                                />
                                <div className="my-1 h-px bg-divider" />
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="font-semibold">
                                        Total facture
                                    </span>
                                    <span className="font-mono text-[22px] font-semibold">
                                        {formatInvoiceAmount(
                                            invoiceTotal,
                                            currency,
                                        )}{' '}
                                        {currency}
                                    </span>
                                </div>
                                {data.currency === 'USD' && exchangeRate ? (
                                    <p className="text-right text-[13px] text-ink-muted">
                                        ≈{' '}
                                        <span className="font-mono">
                                            {formatFc(
                                                invoiceTotal *
                                                    Number(exchangeRate),
                                            )}
                                        </span>{' '}
                                        au taux du jour
                                    </p>
                                ) : null}
                            </section>

                            {shortDatedLines.length > 0 ? (
                                <section
                                    role="alert"
                                    className="flex min-w-0 flex-[1_1_280px] gap-2.5 self-start rounded-card bg-warning-soft px-[18px] py-4 text-sm text-warning"
                                >
                                    <TriangleAlert
                                        className="size-5 shrink-0"
                                        aria-hidden
                                    />
                                    <div>
                                        <div className="font-bold">
                                            <span className="font-mono">
                                                {shortDatedLines.length}
                                            </span>{' '}
                                            {shortDatedLines.length > 1
                                                ? 'lots à date courte'
                                                : 'lot à date courte'}
                                        </div>
                                        {shortDatedLines.map((line) => {
                                            const medicine = medicinesById.get(
                                                line.medicine_id,
                                            );

                                            return (
                                                <span key={line.key}>
                                                    {medicine?.dci ||
                                                        medicine?.name}{' '}
                                                    <span className="font-mono">
                                                        {line.lot_number}
                                                    </span>{' '}
                                                    expire dans{' '}
                                                    <span className="font-mono">
                                                        {monthsToExpiry(
                                                            line.expiry,
                                                            data.received_on,
                                                        )}
                                                    </span>{' '}
                                                    mois.{' '}
                                                </span>
                                            );
                                        })}
                                        Confirmez avant de valider.
                                        <label className="mt-2.5 flex min-h-11 items-center gap-2.5 font-semibold">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    data.short_dated_confirmed
                                                }
                                                onChange={(event) =>
                                                    setData(
                                                        'short_dated_confirmed',
                                                        event.target.checked,
                                                    )
                                                }
                                                className="size-5 shrink-0 accent-warning"
                                            />
                                            Je confirme ces lots
                                        </label>
                                        {errors.short_dated_confirmed ? (
                                            <p className="text-xs text-danger">
                                                {errors.short_dated_confirmed}
                                            </p>
                                        ) : null}
                                    </div>
                                </section>
                            ) : null}
                        </aside>
                    </div>
                </div>
            </PageContent>
        </form>
    );
}

function preventSubmit(event: FormEvent) {
    event.preventDefault();
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3 text-sm">
            <span className="text-ink-muted">{label}</span>
            <span className="font-mono">{value}</span>
        </div>
    );
}
