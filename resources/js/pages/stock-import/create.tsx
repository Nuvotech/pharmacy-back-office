import { router, useForm, usePage } from '@inertiajs/react';
import { CircleCheck, FileSpreadsheet, LoaderCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Button, ButtonLink } from '@/components/backoffice/button';
import { buttonVariants } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { StatTile } from '@/components/backoffice/stat-tile';
import { Stepper } from '@/components/backoffice/stepper';
import { formatNumber } from '@/lib/format';
import { importSteps } from '@/lib/stock-import';
import type {
    CheckedImport,
    CompletedImport,
    ImportError,
} from '@/lib/stock-import';
import { index as medicines } from '@/routes/medicines';
import {
    create,
    errors as errorList,
    run,
    store,
    template,
} from '@/routes/stock-import';

type StockImportCreateProps = {
    /** The file being checked, or null before an upload. */
    stockImport: CheckedImport | null;
    /** The import that just finished, or null. */
    completed: CompletedImport | null;
};

const errorColumns: DataTableColumn<ImportError>[] = [
    {
        key: 'line',
        header: 'Ligne',
        width: '70px',
        render: (error) => (
            <span className="font-mono text-ink-muted">{error.line}</span>
        ),
    },
    {
        key: 'medicine',
        header: 'Médicament',
        width: '32%',
        render: (error) => (
            <span className="font-semibold">{error.medicine}</span>
        ),
    },
    {
        key: 'column',
        header: 'Colonne',
        width: '150px',
        render: (error) => (
            <span className="font-mono text-[13px]">{error.column}</span>
        ),
    },
    {
        key: 'problem',
        header: 'Problème',
        render: (error) => <span className="text-danger">{error.problem}</span>,
    },
];

const time = (iso: string | null) =>
    iso
        ? new Intl.DateTimeFormat('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
          }).format(new Date(iso))
        : '';

export default function StockImportCreate({
    stockImport,
    completed,
}: StockImportCreateProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const upload = useForm<{ file: File | null }>({ file: null });

    const chooseFile = () => fileInputRef.current?.click();

    const handleFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        event.target.value = '';
        if (!file) {
            return;
        }

        upload.transform(() => ({ file }));
        upload.post(store().url, { forceFormData: true, preserveScroll: true });
    };

    const isImporting = stockImport?.status === 'importing';
    const currentStep = completed || isImporting ? 3 : stockImport ? 2 : 0;

    return (
        <>
            <PageHeader
                title="Import du stock initial"
                subtitle="Rien n'est enregistré tant que vous n'avez pas confirmé"
                actions={
                    <a
                        href={template().url}
                        className={buttonVariants({ variant: 'secondary' })}
                    >
                        Télécharger le modèle Excel
                    </a>
                }
            />
            <PageContent>
                <Stepper steps={importSteps} currentIndex={currentStep} />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    aria-label="Fichier du stock"
                    onChange={handleFileChosen}
                />
                {upload.errors.file ? (
                    <p
                        role="alert"
                        className="rounded-card bg-danger-soft px-5 py-3.5 text-sm text-danger"
                    >
                        {upload.errors.file}
                    </p>
                ) : null}

                {completed ? (
                    <ImportDone completed={completed} />
                ) : stockImport && isImporting ? (
                    <ImportInProgress stockImport={stockImport} />
                ) : stockImport ? (
                    <Verification
                        stockImport={stockImport}
                        isUploading={upload.processing}
                        onChooseFile={chooseFile}
                    />
                ) : (
                    <Card isRoomy className="max-w-[720px]">
                        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-ink-muted">
                            <li>
                                Téléchargez le modèle Excel : une ligne par lot,
                                avec{' '}
                                <span className="font-mono text-ink">nom</span>,{' '}
                                <span className="font-mono text-ink">
                                    numero_lot
                                </span>
                                ,{' '}
                                <span className="font-mono text-ink">
                                    date_expiration
                                </span>
                                ,{' '}
                                <span className="font-mono text-ink">
                                    quantite
                                </span>{' '}
                                (en boîtes),{' '}
                                <span className="font-mono text-ink">
                                    unites_par_boite
                                </span>{' '}
                                et les prix en FC (
                                <span className="font-mono text-ink">
                                    prix_boite
                                </span>
                                ,{' '}
                                <span className="font-mono text-ink">
                                    prix_unite
                                </span>
                                ,{' '}
                                <span className="font-mono text-ink">
                                    prix_achat_boite
                                </span>
                                ), et si vous voulez le{' '}
                                <span className="font-mono text-ink">
                                    rayon
                                </span>
                                .
                            </li>
                            <li>Remplissez-le avec le stock compté.</li>
                            <li>
                                Chargez le fichier : chaque ligne est vérifiée
                                avant tout enregistrement.
                            </li>
                        </ol>
                        <Button
                            size="large"
                            className="self-start px-[22px]"
                            disabled={upload.processing}
                            onClick={chooseFile}
                        >
                            {upload.processing
                                ? 'Vérification…'
                                : 'Charger le fichier (.xlsx ou .csv)'}
                        </Button>
                    </Card>
                )}
            </PageContent>
        </>
    );
}

