/** Mirrors App\Domain\Reports\SalesReport. Amounts are decimal strings in FC. */
export type SalesDay = {
    /** "YYYY-MM-DD". */
    date: string;
    day: number;
    cash: string;
    mobile_money: string;
};

export type BestSeller = {
    medicine_id: string;
    medicine: string;
    packs: number;
    units: number;
    revenue: string;
};

export type SalesReportData = {
    /** "YYYY-MM". */
    month: string;
    from: string;
    to: string;
    days: SalesDay[];
    total: string;
    cash: string;
    mobile_money: string;
    tickets: number;
    best_sellers: BestSeller[];
    /** Latest sync of a sale (ISO), or null when none. */
    synced_until: string | null;
};

/** Mirrors App\Domain\Reports\ConsumptionReport. Quantities are units. */
export type ConsumptionRow = {
    medicine_id: string;
    medicine: string;
    units_per_pack: number;
    /** Units used per month, oldest first, matching `months`. */
    months: number[];
    average: number;
    stock: number;
    /** Months of stock left at the average rate; null without use. */
    cover_months: number | null;
    order_units: number;
    order_packs: number;
};

export type ExpiringMonth = {
    /** "YYYY-MM", or null for lots already expired. */
    month: string | null;
    is_expired: boolean;
    /** Purchase value in FC. */
    value: string;
    lot_count: number;
    first_lot: { medicine: string; lot_number: string; units: number } | null;
};

export type ConsumptionReportData = {
    /** "YYYY-MM", oldest first. */
    months: string[];
    rows: ConsumptionRow[];
    expiring: ExpiringMonth[];
};

/** "2026-10" → "octobre 2026". */
export function monthLabel(month: string, withYear = true): string {
    const [year, monthNumber] = month.split('-').map(Number);

    return new Intl.DateTimeFormat('fr-FR', {
        month: 'long',
        ...(withYear ? { year: 'numeric' } : {}),
    }).format(new Date(year, monthNumber - 1, 1));
}

/** "1–23 octobre 2026" for the current month, "septembre 2026" for a full past month. */
export function periodLabel(report: SalesReportData): string {
    const lastDay = Number(report.to.slice(8, 10));
    const [year, month] = report.from.split('-').map(Number);
    const monthLength = new Date(year, month, 0).getDate();
    const label = monthLabel(report.month);

    return lastDay === monthLength
        ? label.charAt(0).toUpperCase() + label.slice(1)
        : `1–${lastDay} ${label}`;
}
