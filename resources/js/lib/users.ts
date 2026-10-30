import type { Role } from '@/types';

/** An account as the "Utilisateurs" screen receives it (App\Http\Resources\ManagedUserResource). */
export type ManagedUser = {
    id: number;
    name: string;
    username: string | null;
    email: string | null;
    role: Role;
    is_active: boolean;
    has_pin: boolean;
};

export const roleLabels: Record<Role, string> = {
    admin: 'Administrateur',
    pharmacist: 'Pharmacien',
    cashier: 'Caissier',
};
