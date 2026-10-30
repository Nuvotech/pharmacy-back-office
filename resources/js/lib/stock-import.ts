/** Steps of the opening-stock import, as in the design. */
export const importSteps = [
    'Modèle',
    'Fichier chargé',
    'Vérification',
    'Import',
];

/** One problem found in the uploaded file (App\Domain\Stock\Import\CheckStockFile). */
export type ImportError = {
    /** Row number in the Excel file. */
    line: number;
    medicine: string;
    /** Template column, e.g. "date_expiration". */
    column: string;
    problem: string;
};

/** The file being checked (StockImportController::create). */
export type CheckedImport = {
    id: string;
    /** checked: waiting for confirmation; importing: queued or running; failed: the import rolled back. */
    status: 'checked' | 'importing' | 'failed';
    file_name: string;
    row_count: number;
    valid_count: number;
    /** Rows with at least one error. */
    error_row_count: number;
    /** The first errors; the rest are in the downloadable list. */
    errors: ImportError[];
    error_count: number;
    /** ISO date-time. */
    uploaded_at: string | null;
};

/** The import just finished. */
export type CompletedImport = {
    file_name: string;
    imported_lots: number;
    created_medicines: number;
    imported_at: string | null;
};
