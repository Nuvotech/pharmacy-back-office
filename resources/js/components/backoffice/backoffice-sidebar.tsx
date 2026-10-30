import { Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import { index as adjustments } from '@/routes/adjustments';
import { index as inventory } from '@/routes/inventory';
import { index as medicines } from '@/routes/medicines';
import { edit as settings } from '@/routes/profile';
import { create as newReception } from '@/routes/receptions';
import { consumption, sales } from '@/routes/reports';
import { index as returns } from '@/routes/returns';
import { create as stockImport } from '@/routes/stock-import';
import { index as users } from '@/routes/users';
import type { Auth } from '@/types';

type SidebarItem = {
    label: string;
    /** Missing for screens that don't exist yet. */
    href?: NonNullable<InertiaLinkProps['href']>;
    /** Path prefix that also marks the item active, e.g. "/medicines" for its sub-pages. */
    activePrefix?: string;
    /** Shown to admins only. */
    isAdminOnly?: boolean;
};

type SidebarGroup = {
    label?: string;
    items: SidebarItem[];
};

const groups: SidebarGroup[] = [
    { items: [{ label: 'Tableau de bord', href: dashboard() }] },
    {
        label: 'Stock',
        items: [
            {
                label: 'Médicaments',
                href: medicines(),
                activePrefix: '/medicines',
            },
            {
                label: 'Réceptions',
                href: newReception(),
                activePrefix: '/receptions',
            },
            { label: 'Import du stock', href: stockImport() },
            { label: 'Inventaire', href: inventory() },
            { label: 'Retours', href: returns() },
            { label: 'Ajustements', href: adjustments() },
        ],
    },
    {
        label: 'Rapports',
        items: [
            { label: 'Ventes', href: sales() },
            { label: 'Consommation', href: consumption() },
        ],
    },
    {
        label: 'Système',
        items: [
            {
                label: 'Paramètres',
                href: settings(),
                activePrefix: '/settings',
            },
            {
                label: 'Utilisateurs',
                href: users(),
                activePrefix: '/users',
                isAdminOnly: true,
            },
            { label: 'Synchronisation' },
        ],
    },
];

const itemClasses =
    'flex min-h-10 w-full items-center rounded-input px-3 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white';

type BackofficeSidebarProps = {
    pharmacyName: string;
};

/** Dark back-office menu. Sits on the left, and stacks above the content on narrow screens. */
export function BackofficeSidebar({ pharmacyName }: BackofficeSidebarProps) {
    const { currentUrl, isCurrentUrl } = useCurrentUrl();
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.role === 'admin';

    const isActive = (item: SidebarItem) =>
        item.href !== undefined &&
        (isCurrentUrl(item.href) ||
            (item.activePrefix !== undefined &&
                currentUrl.startsWith(item.activePrefix)));

    return (
        <nav
            aria-label="Menu principal"
            className="flex flex-[1_1_240px] flex-col gap-0.5 bg-sidebar px-3.5 py-5"
        >
            <div className="flex items-center gap-2.5 px-2 pb-5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <Plus
                        className="size-4 text-white"
                        strokeWidth={3}
                        aria-hidden
                    />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-bold text-white">
                        {pharmacyName}
                    </div>
                    <div className="text-xs text-sidebar-label">
                        Back-office
                    </div>
                </div>
            </div>

            {groups.map((group, groupIndex) => (
                <div
                    key={group.label ?? groupIndex}
                    className="mb-3.5 flex flex-col gap-0.5"
                >
                    {group.label ? (
                        <div className="px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-sidebar-label uppercase">
                            {group.label}
                        </div>
                    ) : null}
                    <ul className="flex flex-col gap-0.5">
                        {group.items
                            .filter((item) => isAdmin || !item.isAdminOnly)
                            .map((item) => {
                                const isItemActive = isActive(item);

                                return (
                                    <li key={item.label}>
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                prefetch
                                                aria-current={
                                                    isItemActive
                                                        ? 'page'
                                                        : undefined
                                                }
                                                className={cn(
                                                    itemClasses,
                                                    isItemActive
                                                        ? 'bg-sidebar-active text-white'
                                                        : 'text-sidebar-item hover:bg-sidebar-active/60 hover:text-white',
                                                )}
                                            >
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <span
                                                aria-disabled="true"
                                                title="Bientôt disponible"
                                                className={cn(
                                                    itemClasses,
                                                    'text-sidebar-item/60',
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        {group.label === 'Système' ? (
                            <li>
                                <Link
                                    href={logout()}
                                    as="button"
                                    className={cn(
                                        itemClasses,
                                        'text-sidebar-item hover:bg-sidebar-active/60 hover:text-white',
                                    )}
                                >
                                    Se déconnecter
                                </Link>
                            </li>
                        ) : null}
                    </ul>
                </div>
            ))}
        </nav>
    );
}
