import { useId, useState } from 'react';
import { Badge } from '@/components/backoffice/badge';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { formatNumber, formatSigned, parseSignedInteger } from '@/lib/format';
import {
    adjustmentDraft,
    adjustmentLog,
    adjustmentTypes,
    alertDays,
    expiringLots,
} from '@/lib/mock/adjustments';
import type {
    AdjustmentLogEntry,
    AdjustmentType,
    ExpiringLot,
} from '@/lib/mock/adjustments';
import { showNotAvailableYet } from '@/lib/not-available';
import { cn } from '@/lib/utils';

const lotColumns: DataTableColumn<ExpiringLot>[] = [
    {
        key: 'medicine',
        header: 'Médicament',
        render: (lot) => <CellLines main={lot.medicine} detail={lot.detail} />,
    },
    {
        key: 'lot',
        header: 'Lot',
        width: '110px',
        render: (lot) => (
            <span className="font-mono text-[13px]">{lot.lotCode}</span>
        ),
    },
    {
        key: 'expiry',
        header: 'Expiration',
        width: '130px',
        render: (lot) => (
            <Badge tone={lot.isExpired ? 'danger' : 'warning'}>
                {lot.expiryLabel}
            </Badge>
        ),
    },
    {
        key: 'quantity',
        header: 'Qté',
        width: '90px',
        align: 'right',
        render: (lot) => lot.quantityLabel,
    },
    {
        key: 'action',
        header: 'Action',
        width: '150px',
        isHeaderHidden: true,
        render: (lot) => (
            <div className="text-right">
                {lot.isExpired ? (
                    <Button
                        variant="danger"
                        size="small"
                        className="px-3.5 text-[13px] font-bold"
                        onClick={() => showNotAvailableYet('Retrait du lot')}
                    >
                        Retirer du stock
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        size="small"
                        className="px-3.5 text-[13px] font-bold"
                        onClick={() => showNotAvailableYet('Promotion')}
                    >
                        Promouvoir
                    </Button>
                )}
            </div>
        ),
    },
];

const logColumns: DataTableColumn<AdjustmentLogEntry>[] = [
    {
        key: 'date',
        header: 'Date',
        width: '110px',
        render: (entry) => (
            <span className="font-mono text-[13px] text-ink-muted">
                {entry.date}
            </span>
        ),
    },
    {
        key: 'medicine',
        header: 'Médicament · lot',
        render: (entry) => (
            <CellLines main={entry.medicineAndLot} detail={entry.reason} />
        ),
    },
    {
        key: 'type',
        header: 'Type',
        width: '130px',
        render: (entry) => <span className="text-[13px]">{entry.type}</span>,
    },
    {
        key: 'quantity',
        header: 'Qté',
        width: '90px',
        align: 'right',
        render: (entry) => (
            <span
                className={cn(
                    'font-bold',
                    entry.quantity > 0 ? 'text-info' : 'text-danger',
                )}
            >
                {formatSigned(entry.quantity)}
            </span>
        ),
    },
    {
        key: 'user',
        header: 'Par',
        width: '120px',
        render: (entry) => (
            <div className="text-right text-[13px] text-ink-muted">
                {entry.user}
            </div>
        ),
    },
];

export default function AdjustmentsIndex() {
    return (
        <>
            <PageHeader
                title="Ajustements et péremptions"
                subtitle="Toute correction du stock passe par ici, avec un motif et votre nom"
            />
            <PageContent>
                <div className="flex flex-wrap items-start gap-5">
                    <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-5">
                        <Card
                            title="Lots expirés et à date courte"
                            isPadded={false}
                            className="overflow-hidden"
                            actions={
                                <span className="text-[13px] text-ink-muted">
                                    Alerte à{' '}
                                    <span className="font-mono">
                                        {alertDays}
                                    </span>{' '}
                                    jours
                                </span>
                            }
                        >
                            <DataTable
                                columns={lotColumns}
                                rows={expiringLots}
                                rowKey={(lot) => lot.id}
                                minWidth={680}
                                caption="Lots expirés et à date courte"
                                emptyMessage="Aucun lot expiré ni à date courte"
                            />
                        </Card>

                        <Card
                            title="Journal des ajustements"
                            isPadded={false}
                            className="overflow-hidden"
                        >
                            <DataTable
                                columns={logColumns}
                                rows={adjustmentLog}
                                rowKey={(entry) => entry.id}
                                minWidth={680}
                                caption="Journal des ajustements"
                                emptyMessage="Aucun ajustement"
                                isHeaderHidden
                            />
                        </Card>
                    </div>

                    <NewAdjustmentForm />
                </div>
            </PageContent>
        </>
    );
}

