/** The open stock count (InventoryController::index). */
export type InventoryCountData = {
    id: string;
    /** ISO date-time. */
    started_at: string;
};

/** One lot to count. */
export type InventoryLine = {
    id: number;
    medicine: string;
    lot_number: string;
    /** "MM/YYYY". */
    expiry: string;
    /** Units the system expected in the lot when the count started. */
    expected_units: number;
    /** Units counted so far, or null when the lot hasn't been counted yet. */
    counted_units: number | null;
    /** Purchase price of one unit in FC, as a decimal string, to value the difference. */
    unit_cost: string;
};
