/**
 * Sample medicines for the back-office screens (UI only). Values come from the approved
 * designs; the API will replace this module.
 */

export type MedicineCategory =
    | 'Douleur'
    | 'Paludisme'
    | 'Antibiotiques'
    | 'Enfants'
    | 'Vitamines';

export const medicineCategories: MedicineCategory[] = [
    'Douleur',
    'Paludisme',
    'Antibiotiques',
    'Enfants',
    'Vitamines',
];

export const medicineForms = [
    'Comprimé',
    'Gélule',
    'Sirop',
    'Injectable',
    'Sachet',
    'Kit',
] as const;

export type MedicineForm = (typeof medicineForms)[number];

export type Lot = {
    code: string;
    /** Stock in units (tablets, capsules, bottles…). */
    units: number;
    /** Expiry month, "MM/YYYY". */
    expiry: string;
    /** Purchase cost of one box, in FC. */
    costPerBox: number;
};

export type Medicine = {
    id: string;
    name: string;
    molecule: string;
    dosage: string;
    form: MedicineForm;
    /** Shown under the name in the list: "Comprimé", "Flacon 100 ml", "Tube de 20". */
    presentation: string;
    category: MedicineCategory;
    barcode: string;
    isPrescriptionOnly: boolean;
    unitsPerBox: number;
    boxPrice: number;
    /** Null when the medicine is not sold by the unit. */
    unitPrice: number | null;
    /** Minimum stock, in units. */
    threshold: number;
    /** Short unit label for products counted per item rather than per tablet: "fl", "kits". */
    itemLabel?: string;
    /** Oldest expiry first (first expired, first out); the last one is the latest delivery. */
    lots: Lot[];
};

/** Daily rate set in Paramètres. */
export const fcPerUsd = 2800;

export const totalMedicineCount = 412;