function NewAdjustmentForm() {
    const typeLegendId = useId();
    const [lotCode, setLotCode] = useState(adjustmentDraft.lots[0].code);
    const [type, setType] = useState<AdjustmentType>(adjustmentDraft.type);
    const [quantityText, setQuantityText] = useState(adjustmentDraft.quantity);
    const [reason, setReason] = useState(adjustmentDraft.reason);
    const [isReasonMissing, setIsReasonMissing] = useState(false);

    const lot = adjustmentDraft.lots.find(
        (candidate) => candidate.code === lotCode,
    );
    const quantity = parseSignedInteger(quantityText);
    const stockAfter = lot && quantity !== null ? lot.units + quantity : null;

    const handleSave = () => {
        if (reason.trim() === '') {
            setIsReasonMissing(true);

            return;
        }

        showNotAvailableYet('Ajustement');
    };

    return (
        <Card title="Nouvel ajustement" isRoomy className="flex-[1_1_320px]">
            <TextField
                label="Médicament"
                defaultValue={adjustmentDraft.medicine}
            />
            <SelectField
                label="Lot"
                value={lotCode}
                onChange={(event) => setLotCode(event.target.value)}
                options={adjustmentDraft.lots.map((option) => ({
                    value: option.code,
                    label: `${option.code} · ${formatNumber(option.units)} u · exp. ${option.expiry}`,
                }))}
            />

            <div role="radiogroup" aria-labelledby={typeLegendId}>
                <div
                    id={typeLegendId}
                    className="mb-1.5 text-[13px] text-ink-muted"
                >
                    Type
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {adjustmentTypes.map((option) => {
                        const isSelected = option === type;

                        return (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => setType(option)}
                                className={cn(
                                    'h-11 rounded-input text-sm font-semibold',
                                    isSelected
                                        ? 'border-2 border-primary bg-primary-soft text-on-primary-soft'
                                        : 'border border-border-strong bg-surface text-ink hover:bg-background',
                                )}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            <TextField
                label="Quantité (unités, − pour retirer)"
                value={quantityText}
                onChange={(event) => setQuantityText(event.target.value)}
                isMono
                inputMode="numeric"
                hint={
                    quantity === null && quantityText.trim() !== ''
                        ? 'Nombre entier, par exemple −10 ou 20.'
                        : undefined
                }
            />

            <ReasonField
                value={reason}
                onChange={(text) => {
                    setReason(text);
                    setIsReasonMissing(false);
                }}
                isMissing={isReasonMissing}
            />

            <p className="rounded-input bg-background px-3 py-2.5 text-[13px] text-ink-muted">
                Stock après ajustement :{' '}
                <span className="font-mono font-semibold text-ink">
                    {stockAfter === null
                        ? '—'
                        : `${formatNumber(stockAfter)} u`}
                </span>
            </p>

            <Button size="large" onClick={handleSave}>
                Enregistrer l'ajustement
            </Button>
        </Card>
    );
}

function ReasonField({
    value,
    onChange,
    isMissing,
}: {
    value: string;
    onChange: (text: string) => void;
    isMissing: boolean;
}) {
    const id = useId();

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-[13px] text-ink-muted">
                Motif (obligatoire)
            </label>
            <textarea
                id={id}
                rows={3}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required
                aria-invalid={isMissing}
                aria-describedby={isMissing ? `${id}-error` : undefined}
                className={cn(
                    'resize-y rounded-input border-[1.5px] bg-surface px-3 py-2.5 text-[15px] text-ink outline-none focus:border-primary',
                    isMissing ? 'border-danger' : 'border-border-strong',
                )}
            />
            {isMissing ? (
                <p id={`${id}-error`} className="text-xs text-danger">
                    Le motif est obligatoire.
                </p>
            ) : null}
        </div>
    );
}
