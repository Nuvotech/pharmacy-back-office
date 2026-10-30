import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { StatTile } from '@/components/backoffice/stat-tile';
import { Stepper } from '@/components/backoffice/stepper';
import { formatNumber } from '@/lib/format';
import {
    errorRowCount,
    importErrors,
    importSteps,
    uploadedFile,
    validRowCount,
} from '@/lib/mock/stock-import';
import type { ImportError } from '@/lib/mock/stock-import';
import { showNotAvailableYet } from '@/lib/not-available';

/** The wizard is shown at step 3, "Vérification". */
const currentStepIndex = 2;

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

export default function StockImportCreate() {
    const hiddenErrorCount = errorRowCount - importErrors.length;

    return (
        <>
            <PageHeader
                title="Import du stock initial"
                subtitle="Rien n'est enregistré tant que vous n'avez pas confirmé"
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => showNotAvailableYet('Modèle Excel')}
                    >
                        Télécharger le modèle Excel
                    </Button>
                }
            />
            <PageContent>
                <Stepper steps={importSteps} currentIndex={currentStepIndex} />

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
                                {uploadedFile.name}
                            </div>
                            <div className="text-[13px] text-ink-muted">
                                <span className="font-mono">
                                    {formatNumber(uploadedFile.rowCount)}
                                </span>{' '}
                                lignes · chargé à{' '}
                                <span className="font-mono">
                                    {uploadedFile.uploadedAt}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() =>
                                showNotAvailableYet('Changer de fichier')
                            }
                        >
                            Changer de fichier
                        </Button>
                    </div>
                    <StatTile
                        label="Lignes valides"
                        value={formatNumber(validRowCount)}
                        tone="primary"
                        isCompact
                        className="flex-[1_1_160px]"
                    />
                    <StatTile
                        label="Lignes en erreur"
                        value={formatNumber(errorRowCount)}
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
                        <button
                            type="button"
                            onClick={() =>
                                showNotAvailableYet('Liste des erreurs')
                            }
                            className="text-sm font-semibold text-primary hover:text-primary-hover"
                        >
                            Télécharger la liste (Excel)
                        </button>
                    }
                >
                    <DataTable
                        columns={errorColumns}
                        rows={importErrors}
                        rowKey={(error) => `${error.line}-${error.column}`}
                        minWidth={760}
                        caption="Erreurs à corriger dans le fichier"
                        emptyMessage="Aucune erreur dans le fichier"
                    />
                    {hiddenErrorCount > 0 ? (
                        <p className="px-5 py-3.5 text-[13px] text-ink-muted">
                            +{' '}
                            <span className="font-mono">
                                {hiddenErrorCount}
                            </span>{' '}
                            autres erreurs dans le fichier téléchargeable
                        </p>
                    ) : null}
                </Card>

                <div className="flex flex-wrap items-center gap-3">
                    <p className="flex-[1_1_320px] text-sm text-ink-muted">
                        Corrigez les{' '}
                        <span className="font-mono">{errorRowCount}</span>{' '}
                        lignes dans Excel puis rechargez le fichier, ou importez
                        les <span className="font-mono">{validRowCount}</span>{' '}
                        lignes valides maintenant et ajoutez le reste ensuite.
                    </p>
                    <Button
                        variant="secondary"
                        size="large"
                        onClick={() => showNotAvailableYet('Rechargement')}
                    >
                        Recharger le fichier corrigé
                    </Button>
                    <Button
                        size="large"
                        className="px-[22px]"
                        onClick={() => showNotAvailableYet('Import')}
                    >
                        Importer les {formatNumber(validRowCount)} lignes
                        valides
                    </Button>
                </div>
            </PageContent>
        </>
    );
}