export const medicines: Medicine[] = [
    {
        id: 'paracetamol-500',
        name: 'Paracétamol 500 mg',
        molecule: 'Paracétamol',
        dosage: '500 mg',
        form: 'Comprimé',
        presentation: 'Comprimé',
        category: 'Douleur',
        barcode: '6 001234 500017',
        isPrescriptionOnly: false,
        unitsPerBox: 10,
        boxPrice: 1000,
        unitPrice: 100,
        threshold: 500,
        lots: [
            { code: 'PC-8810', units: 340, expiry: '11/2026', costPerBox: 750 },
            { code: 'PC-8902', units: 800, expiry: '07/2027', costPerBox: 780 },
            { code: 'PC-9021', units: 700, expiry: '02/2029', costPerBox: 800 },
        ],
    },
    {
        id: 'artemether-lumefantrine',
        name: 'Artéméther / Luméfantrine 20/120',
        molecule: 'Artéméther + luméfantrine',
        dosage: '20/120 mg',
        form: 'Comprimé',
        presentation: 'Comprimé',
        category: 'Paludisme',
        barcode: '6 001234 500024',
        isPrescriptionOnly: false,
        unitsPerBox: 24,
        boxPrice: 7500,
        unitPrice: 350,
        threshold: 720,
        lots: [
            {
                code: 'AL-2291',
                units: 144,
                expiry: '03/2027',
                costPerBox: 5200,
            },
        ],
    },
    {
        id: 'amoxicilline-500',
        name: 'Amoxicilline 500 mg',
        molecule: 'Amoxicilline',
        dosage: '500 mg',
        form: 'Gélule',
        presentation: 'Gélule',
        category: 'Antibiotiques',
        barcode: '6 001234 567890',
        isPrescriptionOnly: true,
        unitsPerBox: 10,
        boxPrice: 2500,
        unitPrice: 250,
        threshold: 300,
        lots: [
            {
                code: 'AX-0412',
                units: 120,
                expiry: '06/2027',
                costPerBox: 1650,
            },
            {
                code: 'AX-0577',
                units: 300,
                expiry: '01/2028',
                costPerBox: 1800,
            },
        ],
    },
    {
        id: 'ceftriaxone-1g',
        name: 'Ceftriaxone 1 g',
        molecule: 'Ceftriaxone',
        dosage: '1 g',
        form: 'Injectable',
        presentation: 'Injectable',
        category: 'Antibiotiques',
        barcode: '6 001234 500031',
        isPrescriptionOnly: true,
        unitsPerBox: 1,
        boxPrice: 4500,
        unitPrice: null,
        threshold: 10,
        itemLabel: 'fl',
        lots: [],
    },
    {
        id: 'ibuprofene-400',
        name: 'Ibuprofène 400 mg',
        molecule: 'Ibuprofène',
        dosage: '400 mg',
        form: 'Comprimé',
        presentation: 'Comprimé',
        category: 'Douleur',
        barcode: '6 001234 500048',
        isPrescriptionOnly: false,
        unitsPerBox: 10,
        boxPrice: 1500,
        unitPrice: 150,
        threshold: 300,
        lots: [
            { code: 'IB-1204', units: 270, expiry: '09/2027', costPerBox: 950 },
            { code: 'IB-1288', units: 400, expiry: '01/2028', costPerBox: 980 },
        ],
    },
    {
        id: 'metronidazole-250',
        name: 'Métronidazole 250 mg',
        molecule: 'Métronidazole',
        dosage: '250 mg',
        form: 'Comprimé',
        presentation: 'Comprimé',
        category: 'Antibiotiques',
        barcode: '6 001234 500062',
        isPrescriptionOnly: true,
        unitsPerBox: 10,
        boxPrice: 1200,
        unitPrice: 120,
        threshold: 200,
        lots: [
            { code: 'MT-2950', units: 40, expiry: '01/2027', costPerBox: 700 },
        ],
    },
    {
        id: 'paracetamol-sirop',
        name: 'Paracétamol sirop 120 mg/5 ml',
        molecule: 'Paracétamol',
        dosage: '120 mg/5 ml',
        form: 'Sirop',
        presentation: 'Flacon 100 ml',
        category: 'Enfants',
        barcode: '6 001234 500079',
        isPrescriptionOnly: false,
        unitsPerBox: 1,
        boxPrice: 3500,
        unitPrice: null,
        threshold: 10,
        itemLabel: 'fl',
        lots: [
            { code: 'PS-0310', units: 22, expiry: '08/2027', costPerBox: 2300 },
        ],
    },
    {
        id: 'quinine-300',
        name: 'Quinine 300 mg',
        molecule: 'Quinine',
        dosage: '300 mg',
        form: 'Comprimé',
        presentation: 'Comprimé',
        category: 'Paludisme',
        barcode: '6 001234 500093',
        isPrescriptionOnly: false,
        unitsPerBox: 20,
        boxPrice: 5000,
        unitPrice: 250,
        threshold: 300,
        lots: [],
    },
    {
        id: 'sro-zinc',
        name: 'SRO + Zinc',
        molecule: 'Sels de réhydratation orale + zinc',
        dosage: '—',
        form: 'Kit',
        presentation: 'Kit',
        category: 'Enfants',
        barcode: '6 001234 500055',
        isPrescriptionOnly: false,
        unitsPerBox: 1,
        boxPrice: 3000,
        unitPrice: null,
        threshold: 20,
        itemLabel: 'kits',
        lots: [
            { code: 'SZ-0980', units: 30, expiry: '11/2027', costPerBox: 1900 },
        ],
    },
    {
        id: 'vitamine-c-500',
        name: 'Vitamine C 500 mg',
        molecule: 'Acide ascorbique',
        dosage: '500 mg',
        form: 'Comprimé',
        presentation: 'Tube de 20',
        category: 'Vitamines',
        barcode: '6 001234 500086',
        isPrescriptionOnly: false,
        unitsPerBox: 20,
        boxPrice: 4000,
        unitPrice: 200,
        threshold: 100,
        lots: [
            {
                code: 'VC-0211',
                units: 120,
                expiry: '12/2026',
                costPerBox: 2600,
            },
            {
                code: 'VC-0305',
                units: 180,
                expiry: '12/2027',
                costPerBox: 2650,
            },
        ],
    },
];

export function findMedicine(id: string): Medicine | undefined {
    return medicines.find((medicine) => medicine.id === id);
}

export type StockStatus = 'ok' | 'low' | 'out';

export function stockUnits(medicine: Medicine): number {
    return medicine.lots.reduce((sum, lot) => sum + lot.units, 0);
}

export function stockStatus(medicine: Medicine): StockStatus {
    const units = stockUnits(medicine);

    if (units === 0) {
        return 'out';
    }

    return units < medicine.threshold ? 'low' : 'ok';
}
