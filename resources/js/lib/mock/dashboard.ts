/**
 * Sample dashboard content (UI only), copied from the approved design. The API will replace
 * this module, and the tile values will then be calculated from stock, lots and sales.
 */

export type AlertKind = 'out' | 'low' | 'expiring' | 'expired';

export type StockAlert = {
    id: string;
    kind: AlertKind;
    name: string;
    detail: string;
    stock: string;
    threshold: string;
};

export type DeliverySummary = {
    reference: string;
    supplier: string;
    lineCount: number;
    date: string;
};

export type Device = {
    name: string;
    isOnline: boolean;
    status: string;
};

export const dashboardTiles = {
    salesToday: { value: '1 284 500', sub: 'FC · 58 tickets' },
    stockValue: { value: '41,6 M', sub: "FC · prix d'achat" },
    outOfStock: { value: '3', sub: 'médicaments à 0' },
    lowStock: { value: '11', sub: 'sous le seuil' },
    expiringSoon: { value: '7', sub: 'lots' },
    expired: { value: '2', sub: 'lots à retirer' },
};

export const alertCount = 21;

export const stockAlerts: StockAlert[] = [
    {
        id: 'ceftriaxone',
        kind: 'out',
        name: 'Ceftriaxone 1 g inj.',
        detail: 'Vendu 4×/semaine',
        stock: '0',
        threshold: '10',
    },
    {
        id: 'quinine',
        kind: 'out',
        name: 'Quinine 300 mg',
        detail: 'Aucun lot',
        stock: '0',
        threshold: '15',
    },
    {
        id: 'artemether',
        kind: 'low',
        name: 'Artéméther / Luméfantrine 20/120',
        detail: '~2 jours de vente',
        stock: '6',
        threshold: '30',
    },
    {
        id: 'metronidazole',
        kind: 'low',
        name: 'Métronidazole 250 mg',
        detail: '1 lot',
        stock: '4',
        threshold: '20',
    },
    {
        id: 'paracetamol-pc-8810',
        kind: 'expiring',
        name: 'Paracétamol 500 mg · lot PC-8810',
        detail: 'Expire le 30/11/2026',
        stock: '34',
        threshold: '—',
    },
    {
        id: 'gentamicine-gt-0098',
        kind: 'expired',
        name: 'Gentamicine 80 mg inj. · lot GT-0098',
        detail: 'Expiré le 15/10/2026',
        stock: '12',
        threshold: '—',
    },
];

export const recentDeliveries: DeliverySummary[] = [
    {
        reference: 'BL-2026-1187',
        supplier: '[GROSSISTE A]',
        lineCount: 5,
        date: "Aujourd'hui",
    },
    {
        reference: 'BL-2026-1179',
        supplier: '[GROSSISTE B]',
        lineCount: 12,
        date: '20/10',
    },
    {
        reference: 'BL-2026-1160',
        supplier: '[GROSSISTE A]',
        lineCount: 8,
        date: '14/10',
    },
];

export const devices: Device[] = [
    {
        name: 'Tablette comptoir',
        isOnline: false,
        status: 'Hors ligne depuis 09:15 · 12 ventes en attente',
    },
    { name: 'Tablette arrière-boutique', isOnline: true, status: 'En ligne' },
    {
        name: 'Ordinateur portable',
        isOnline: true,
        status: 'En ligne · cette session',
    },
];
