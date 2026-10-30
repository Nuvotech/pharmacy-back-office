/**
 * Sample delivery being received (UI only), from the approved design. The API will replace this
 * module; on validation the server creates one lot per line.
 */

export type InvoiceCurrency = 'USD' | 'FC';

export type ReceptionLine = {
    id: string;
    /** Active ingredient, used in the short-date warning. */
    molecule: string;
    medicine: string;
    /** "Boîte de 24". */
    packLabel: string;
    unitsPerBox: number;
    lotCode: string;
    /** "MM/YYYY". */
    expiry: string;
    /** Months until expiry from the reception date; under 6 is short-dated. */
    monthsToExpiry: number;
    boxes: number;
    /** Purchase cost of one box, in the invoice currency. */
    costPerBox: number;
};

export const suppliers = ['[GROSSISTE A]', '[GROSSISTE B]'];

export const receptionDraft = {
    supplier: '[GROSSISTE A]',
    deliveryNote: 'BL-2026-1187',
    receivedOn: '23/10/2026',
    currency: 'USD' as InvoiceCurrency,
    savedAt: '09:40',
};

/** Expiries under this many months need a confirmation before validating. */
export const shortDatedMonths = 6;

export const receptionLines: ReceptionLine[] = [
    {
        id: 'line-1',
        molecule: 'Artéméther + luméfantrine',
        medicine: 'Artéméther / Luméfantrine 20/120',
        packLabel: 'Boîte de 24',
        unitsPerBox: 24,
        lotCode: 'AL-2304',
        expiry: '08/2028',
        monthsToExpiry: 22,
        boxes: 20,
        costPerBox: 4.1,
    },
    {
        id: 'line-2',
        molecule: 'Paracétamol',
        medicine: 'Paracétamol 500 mg',
        packLabel: 'Boîte de 10',
        unitsPerBox: 10,
        lotCode: 'PC-9021',
        expiry: '02/2029',
        monthsToExpiry: 28,
        boxes: 20,
        costPerBox: 0.18,
    },
    {
        id: 'line-3',
        molecule: 'Amoxicilline',
        medicine: 'Amoxicilline 500 mg',
        packLabel: 'Boîte de 10',
        unitsPerBox: 10,
        lotCode: 'AX-0577',
        expiry: '01/2028',
        monthsToExpiry: 15,
        boxes: 30,
        costPerBox: 0.64,
    },
    {
        id: 'line-4',
        molecule: 'Métronidazole',
        medicine: 'Métronidazole 250 mg',
        packLabel: 'Boîte de 10',
        unitsPerBox: 10,
        lotCode: 'MT-3305',
        expiry: '03/2027',
        monthsToExpiry: 5,
        boxes: 6,
        costPerBox: 0.3,
    },
    {
        id: 'line-5',
        molecule: 'Artésunate',
        medicine: 'Artésunate 50 mg',
        packLabel: 'Boîte de 12',
        unitsPerBox: 12,
        lotCode: 'AS-1102',
        expiry: '05/2028',
        monthsToExpiry: 19,
        boxes: 17,
        costPerBox: 15.35,
    },
];
