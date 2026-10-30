/**
 * Sample adjustments and expiring lots (UI only), from the approved design. The API will replace
 * this module; every adjustment is stored as a movement with type, reason, user and time.
 */

export type AdjustmentType =
    | 'Casse'
    | 'Perte / vol'
    | 'Péremption'
    | 'Correction';

export const adjustmentTypes: AdjustmentType[] = [
    'Casse',
    'Perte / vol',
    'Péremption',
    'Correction',
];

export type ExpiringLot = {
    id: string;
    medicine: string;
    /** "Valeur d'achat 14 400 FC" or "Vendu en premier à la caisse". */
    detail: string;
    lotCode: string;
    /** Badge text: "Expiré 15/10" or "30/11/2026". */
    expiryLabel: string;
    isExpired: boolean;
    quantityLabel: string;
};

export type AdjustmentLogEntry = {
    id: string;
    date: string;
    medicineAndLot: string;
    reason: string;
    /** Journal entries also include "Perte" from older records. */
    type: string;
    /** Signed units: positive adds stock. */
    quantity: number;
    user: string;
};

export type AdjustableLot = {
    code: string;
    units: number;
    expiry: string;
};

export const alertDays = 90;

export const expiringLots: ExpiringLot[] = [
    {
        id: 'gt-0098',
        medicine: 'Gentamicine 80 mg inj.',
        detail: "Valeur d'achat 14 400 FC",
        lotCode: 'GT-0098',
        expiryLabel: 'Expiré 15/10',
        isExpired: true,
        quantityLabel: '12 amp.',
    },
    {
        id: 'vb-0310',
        medicine: 'Vitamine B complexe',
        detail: "Valeur d'achat 9 600 FC",
        lotCode: 'VB-0310',
        expiryLabel: 'Expiré 02/10',
        isExpired: true,
        quantityLabel: '8 btes',
    },
    {
        id: 'pc-8810',
        medicine: 'Paracétamol 500 mg',
        detail: 'Vendu en premier à la caisse',
        lotCode: 'PC-8810',
        expiryLabel: '30/11/2026',
        isExpired: false,
        quantityLabel: '34 plaq.',
    },
    {
        id: 'vc-0211',
        medicine: 'Vitamine C 500 mg',
        detail: 'Vendu en premier à la caisse',
        lotCode: 'VC-0211',
        expiryLabel: '31/12/2026',
        isExpired: false,
        quantityLabel: '6 tubes',
    },
    {
        id: 'mt-2988',
        medicine: 'Métronidazole 250 mg',
        detail: 'Vendu en premier à la caisse',
        lotCode: 'MT-2988',
        expiryLabel: '31/01/2027',
        isExpired: false,
        quantityLabel: '4 plaq.',
    },
];

export const adjustmentLog: AdjustmentLogEntry[] = [
    {
        id: 'adj-4',
        date: '22/10 16:40',
        medicineAndLot: 'Sirop toux enfant · TS-0042',
        reason: 'Flacon cassé à la réception',
        type: 'Casse',
        quantity: -1,
        user: 'J. Mbuyi',
    },
    {
        id: 'adj-3',
        date: '20/10 09:15',
        medicineAndLot: 'Amoxicilline 500 mg · AX-0412',
        reason: 'Carton non saisi lors de la réception',
        type: 'Correction',
        quantity: 20,
        user: 'J. Mbuyi',
    },
    {
        id: 'adj-2',
        date: '18/10 18:02',
        medicineAndLot: 'Insuline rapide · IN-0007',
        reason: 'Lot expiré retiré',
        type: 'Péremption',
        quantity: -3,
        user: 'J. Mbuyi',
    },
    {
        id: 'adj-1',
        date: '11/10 12:30',
        medicineAndLot: 'Paracétamol 500 mg · PC-8810',
        reason: 'Écart de caisse constaté',
        type: 'Perte',
        quantity: -2,
        user: 'Grâce M.',
    },
];

/** The form's sample medicine and its lots. */
export const adjustmentDraft = {
    medicine: 'Ibuprofène 400 mg',
    lots: [
        { code: 'IB-2210', units: 412, expiry: '09/2027' },
        { code: 'IB-2290', units: 260, expiry: '01/2028' },
    ] satisfies AdjustableLot[],
    type: 'Casse' as AdjustmentType,
    quantity: '−10',
    reason: 'Une plaquette écrasée lors du rangement',
};