function Verification({
    stockImport,
    isUploading,
    onChooseFile,
}: {
    stockImport: CheckedImport;
    isUploading: boolean;
    onChooseFile: () => void;
}) {
    const runForm = useForm({});
    const importError = usePage().props.errors.import;
    const hiddenErrorCount =
        stockImport.error_count - stockImport.errors.length;

    const importValidRows = () => {
        runForm.post(run(stockImport.id).url, { preserveScroll: true });
    };

    return (
        <>
            <div className="flex flex-wrap gap-3.5">
                <div className="flex min-w-0 flex-[2_1_320px] items-center gap-3.5 rounded-card bg-surface px-5 py-[18px] shadow-card">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-input bg-primary-soft text-on-primary-soft"
                        aria-hidden
                    >
                        <FileSpreadsheet className="size-[22px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">
                            {stockImport.file_name}
                        </div>
                        <div className="text-[13px] text-ink-muted">
                            <span className="font-mono">
                                {formatNumber(stockImport.row_count)}
                            </span>{' '}
                            {stockImport.row_count === 1 ? 'ligne' : 'lignes'} ·
                            chargé à{' '}
                            <span className="font-mono">
                                {time(stockImport.uploaded_at)}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        disabled={isUploading}
                        onClick={onChooseFile}
                    >
                        Changer de fichier
                    </Button>
                </div>
                <StatTile
                    label="Lignes valides"
                    value={formatNumber(stockImport.valid_count)}
                    tone="primary"
                    isCompact
                    className="flex-[1_1_160px]"
                />
                <StatTile
                    label="Lignes en erreur"
                    value={formatNumber(stockImport.error_row_count)}
                    tone="danger"
                    isCompact
                    className="flex-[1_1_160px]"
                />
            </div>

            <Card
                title="Erreurs à corriger"
                isPadded={false}
                className="overflow-hidden"
                actions={
                    stockImport.error_count > 0 ? (
                        <a
                            href={errorList(stockImport.id).url}
                            className="text-sm font-semibold text-primary hover:text-primary-hover"
                        >
                            Télécharger la liste (Excel)
                        </a>
                    ) : undefined
                }
            >
                <DataTable
                    columns={errorColumns}
                    rows={stockImport.errors}
                    rowKey={(error) =>
                        `${error.line}-${error.column}-${error.problem}`
                    }
                    minWidth={760}
                    caption="Erreurs à corriger dans le fichier"
                    emptyMessage="Aucune erreur dans le fichier"
                />
                {hiddenErrorCount > 0 ? (
                    <p className="px-5 py-3.5 text-[13px] text-ink-muted">
                        +{' '}
                        <span className="font-mono">
                            {formatNumber(hiddenErrorCount)}
                        </span>{' '}
                        {hiddenErrorCount === 1
                            ? 'autre erreur dans le fichier téléchargeable'
                            : 'autres erreurs dans le fichier téléchargeable'}
                    </p>
                ) : null}
            </Card>

            {stockImport.status === 'failed' ? (
                <p
                    role="alert"
                    className="rounded-card bg-danger-soft px-5 py-3.5 text-sm text-danger"
                >
                    L'import n'a pas abouti : rien n'a été enregistré. Vous
                    pouvez relancer l'import.
                </p>
            ) : null}
            {importError ? (
                <p role="alert" className="text-sm text-danger">
                    {importError}
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
                <p className="flex-[1_1_320px] text-sm text-ink-muted">
                    {stockImport.error_row_count > 0 ? (
                        <>
                            Corrigez les{' '}
                            <span className="font-mono">
                                {formatNumber(stockImport.error_row_count)}
                            </span>{' '}
                            lignes dans Excel puis rechargez le fichier, ou
                            importez les{' '}
                            <span className="font-mono">
                                {formatNumber(stockImport.valid_count)}
                            </span>{' '}
                            lignes valides maintenant et ajoutez le reste
                            ensuite.
                        </>
                    ) : (
                        'Toutes les lignes sont valides.'
                    )}
                </p>
                {stockImport.error_row_count > 0 ? (
                    <Button
                        variant="secondary"
                        size="large"
                        disabled={isUploading}
                        onClick={onChooseFile}
                    >
                        Recharger le fichier corrigé
                    </Button>
                ) : null}
                <Button
                    size="large"
                    className="px-[22px]"
                    disabled={
                        runForm.processing || stockImport.valid_count === 0
                    }
                    onClick={importValidRows}
                >
                    {runForm.processing
                        ? 'Lancement…'
                        : stockImport.status === 'failed'
                          ? "Relancer l'import"
                          : stockImport.error_row_count > 0
                            ? `Importer les ${formatNumber(stockImport.valid_count)} lignes valides`
                            : `Importer les ${formatNumber(stockImport.valid_count)} lignes`}
                </Button>
            </div>
        </>
    );
}

/** How often the page checks whether the queued import has finished. */
const importPollMs = 2_000;

/**
 * The import runs in the background (queued job): the page asks every 2 s, passing the import's id, so
 * the server answers with the summary once it is done.
 */
function ImportInProgress({ stockImport }: { stockImport: CheckedImport }) {
    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({
                only: ['stockImport', 'completed'],
                data: { done: stockImport.id },
            });
        }, importPollMs);

        return () => window.clearInterval(timer);
    }, [stockImport.id]);

    return (
        <Card isRoomy className="max-w-[720px]">
            <div className="flex items-start gap-3.5">
                <LoaderCircle
                    className="size-7 shrink-0 animate-spin text-primary"
                    aria-hidden
                />
                <div className="flex flex-col gap-1" role="status">
                    <h2 className="text-[17px] font-bold">Import en cours…</h2>
                    <p className="text-sm text-ink-muted">
                        {stockImport.file_name} ·{' '}
                        <span className="font-mono">
                            {formatNumber(stockImport.valid_count)}
                        </span>{' '}
                        {stockImport.valid_count === 1
                            ? 'ligne à importer'
                            : 'lignes à importer'}
                        . Cette page se met à jour toute seule ; vous pouvez
                        aussi la quitter.
                    </p>
                </div>
            </div>
        </Card>
    );
}

