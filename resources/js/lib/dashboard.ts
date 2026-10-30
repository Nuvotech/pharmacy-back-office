/** Mirrors App\Domain\Reports\DashboardSummary. Amounts are decimal strings in FC. */
export type AlertKind = 'out' | 'low' | 'expiring' | 'expired';

export type StockAlert = {
    id: string;
    kind: AlertKind;
    name: string;
    detail: string;
    /** Units. */
    stock: number;
    /** Minimum stock in units; null for lot (expiry) alerts. */
    threshold: number | null;
};

export type DashboardSummary = {
    sales_today: { total: string; tickets: number };
    stock_value: string;
    counts: Record<AlertKind, number>;
    /** Up to 10 of each kind; `counts` has the totals. */
    alerts: StockAlert[];
    receptions: {
        id: string;
        reference: string | null;
        supplier: string | null;
        line_count: number;
        /** "YYYY-MM-DD". */
        received_on: string;
    }[];
    devices: {
        id: string;
        /** Name the tablet signs in with, e.g. "Caisse 1". */
        name: string;
        /** Who was signed in on it at its last sync. */
        user_name: string | null;
        is_online: boolean;
        /** ISO date-time, or null before the first sync. */
        last_sync_at: string | null;
    }[];
    open_discrepancies: number;
};

/** Large FC amounts as in the design: 41 600 000 → "41,6 M"; smaller ones in full. */
export function formatCompactAmount(value: number): string {
    if (value >= 1_000_000) {
        return `${(Math.round(value / 100_000) / 10).toFixed(1).replace('.', ',')} M`;
    }

    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
