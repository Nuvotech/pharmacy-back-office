/**
 * Sample consumption for May–October 2026 and expiring value (UI only), from the approved design.
 * The API will replace this module; the page calculates averages, cover and order quantities.
 */

export type MonthlyConsumption = {
    medicine: string;
    /** "plaquettes", "boîtes", "kits", "tubes". */
    unitLabel: string;
    /** Order quantities are rounded up to whole boxes of this many units. */
    unitsPerBox: number;
    stock: number;
    /** Units used per month, May → October. */
    months: number[];
};

export type ExpiringMonth = {
    month: string;
    /** Purchase value of the lots expiring that month, in FC. */
    value: number;
    detail: string;
    isExpired: boolean;
};

export const consumptionMonths = 6;
export const targetCoverMonths = 2;

export const monthlyConsumption: MonthlyConsumption[] = [
    {
        medicine: 'Paracétamol 500 mg',
        unitLabel: 'plaquettes',
        unitsPerBox: 1,
        stock: 184,
        months: [260, 280, 300, 310, 290, 320],
    },
    {
        medicine: 'Artéméther / Luméfantrine 20/120',
        unitLabel: 'boîtes',
        unitsPerBox: 1,
        stock: 6,
        months: [38, 44, 52, 60, 55, 48],
    },
    {
        medicine: 'Amoxicilline 500 mg',
        unitLabel: 'plaquettes',
        unitsPerBox: 1,
        stock: 42,
        months: [70, 75, 82, 80, 88, 90],
    },
    {
        medicine: 'SRO + Zinc',
        unitLabel: 'kits',
        unitsPerBox: 1,
        stock: 30,
        months: [40, 46, 50, 38, 42, 44],
    },
    {
        medicine: 'Ibuprofène 400 mg',
        unitLabel: 'plaquettes',
        unitsPerBox: 1,
        stock: 67,
        months: [60, 62, 70, 68, 72, 75],
    },
    {
        medicine: 'Métronidazole 250 mg',
        unitLabel: 'plaquettes',
        unitsPerBox: 1,
        stock: 4,
        months: [20, 24, 22, 26, 25, 28],
    },
    {
        medicine: 'Quinine 300 mg',
        unitLabel: 'boîtes',
        unitsPerBox: 1,
        stock: 0,
        months: [12, 10, 14, 9, 11, 13],
    },
    {
        medicine: 'Vitamine C 500 mg',
        unitLabel: 'tubes',
        unitsPerBox: 1,
        stock: 15,
        months: [8, 6, 7, 9, 8, 10],
    },
];

export const expiringValue: ExpiringMonth[] = [
    {
        month: 'Octobre (expirés)',
        value: 24_000,
        detail: '2 lots · à retirer',
        isExpired: true,
    },
    {
        month: 'Novembre',
        value: 61_200,
        detail: 'Paracétamol PC-8810 · 34 plaq.',
        isExpired: false,
    },
    {
        month: 'Décembre',
        value: 18_400,
        detail: 'Vitamine C VC-0211 · 6 tubes',
        isExpired: false,
    },
    {
        month: 'Janvier',
        value: 9_600,
        detail: 'Métronidazole MT-2988 · 4 plaq.',
        isExpired: false,
    },
];

export const otherReports = [
    'État du stock',
    'Achats par fournisseur',
    'Inventaires clôturés',
    'Mouvements par lot',
    'Produits les plus utilisés',
];
