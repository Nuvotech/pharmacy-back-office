/**
 * Shapes and input helpers for "Nouvelle réception". The server (ReceptionResource) is the source of
 * truth; these only parse what the user types and echo it back before the draft is saved.
 */

/** Invoice currency as the server stores it; CDF is shown as "FC". */
export type InvoiceCurrency = 'USD' | 'CDF';

export type ReceptionLineData = {
    id: string;
    medicine_id: string;
    medicine_name: string;
    dci: string | null;
    /** Box size as delivered (the medicine's for lines saved before it was asked). */
    units_per_pack: number;
    lot_number: string;
    /** "YYYY-MM". */
    expiry: string;
    packs: number;
    units: number;
    /** Decimal string in the invoice currency, e.g. "4.10". */
    cost_per_pack: string;
    is_short_dated: boolean;
};

export type ReceptionData = {
    id: string;
    status: 'draft' | 'validated';
    supplier_id: string | null;
    invoice_ref: string | null;
    /** "YYYY-MM-DD". */
    received_on: string;
    currency: InvoiceCurrency;
    total_cost: string;
    exchange_rate: string | null;
    validated_at: string | null;
    updated_at: string | null;
    lines: ReceptionLineData[];
};

export type ReceptionMedicineOption = {
    id: string;
    name: string;
    dci: string | null;
    units_per_pack: number;
};

export const currencyLabel = (currency: InvoiceCurrency): 'USD' | 'FC' =>
    currency === 'USD' ? 'USD' : 'FC';

/** "08/2028" → "2028-08"; null when the month or year is not valid. */
export function parseExpiryInput(text: string): string | null {
    const match = text.trim().match(/^(\d{1,2})\s*\/\s*(\d{4})$/);

    if (!match) {
        return null;
    }

    const month = Number(match[1]);

    return month >= 1 && month <= 12
        ? `${match[2]}-${String(month).padStart(2, '0')}`
        : null;
}

/** "2028-08" → "08/2028". */
export const formatExpiry = (expiry: string): string =>
    `${expiry.slice(5, 7)}/${expiry.slice(0, 4)}`;

/** "23/10/2026" → "2026-10-23"; null when it is not a real date. */
export function parseDateInput(text: string): string | null {
    const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (!match) {
        return null;
    }

    const [day, month, year] = [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
    ];
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** "2026-10-23" → "23/10/2026". */
export const formatDateInput = (isoDate: string): string =>
    `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}`;

/** "2,60" or "2.60" → "2.60"; null unless a non-negative amount with at most 2 decimals. */
export function parseCostInput(text: string): string | null {
    const normalized = text.trim().replace(/\s/g, '').replace(',', '.');

    return /^\d{1,10}(\.\d{1,2})?$/.test(normalized) ? normalized : null;
}

/** "4.10" → 410: amounts are added in hundredths, never as floats. */
export function toHundredths(amount: string): number {
    const [whole = '0', fraction = ''] = amount.split('.');

    return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

/**
 * Same rule as the server (App\Domain\Receptions\ShortDated): the lot expires (end of its expiry month)
 * less than `months` months after the reception date.
 */
export function isShortDated(
    expiry: string,
    receivedOn: string,
    months: number,
): boolean {
    const [expiryYear, expiryMonth] = expiry.split('-').map(Number);
    const [year, month, day] = receivedOn.split('-').map(Number);
    const lastDayOfExpiry = new Date(expiryYear, expiryMonth, 0);
    const lastDayOfTargetMonth = new Date(year, month - 1 + months + 1, 0);
    const limit = new Date(
        year,
        month - 1 + months,
        Math.min(day, lastDayOfTargetMonth.getDate()),
    );

    return lastDayOfExpiry < limit;
}

/** Whole months from the reception date to the end of the expiry month (0 when already past). */
export function monthsToExpiry(expiry: string, receivedOn: string): number {
    const [expiryYear, expiryMonth] = expiry.split('-').map(Number);
    const [year, month] = receivedOn.split('-').map(Number);

    return Math.max(0, (expiryYear - year) * 12 + (expiryMonth - month));
}
