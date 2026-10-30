/** Groups thousands with a space, no decimals: 1284500 → "1 284 500". */
export function formatNumber(value: number): string {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Congolese franc: 7500 → "7 500 FC". */
export function formatFc(value: number): string {
    return `${formatNumber(value)} FC`;
}

/** Two decimals with a comma: 367.55 → "367,55", 1234.5 → "1 234,50". */
export function formatDecimal(value: number): string {
    const [whole, cents] = value.toFixed(2).split('.');

    return `${formatNumber(Number(whole))},${cents}`;
}

/** USD with a comma decimal: 0.893 → "0,89 USD". */
export function formatUsd(value: number): string {
    return `${formatDecimal(value)} USD`;
}

/** An amount in an invoice currency: USD "4,10", FC "7 500". */
export function formatInvoiceAmount(
    value: number,
    currency: 'USD' | 'FC',
): string {
    return currency === 'USD' ? formatDecimal(value) : formatNumber(value);
}

/** Signed count with a typographic minus: 12 → "+12", -10 → "−10", 0 → "0". */
export function formatSigned(value: number): string {
    if (value === 0) {
        return '0';
    }

    return `${value > 0 ? '+' : '−'}${formatNumber(Math.abs(value))}`;
}

/** Signed FC amount: 1800 → "+ 1 800 FC", -1000 → "− 1 000 FC", 0 → "0". */
export function formatSignedFc(value: number): string {
    if (value === 0) {
        return '0';
    }

    return `${value > 0 ? '+' : '−'} ${formatFc(Math.abs(value))}`;
}

/** Parses a typed signed whole number, accepting "−10" with a typographic minus. Null if invalid. */
export function parseSignedInteger(text: string): number | null {
    const normalized = text.replace(/\s/g, '').replace('−', '-');

    return /^[+-]?\d+$/.test(normalized) ? Number(normalized) : null;
}

/** Long French date with a capital: "Vendredi 23 octobre 2026". */
export function formatLongDate(date: Date): string {
    const text = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);

    return text.charAt(0).toUpperCase() + text.slice(1);
}
