/** A row of the "Médicaments" list (App\Http\Resources\MedicineListResource). */
export type MedicineRow = {
    id: string;
    name: string;
    dci: string | null;
    form: string | null;
    image_url: string | null;
    categories: string[];
    units_per_pack: number;
    /** Decimal string in FC, e.g. "1000.00". */
    sale_price_pack: string;
    /** Decimal string in FC, or null when not sold by the unit. */
    sale_price_unit: string | null;
    min_stock_units: number;
    sellable_units: number;
    sellable_packs: number;
    stock_status: StockStatus;
    prescription_required: boolean;
};

/** Mirrors App\Enums\StockStatus. */
export type StockStatus = 'ok' | 'low' | 'out';

export type MedicineListFilter = 'all' | 'out' | 'low' | 'prescription';

export type CategoryOption = { slug: string; name: string };

/** Forms offered in the medicine form; a medicine may have none. */
export const medicineForms = [
    'Comprimé',
    'Gélule',
    'Sirop',
    'Injectable',
    'Sachet',
    'Kit',
] as const;

/** The medicine being edited (MedicineController::formProps). Prices are whole FC as strings. */
export type MedicineFormData = {
    id: string;
    name: string;
    dci: string | null;
    dosage: string | null;
    form: string | null;
    barcode: string | null;
    units_per_pack: number;
    sale_price_pack: string;
    sale_price_unit: string | null;
    min_stock_units: number;
    prescription_required: boolean;
    category_slugs: string[];
};

/** A sellable lot of the medicine, in selling order (first expired, first out). */
export type MedicineLot = {
    id: string;
    lot_number: string;
    /** "MM/YYYY". */
    expiry: string;
    qty_on_hand: number;
    /** Purchase cost of one box in FC, at the current box size. */
    cost_per_pack: string;
};

/** Laravel's paginated resource collection. */
export type Paginated<T> = {
    data: T[];
    links: { prev: string | null; next: string | null };
    meta: { from: number | null; to: number | null; total: number };
};
