/**
 * Sample returns (UI only), from the approved design. The API will replace this module; each
 * return creates a stock movement linked to the original ticket or delivery.
 */

export type ReturnLine = {
    id: string;
    name: string;
    lotCode: string;
    /** Quantity on the original ticket or delivery. */
    quantity: number;
    /** Short unit shown in the table: "bte", "plaq.", "kit". */
    unitShort: string;
    /** Long unit for the refund summary, singular and plural: ["boîte", "boîtes"]. */
    unitLong: [string, string];
    /** Price of one item: FC for a customer ticket, the invoice currency for a delivery. */
    unitPrice: number;
    /** Selected for return in the sample. */
    returnQuantity: number;
};

export type RecentReturn = {
    reference: string;
    who: string;
    amount: string;
    date: string;
};

export const customerTicket = {
    number: 'C1-0441',
    soldAt: '21/10/2026 à 15:02',
    till: 'Caisse 1',
    total: 12_500,
    paymentMethod: 'Espèces',
    paymentLabel: 'en espèces',
};

export const customerReturnLines: ReturnLine[] = [
    {
        id: 'al-2291',
        name: 'Artéméther / Luméfantrine 20/120',
        lotCode: 'AL-2291',
        quantity: 1,
        unitShort: 'bte',
        unitLong: ['boîte', 'boîtes'],
        unitPrice: 7500,
        returnQuantity: 1,
    },
    {
        id: 'pc-8810',
        name: 'Paracétamol 500 mg',
        lotCode: 'PC-8810',
        quantity: 2,
        unitShort: 'plaq.',
        unitLong: ['plaquette', 'plaquettes'],
        unitPrice: 1000,
        returnQuantity: 0,
    },
    {
        id: 'sz-1140',
        name: 'SRO + Zinc',
        lotCode: 'SZ-1140',
        quantity: 1,
        unitShort: 'kit',
        unitLong: ['kit', 'kits'],
        unitPrice: 3000,
        returnQuantity: 0,
    },
];

export const customerReturnReasons = [
    'Erreur de produit à la vente',
    'Effet indésirable',
    'Ordonnance modifiée',
];

/** Supplier tab: not in the approved designs; same structure, starting from a delivery. */
export const supplierDelivery = {
    reference: 'BL-2026-1160',
    supplier: '[GROSSISTE A]',
    receivedAt: '14/10/2026',
    lineCount: 8,
    currency: 'USD' as const,
};

export const supplierReturnLines: ReturnLine[] = [
    {
        id: 'ax-0577',
        name: 'Amoxicilline 500 mg',
        lotCode: 'AX-0577',
        quantity: 30,
        unitShort: 'btes',
        unitLong: ['boîte', 'boîtes'],
        unitPrice: 0.64,
        returnQuantity: 0,
    },
    {
        id: 'ct-0712',
        name: 'Cotrimoxazole 480 mg',
        lotCode: 'CT-0712',
        quantity: 12,
        unitShort: 'btes',
        unitLong: ['boîte', 'boîtes'],
        unitPrice: 0.45,
        returnQuantity: 0,
    },
    {
        id: 'fr-0105',
        name: 'Fer + Acide folique',
        lotCode: 'FR-0105',
        quantity: 20,
        unitShort: 'btes',
        unitLong: ['boîte', 'boîtes'],
        unitPrice: 0.8,
        returnQuantity: 0,
    },
];

export const supplierReturnReasons = [
    'Lot endommagé',
    'Erreur de livraison',
    'Date trop courte',
    'Rappel de lot',
];

export const recentReturns: RecentReturn[] = [
    {
        reference: 'Ticket C1-0398 · 1 article',
        who: 'Client · remis en stock',
        amount: '2 500 FC',
        date: '18/10',
    },
    {
        reference: 'BL-2026-1160 · 2 lignes',
        who: 'Fournisseur · lot endommagé',
        amount: '24,00 USD',
        date: '15/10',
    },
    {
        reference: 'Ticket C1-0310 · 1 article',
        who: 'Client · rebut',
        amount: '1 500 FC',
        date: '09/10',
    },
];
