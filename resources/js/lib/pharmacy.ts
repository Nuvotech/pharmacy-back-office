import { usePage } from '@inertiajs/react';

/**
 * The pharmacy's name: APP_NAME from the server's .env (shared with every page as `name` by
 * HandleInertiaRequests). Shown in the sidebar, the top bar on small screens, and on the login.
 */
export function usePharmacyName(): string {
    return usePage().props.name;
}