function ImportDone({ completed }: { completed: CompletedImport }) {
    return (
        <Card isRoomy className="max-w-[720px]">
            <div className="flex items-start gap-3.5">
                <CircleCheck
                    className="size-7 shrink-0 text-primary"
                    aria-hidden
                />
                <div className="flex flex-col gap-1">
                    <h2 className="text-[17px] font-bold">Import terminé</h2>
                    <p className="text-sm text-ink-muted">
                        {completed.file_name} · à{' '}
                        <span className="font-mono">
                            {time(completed.imported_at)}
                        </span>
                    </p>
                    <p className="text-sm">
                        <span className="font-mono font-semibold">
                            {formatNumber(completed.imported_lots)}
                        </span>{' '}
                        {completed.imported_lots === 1
                            ? 'lot ajouté au stock'
                            : 'lots ajoutés au stock'}
                        ,{' '}
                        <span className="font-mono font-semibold">
                            {formatNumber(completed.created_medicines)}
                        </span>{' '}
                        {completed.created_medicines === 1
                            ? 'médicament créé'
                            : 'médicaments créés'}
                        . Les caisses les recevront à leur prochaine
                        synchronisation.
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                <ButtonLink href={medicines()} variant="secondary">
                    Voir les médicaments
                </ButtonLink>
                <ButtonLink href={create()}>
                    Importer un autre fichier
                </ButtonLink>
            </div>
        </Card>
    );
}
