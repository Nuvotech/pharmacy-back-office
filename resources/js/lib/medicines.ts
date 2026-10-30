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

/** Laravel's paginated resource collection. */
export type Paginated<T> = {
    data: T[];
    links: { prev: string | null; next: string | null };
    meta: { from: number | null; to: number | null; total: number };
};
