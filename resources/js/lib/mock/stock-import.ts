/**
 * Sample opening-stock import at the "Vérification" step (UI only), from the approved design.
 * The server will validate the uploaded file and return this shape.
 */

export type ImportError = {
    /** Row number in the Excel file. */
    line: number;
    medicine: string;
    /** Excel column name, e.g. "date_expiration". */
    column: string;
    problem: string;
};

export const importSteps = [
    'Modèle',
    'Fichier chargé',
    'Vérification',
    'Import',
];

export const uploadedFile = {
    name: 'stock-initial-pharmacie.xlsx',
    rowCount: 412,
    uploadedAt: '09:12',
};

export const validRowCount = 398;
export const errorRowCount = 14;

/** The first errors; the rest are only in the downloadable list. */
export const importErrors: ImportError[] = [
    {
        line: 14,
        medicine: 'Ceftriaxone 1 g',
        column: 'date_expiration',
        problem: "Date vide — chaque lot doit avoir une date d'expiration",
    },
    {
        line: 37,
        medicine: 'Paracétamol sirop',
        column: 'date_expiration',
        problem: 'Date passée (12/09/2026) — lot déjà expiré',
    },
    {
        line: 58,
        medicine: 'Amoxicilline 250 mg',
        column: 'prix_boite',
        problem: "Texte « deux mille » au lieu d'un nombre",
    },
    {
        line: 91,
        medicine: 'Quinine 300 mg',
        column: 'unites_par_boite',
        problem: 'Vaut 0 — au moins 1 unité par boîte',
    },
    {
        line: 120,
        medicine: 'Cotrimoxazole 480 mg',
        column: 'quantite',
        problem: 'Nombre négatif (-20)',
    },
    {
        line: 203,
        medicine: 'Ibuprofène 400 mg',
        column: 'nom',
        problem: 'Doublon de la ligne 44 avec le même numéro de lot',
    },
];
