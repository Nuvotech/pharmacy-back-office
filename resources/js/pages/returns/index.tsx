import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatDecimal, formatFc, formatNumber } from '@/lib/format';
import {
    customerReturnLines,
    customerReturnReasons,
    customerTicket,
    recentReturns,
    supplierDelivery,
    supplierReturnLines,
    supplierReturnReasons,
} from '@/lib/mock/returns';
import type { ReturnLine } from '@/lib/mock/returns';
import { showNotAvailableYet } from '@/lib/not-available';
import { cn } from '@/lib/utils';

type ReturnKind = 'customer' | 'supplier';

const returnTabs: { value: ReturnKind; label: string }[] = [
    { value: 'customer', label: 'Retour client' },
    { value: 'supplier', label: 'Retour fournisseur' },
];

export default function ReturnsIndex() {
    const [kind, setKind] = useState<ReturnKind>('customer');
    const tabIdPrefix = useId();

    return (
        <>
            <PageHeader
                title="Retours"
                subtitle="Chaque retour crée un mouvement de stock lié au ticket ou à la réception d'origine"
                actions={
                    <div
                        role="tablist"
                        aria-label="Type de retour"
                        className="flex gap-1 rounded-control bg-background p-1"
                    >
                        {returnTabs.map((tab) => {
                            const isSelected = tab.value === kind;

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    role="tab"
                                    id={`${tabIdPrefix}-${tab.value}`}
                                    aria-selected={isSelected}
                                    aria-controls={`${tabIdPrefix}-panel`}
                                    onClick={() => setKind(tab.value)}
                                    className={cn(
                                        'h-10 rounded-chip px-4 text-sm',
                                        isSelected
                                            ? 'bg-surface font-bold text-ink shadow-[0_1px_2px_rgba(22,33,29,0.08)]'
                                            : 'font-semibold text-ink-muted hover:text-ink',
                                    )}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                }
            />
            <PageContent>
                <div
                    role="tabpanel"
                    id={`${tabIdPrefix}-panel`}
                    aria-labelledby={`${tabIdPrefix}-${kind}`}
                    className="flex flex-wrap items-start gap-5"
                >
                    {kind === 'customer' ? (
                        <CustomerReturn key="customer" />
                    ) : (
                        <SupplierReturn key="supplier" />
                    )}
                </div>
            </PageContent>
        </>
    );
}

/** Quantities typed per line; a line is selected when its quantity is above 0. */
function useReturnQuantities(lines: ReturnLine[]) {
    const [quantities, setQuantities] = useState<Record<string, string>>(() =>
        Object.fromEntries(
            lines.map((line) => [line.id, String(line.returnQuantity)]),
        ),
    );

    const quantityOf = (line: ReturnLine) => {
        const digits = (quantities[line.id] ?? '').replace(/\s/g, '');

        return /^\d+$/.test(digits)
            ? Math.min(Number(digits), line.quantity)
            : 0;
    };

    const setQuantity = (id: string, text: string) =>
        setQuantities((current) => ({ ...current, [id]: text }));

    const toggle = (line: ReturnLine) =>
        setQuantity(line.id, quantityOf(line) > 0 ? '0' : '1');

    return { quantities, quantityOf, setQuantity, toggle };
}

function CustomerReturn() {
    const { quantities, quantityOf, setQuantity, toggle } =
        useReturnQuantities(customerReturnLines);
    const selectedLines = customerReturnLines.filter(
        (line) => quantityOf(line) > 0,
    );
    const refundTotal = customerReturnLines.reduce(
        (sum, line) => sum + quantityOf(line) * line.unitPrice,
        0,
    );

    return (
        <>
            <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5">
                <LookupCard
                    label="N° du ticket d'origine"
                    value={customerTicket.number}
                    details={
                        <>
                            Vendu le{' '}
                            <span className="font-mono">
                                {customerTicket.soldAt}
                            </span>{' '}
                            · {customerTicket.till} ·{' '}
                            <span className="font-mono font-semibold text-ink">
                                {formatFc(customerTicket.total)}
                            </span>{' '}
                            {customerTicket.paymentLabel}
                        </>
                    }
                />
                <ReturnLinesCard
                    title="Articles du ticket"
                    quantityHeader="Vendu"
                    lines={customerReturnLines}
                    quantities={quantities}
                    quantityOf={quantityOf}
                    onQuantityChange={setQuantity}
                    onToggle={toggle}
                    formatAmount={formatFc}
                    reasons={customerReturnReasons}
                    hasDestination
                />
            </div>
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                <Card title="Remboursement">
                    <SummaryRow
                        label="Articles"
                        value={
                            <span className="font-mono">
                                {describeSelection(selectedLines, quantityOf)}
                            </span>
                        }
                    />
                    <SummaryRow
                        label="Mode"
                        value={customerTicket.paymentMethod}
                    />
                    <div className="my-1 h-px bg-divider" />
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">À rembourser</span>
                        <span className="font-mono text-2xl font-semibold">
                            {formatFc(refundTotal)}
                        </span>
                    </div>
                    <Button
                        size="large"
                        className="mt-2 w-full"
                        disabled={refundTotal === 0}
                        onClick={() => showNotAvailableYet('Retour')}
                    >
                        Valider le retour
                    </Button>
                    <p className="text-center text-xs text-ink-muted">
                        Un reçu de retour est imprimé pour le client
                    </p>
                </Card>
                <RecentReturnsCard />
            </div>
        </>
    );
}

function SupplierReturn() {
    const { quantities, quantityOf, setQuantity, toggle } =
        useReturnQuantities(supplierReturnLines);
    const returnTotal = supplierReturnLines.reduce(
        (sum, line) => sum + quantityOf(line) * line.unitPrice,
        0,
    );
    const formatUsdAmount = (value: number) => `${formatDecimal(value)} USD`;

    return (
        <>
            <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5">
                <LookupCard
                    label="N° du bon de livraison"
                    value={supplierDelivery.reference}
                    details={
                        <>
                            Reçu le{' '}
                            <span className="font-mono">
                                {supplierDelivery.receivedAt}
                            </span>{' '}
                            · {supplierDelivery.supplier} ·{' '}
                            <span className="font-mono">
                                {supplierDelivery.lineCount}
                            </span>{' '}
                            lignes
                        </>
                    }
                />
                <ReturnLinesCard
                    title="Articles de la livraison"
                    quantityHeader="Reçu"
                    lines={supplierReturnLines}
                    quantities={quantities}
                    quantityOf={quantityOf}
                    onQuantityChange={setQuantity}
                    onToggle={toggle}
                    formatAmount={formatUsdAmount}
                    reasons={supplierReturnReasons}
                    footer={
                        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 border-t border-divider px-5 py-4">
                            <span className="text-sm text-ink-muted">
                                Total du retour{' '}
                                <span className="font-mono text-lg font-semibold text-ink">
                                    {formatUsdAmount(returnTotal)}
                                </span>
                            </span>
                            <Button
                                size="large"
                                disabled={returnTotal === 0}
                                onClick={() =>
                                    showNotAvailableYet('Retour fournisseur')
                                }
                            >
                                Valider le retour
                            </Button>
                        </div>
                    }
                />
            </div>
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                <RecentReturnsCard />
            </div>
        </>
    );
}

/** "1 boîte" for a single line, otherwise "n articles". */
function describeSelection(
    lines: ReturnLine[],
    quantityOf: (line: ReturnLine) => number,
): string {
    if (lines.length === 1) {
        const quantity = quantityOf(lines[0]);
        const [singular, plural] = lines[0].unitLong;

        return `${formatNumber(quantity)} ${quantity > 1 ? plural : singular}`;
    }

    const total = lines.reduce((sum, line) => sum + quantityOf(line), 0);

    return `${formatNumber(total)} ${total > 1 ? 'articles' : 'article'}`;
}

function LookupCard({
    label,
    value,
    details,
}: {
    label: string;
    value: string;
    details: ReactNode;
}) {
    return (
        <Card isRoomy>
            <div className="flex flex-wrap items-end gap-3">
                <TextField
                    label={label}
                    defaultValue={value}
                    isMono
                    containerClassName="flex-[1_1_260px]"
                />
                <p className="flex-[2_1_260px] pb-2.5 text-sm text-ink-muted">
                    {details}
                </p>
            </div>
        </Card>
    );
}

type ReturnLinesCardProps = {
    title: string;
    quantityHeader: string;
    lines: ReturnLine[];
    quantities: Record<string, string>;
    quantityOf: (line: ReturnLine) => number;
    onQuantityChange: (id: string, text: string) => void;
    onToggle: (line: ReturnLine) => void;
    formatAmount: (value: number) => string;
    reasons: string[];
    /** Customer returns ask whether the product goes back into stock. */
    hasDestination?: boolean;
    footer?: ReactNode;
};

function ReturnLinesCard({
    title,
    quantityHeader,
    lines,
    quantities,
    quantityOf,
    onQuantityChange,
    onToggle,
    formatAmount,
    reasons,
    hasDestination = false,
    footer,
}: ReturnLinesCardProps) {
    const destinationName = useId();

    const columns: DataTableColumn<ReturnLine>[] = [
        {
            key: 'select',
            header: 'Sélection',
            width: '56px',
            isHeaderHidden: true,
            render: (line) => (
                <input
                    type="checkbox"
                    checked={quantityOf(line) > 0}
                    onChange={() => onToggle(line)}
                    aria-label={`Retourner ${line.name}`}
                    className="size-[22px] accent-primary"
                />
            ),
        },
        {
            key: 'article',
            header: 'Article',
            render: (line) => (
                <CellLines
                    main={line.name}
                    detail={
                        <>
                            Lot{' '}
                            <span className="font-mono">{line.lotCode}</span>
                        </>
                    }
                />
            ),
        },
        {
            key: 'quantity',
            header: quantityHeader,
            width: '90px',
            align: 'right',
            render: (line) =>
                `${formatNumber(line.quantity)} ${line.unitShort}`,
        },
        {
            key: 'return',
            header: 'À retourner',
            width: '150px',
            align: 'right',
            render: (line) => (
                <input
                    type="text"
                    inputMode="numeric"
                    value={quantities[line.id] ?? ''}
                    onChange={(event) =>
                        onQuantityChange(line.id, event.target.value)
                    }
                    aria-label={`Quantité à retourner, ${line.name}`}
                    className="h-10 w-[90px] rounded-chip border-[1.5px] border-border-strong bg-surface px-2.5 text-right font-mono text-sm outline-none focus:border-primary"
                />
            ),
        },
        {
            key: 'amount',
            header: 'Montant',
            width: '120px',
            align: 'right',
            render: (line) => (
                <span className="font-semibold">
                    {formatAmount(quantityOf(line) * line.unitPrice)}
                </span>
            ),
        },
    ];

    return (
        <Card title={title} isPadded={false} className="overflow-hidden">
            <DataTable
                columns={columns}
                rows={lines}
                rowKey={(line) => line.id}
                minWidth={680}
                caption={title}
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-4 gap-y-3.5 px-5 py-[18px]">
                <SelectField
                    label="Motif"
                    options={reasons.map((reason) => ({
                        value: reason,
                        label: reason,
                    }))}
                />
                {hasDestination ? (
                    <fieldset className="flex flex-col gap-1.5">
                        <legend className="mb-1.5 text-[13px] text-ink-muted">
                            Que faire du produit ?
                        </legend>
                        {[
                            'Remettre en stock (emballage intact)',
                            'Mettre au rebut',
                        ].map((option, index) => (
                            <label
                                key={option}
                                className="flex min-h-9 items-center gap-2.5 text-sm"
                            >
                                <input
                                    type="radio"
                                    name={destinationName}
                                    defaultChecked={index === 0}
                                    className="size-5 accent-primary"
                                />
                                {option}
                            </label>
                        ))}
                    </fieldset>
                ) : null}
            </div>
            {footer}
        </Card>
    );
}

function RecentReturnsCard() {
    return (
        <Card title="Retours récents">
            {recentReturns.length === 0 ? (
                <p className="text-sm text-ink-muted">Aucun retour récent</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {recentReturns.map((recent) => (
                        <li
                            key={recent.reference}
                            className="flex justify-between gap-3 text-sm"
                        >
                            <div className="min-w-0">
                                <div className="font-semibold">
                                    {recent.reference}
                                </div>
                                <div className="text-xs text-ink-muted">
                                    {recent.who}
                                </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <div className="font-mono">{recent.amount}</div>
                                <div className="text-xs text-ink-muted">
                                    {recent.date}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex justify-between gap-3 text-sm">
            <span className="text-ink-muted">{label}</span>
            <span>{value}</span>
        </div>
    );
}
