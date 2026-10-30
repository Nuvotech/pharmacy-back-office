import { toast } from 'sonner';

/** Feedback for buttons that aren't wired to the server yet (the screens are UI only). */
export function showNotAvailableYet(action: string): void {
    toast(`${action} : pas encore disponible`, {
        description: "Cet écran est une maquette : rien n'est enregistré.",
    });
}
