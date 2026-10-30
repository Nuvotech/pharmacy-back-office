import { TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatFc, formatInvoiceAmount, formatNumber } from '@/lib/format';
import { fcPerUsd } from '@/lib/mock/medicines';
import {
    receptionDraft,
    receptionLines,
    shortDatedMonths,
    suppliers,
} from '@/lib/mock/reception';
import type { InvoiceCurrency, ReceptionLine } from '@/lib/mock/reception';
import { showNotAvailableYet } from '@/lib/not-available';
import { cn } from '@/lib/utils';

const isShortDated = (line: ReceptionLine) =>
    line.monthsToExpiry < shortDatedMonths;

const entryInputClasses =
    'h-10 w-full min-w-0 rounded-chip border-[1.5px] border-border-strong bg-surface px-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary';

export default function ReceptionCreate() {
    const [lines, setLines] = useState(receptionLines);
    const [currency, setCurrency] = useState<InvoiceCurrency>(
        receptionDraft.currency,
    );

    const boxCount = lines.reduce((sum, line) => sum + line.boxes, 0);
    const unitCount = lines.reduce(
        (sum, line) => sum + line.boxes * line.unitsPerBox,
        0,
    );
    const invoiceTotal = lines.reduce(
        (sum, line) => sum + line.boxes * line.costPerBox,
        0,
    );
    const shortDatedLines = lines.filter(isShortDated);

    const removeLine = (id: string) =>
        setLines((current) => current.filter((line) => line.id !== id));

    const handleEntryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            showNotAvailableYet('Ajout de ligne');
        }
    };

    const columns: DataTableColumn<ReceptionLine>[] = [
        {
            key: 'medicine',
            header: 'Médicament',
            render: (line) => (
                <CellLines main={line.medicine} detail={line.packLabel} />
            ),
        },
        {
            key: 'lot',
            header: 'N° de lot',
            width: '110px',
            render: (line) => (
                <span className="font-mono text-[13px]">{line.lotCode}</span>
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
                        isShortDated(line) && 'font-bold text-warning',
                    )}
                >
                    {line.expiry}
                </span>
            ),
        },
        {
            key: 'boxes',
            header: 'Boîtes',
            width: '80px',
            align: 'right',
            render: (line) => formatNumber(line.boxes),
        },
        {
            key: 'units',
            header: 'Unités',
            width: '90px',
            align: 'right',
            render: (line) => (
                <span className="text-ink-muted">
                    {formatNumber(line.boxes * line.unitsPerBox)}
                </span>
            ),
        },
        {
            key: 'cost',
            header: 'Achat / bte',
            width: '110px',
            align: 'right',
            render: (line) => formatInvoiceAmount(line.costPerBox, currency),
        },
        {
            key: 'total',
            header: 'Total',
            width: '110px',
            align: 'right',
            render: (line) => (
                <span className="font-semibold">
                    {formatInvoiceAmount(
                        line.boxes * line.costPerBox,
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
                    onClick={() => removeLine(line.id)}
                    aria-label={`Supprimer la ligne ${line.medicine}`}
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
                    type="text"
                    aria-label="Médicament"
                    placeholder="Chercher un médicament…"
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'border-primary')}
                />
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    aria-label="N° de lot"
                    placeholder="Lot"
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'font-mono')}
                />
            </td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    aria-label="Expiration"
                    placeholder="MM/AAAA"
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
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'text-right font-mono')}
                />
            </td>
            <td className="px-1.5 py-2.5 text-right text-ink-faint">—</td>
            <td className="px-1.5 py-2.5">
                <input
                    type="text"
                    inputMode="decimal"
                    aria-label="Prix d'achat par boîte"
                    placeholder="0,00"
                    onKeyDown={handleEntryKeyDown}
                    className={cn(entryInputClasses, 'text-right font-mono')}
                />
            </td>
            <td />
            <td />
        </tr>
    );

    return (
        <>
            <PageHeader
                title="Nouvelle réception"
                subtitle={
                    <>
                        Brouillon enregistré à{' '}
                        <span className="font-mono">
                            {receptionDraft.savedAt}
                        </span>
                    </>
                }
                actions={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => showNotAvailableYet('Brouillon')}
                        >
                            Enregistrer le brouillon
                        </Button>
                        <Button
                            className="px-5"
                            onClick={() => showNotAvailableYet('Validation')}
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
                            defaultValue={receptionDraft.supplier}
                            options={suppliers.map((supplier) => ({
                                value: supplier,
                                label: supplier,
                            }))}
                        />
                        <TextField
                            label="N° bon de livraison / facture"
                            defaultValue={receptionDraft.deliveryNote}
                            isMono
                        />
                        <TextField
                            label="Date de réception"
                            defaultValue={receptionDraft.receivedOn}
                            placeholder="JJ/MM/AAAA"
                        />
                        <SelectField
                            label="Devise de la facture"
                            value={currency}
                            onChange={(event) =>
                                setCurrency(
                                    event.target.value as InvoiceCurrency,
                                )
                            }
                            options={[
                                { value: 'USD', label: 'USD' },
                                { value: 'FC', label: 'FC' },
                            ]}
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
                                rows={lines}
                                rowKey={(line) => line.id}
                                minWidth={860}
                                caption="Lignes de la livraison"
                                emptyMessage="Aucune ligne. Ajoutez les médicaments livrés."
                                rowClassName={(line) =>
                                    isShortDated(line)
                                        ? 'bg-warning-row'
                                        : undefined
                                }
                                appendedRow={entryRow}
                            />
                            <p className="px-5 py-3 text-[13px] text-ink-muted">
                                Entrée pour ajouter la ligne · les unités sont
                                calculées depuis la fiche du médicament
                            </p>
                        </Card>

                        <aside className="flex flex-wrap gap-3.5 @min-[1180px]:w-[300px] @min-[1180px]:flex-none @min-[1180px]:flex-col">
                            <section className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5 rounded-card bg-surface p-5 shadow-card">
                                <h2 className="mb-1 text-[17px] font-bold">
                                    Récapitulatif
                                </h2>
                                <SummaryRow
                                    label="Lignes"
                                    value={formatNumber(lines.length)}
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
                                {currency === 'USD' ? (
                                    <p className="text-right text-[13px] text-ink-muted">
                                        ≈{' '}
                                        <span className="font-mono">
                                            {formatFc(invoiceTotal * fcPerUsd)}
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
                                        {shortDatedLines.map((line) => (
                                            <span key={line.id}>
                                                {line.molecule}{' '}
                                                <span className="font-mono">
                                                    {line.lotCode}
                                                </span>{' '}
                                                expire dans{' '}
                                                <span className="font-mono">
                                                    {line.monthsToExpiry}
                                                </span>{' '}
                                                mois.{' '}
                                            </span>
                                        ))}
                                        Confirmez avant de valider.
                                    </div>
                                </section>
                            ) : null}
                        </aside>
                    </div>
                </div>
            </PageContent>
        </>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-3 text-sm">
            <span className="text-ink-muted">{label}</span>
            <span className="font-mono">{value}</span>
        </div>
    );
}
