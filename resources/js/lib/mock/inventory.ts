/**
 * Sample stock count in progress (UI only), from the approved design. The API will replace this
 * module; on closing, each difference becomes a signed adjustment.
 */

export type InventoryLine = {
    id: string;
    medicine: string;
    /** "MM/YYYY". */
    expiry: string;
    lotCode: string;
    shelf: string;
    /** Units the system expects in the lot. */
    systemUnits: number;
    /** Units counted so far, or null when the lot hasn't been counted yet. */
    countedUnits: number | null;
    /** Purchase price of one unit, in FC, used to value the difference. */
    unitCost: number;
};

export const inventorySession = {
    title: 'Inventaire · octobre 2026',
    openedAt: '23/10 à 07:30',
    countedLots: 214,
    totalLots: 412,
    progressNote: 'Rayons A à D comptés · E et F restants',
    /** Totals over the whole count, not just the sample rows below. */
    lotsWithDifference: 9,
    uncountedLots: 198,
    differenceValue: -58_200,
};

export const inventoryLines: InventoryLine[] = [
    {
        id: 'pc-8810',
        medicine: 'Paracétamol 500 mg',
        expiry: '11/2026',
        lotCode: 'PC-8810',
        shelf: 'A2',
        systemUnits: 340,
        countedUnits: 330,
        unitCost: 100,
    },
    {
        id: 'pc-8902',
        medicine: 'Paracétamol 500 mg',
        expiry: '07/2027',
        lotCode: 'PC-8902',
        shelf: 'A2',
        systemUnits: 800,
        countedUnits: 800,
        unitCost: 100,
    },
    {
        id: 'ax-0412',
        medicine: 'Amoxicilline 500 mg',
        expiry: '06/2027',
        lotCode: 'AX-0412',
        shelf: 'B1',
        systemUnits: 120,
        countedUnits: 110,
        unitCost: 250,
    },
    {
        id: 'ib-2210',
        medicine: 'Ibuprofène 400 mg',
        expiry: '09/2027',
        lotCode: 'IB-2210',
        shelf: 'A3',
        systemUnits: 400,
        countedUnits: 412,
        unitCost: 150,
    },
    {
        id: 'mt-2988',
        medicine: 'Métronidazole 250 mg',
        expiry: '01/2027',
        lotCode: 'MT-2988',
        shelf: 'B2',
        systemUnits: 40,
        countedUnits: 40,
        unitCost: 120,
    },
    {
        id: 'al-2291',
        medicine: 'Artéméther / Luméfantrine',
        expiry: '03/2027',
        lotCode: 'AL-2291',
        shelf: 'C1',
        systemUnits: 144,
        countedUnits: 120,
        unitCost: 313,
    },
    {
        id: 'sz-1140',
        medicine: 'SRO + Zinc',
        expiry: '11/2027',
        lotCode: 'SZ-1140',
        shelf: 'D4',
        systemUnits: 30,
        countedUnits: 30,
        unitCost: 3000,
    },
    {
        id: 'vc-0211',
        medicine: 'Vitamine C 500 mg',
        expiry: '12/2026',
        lotCode: 'VC-0211',
        shelf: 'D1',
        systemUnits: 120,
        countedUnits: null,
        unitCost: 200,
    },
];
