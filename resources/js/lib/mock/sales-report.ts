/**
 * Sample sales for 1–23 October 2026 (UI only), from the approved design. The API will replace
 * this module; the page calculates every KPI and share from it.
 */

export type DailySales = {
    day: number;
    /** FC paid in cash. */
    cash: number;
    /** FC paid by mobile money. */
    mobileMoney: number;
};

export type ProductSales = {
    medicine: string;
    quantity: number;
    /** "plaq.", "btes", "kits", "fl." */
    unitLabel: string;
    unitPrice: number;
};

export const salesPeriods = ['1–23 octobre 2026', 'Septembre 2026'];

export const salesSyncedUntil = '10:41';

export const ticketCount = 1264;

/** Cash and mobile money per day, in thousands of FC in the design, stored here in FC. */
export const dailySales: DailySales[] = [
    [720, 380],
    [810, 420],
    [690, 350],
    [560, 260],
    [880, 470],
    [940, 520],
    [760, 410],
    [700, 330],
    [820, 450],
    [610, 300],
    [520, 240],
    [870, 500],
    [930, 560],
    [780, 430],
    [740, 390],
    [850, 470],
    [640, 320],
    [540, 230],
    [900, 540],
    [960, 590],
    [810, 440],
    [770, 400],
    [820, 465],
].map(([cash, mobileMoney], index) => ({
    day: index + 1,
    cash: cash * 1000,
    mobileMoney: mobileMoney * 1000,
}));

export const productSales: ProductSales[] = [
    {
        medicine: 'Paracétamol 500 mg',
        quantity: 2140,
        unitLabel: 'plaq.',
        unitPrice: 1000,
    },
    {
        medicine: 'Artéméther / Luméfantrine 20/120',
        quantity: 318,
        unitLabel: 'btes',
        unitPrice: 7500,
    },
    {
        medicine: 'Amoxicilline 500 mg',
        quantity: 612,
        unitLabel: 'plaq.',
        unitPrice: 2500,
    },
    {
        medicine: 'SRO + Zinc',
        quantity: 290,
        unitLabel: 'kits',
        unitPrice: 3000,
    },
    {
        medicine: 'Ibuprofène 400 mg',
        quantity: 488,
        unitLabel: 'plaq.',
        unitPrice: 1500,
    },
    {
        medicine: 'Paracétamol sirop',
        quantity: 176,
        unitLabel: 'fl.',
        unitPrice: 3500,
    },
];
