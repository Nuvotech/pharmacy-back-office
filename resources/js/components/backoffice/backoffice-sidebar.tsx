import { Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    BarChart3,
    ChevronsLeft,
    ClipboardList,
    FileSpreadsheet,
    LayoutDashboard,
    LineChart,
    PackagePlus,
    Pill,
    Plus,
    SlidersHorizontal,
    Undo2,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as adjustments } from '@/routes/adjustments';
import { index as inventory } from '@/routes/inventory';
import { index as medicines } from '@/routes/medicines';
import { create as newReception } from '@/routes/receptions';
import { consumption, sales } from '@/routes/reports';
import { index as returns } from '@/routes/returns';
import { create as stockImport } from '@/routes/stock-import';
import { index as users } from '@/routes/users';
import type { Auth } from '@/types';

type SidebarItem = {
    label: string;
    icon: LucideIcon;
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
    {
        items: [
            {
                label: 'Tableau de bord',
                icon: LayoutDashboard,
                href: dashboard(),
            },
        ],
    },
    {
        label: 'Stock',
        items: [
            {
                label: 'Médicaments',
                icon: Pill,
                href: medicines(),
                activePrefix: '/medicines',
            },
            {
                label: 'Réceptions',
                icon: PackagePlus,
                href: newReception(),
                activePrefix: '/receptions',
            },
            {
                label: 'Import du stock',
                icon: FileSpreadsheet,
                href: stockImport(),
            },
            { label: 'Inventaire', icon: ClipboardList, href: inventory() },
            { label: 'Retours', icon: Undo2, href: returns() },
            {
                label: 'Ajustements',
                icon: SlidersHorizontal,
                href: adjustments(),
            },
        ],
    },
    {
        label: 'Rapports',
        items: [
            { label: 'Ventes', icon: BarChart3, href: sales() },
            { label: 'Consommation', icon: LineChart, href: consumption() },
        ],
    },
    {
        // Profile and sign-out are in the top bar's user menu.
        label: 'Système',
        items: [
            {
                label: 'Utilisateurs',
                icon: Users,
                href: users(),
                activePrefix: '/users',
                isAdminOnly: true,
            },
        ],
    },
];

/** design.md 6.1: 36 px rows, 18 px outline icons, slate-400 → white on hover. */
const itemClasses =
    'group flex h-9 w-full items-center gap-2.5 px-4 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white [&_svg]:size-[18px] [&_svg]:shrink-0';

type BackofficeSidebarProps = {
    pharmacyName: string;
    /** Closes the drawer on small screens (« button, or after following a link). */
    onClose?: () => void;
};

/** Dark slate back-office menu (design.md 6.1): logo bar, labelled groups, icon + label items. */
export function BackofficeSidebar({
    pharmacyName,
    onClose,
}: BackofficeSidebarProps) {
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
            className="flex h-full w-64 flex-col overflow-y-auto bg-sidebar"
        >
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 bg-sidebar-brand px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary">
                        <Plus
                            className="size-4 text-white"
                            strokeWidth={3}
                            aria-hidden
                        />
                    </div>
                    <span className="truncate text-sm font-medium text-white">
                        {pharmacyName}
                    </span>
                </div>
                {onClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer le menu"
                        className="flex size-8 shrink-0 items-center justify-center rounded text-sidebar-item hover:text-white"
                    >
                        <ChevronsLeft className="size-5" aria-hidden />
                    </button>
                ) : null}
            </div>

            <div className="flex flex-col pb-6">
                {/* A group whose items are all admin-only disappears for the other roles. */}
                {groups
                    .filter((group) =>
                        group.items.some(
                            (item) => isAdmin || !item.isAdminOnly,
                        ),
                    )
                    .map((group, groupIndex) => (
                        <div
                            key={group.label ?? groupIndex}
                            className="flex flex-col"
                        >
                            {group.label ? (
                                <div className="px-4 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-sidebar-label uppercase">
                                    {group.label}
                                </div>
                            ) : (
                                <div className="h-3" />
                            )}
                            <ul className="flex flex-col">
                                {group.items
                                    .filter(
                                        (item) => isAdmin || !item.isAdminOnly,
                                    )
                                    .map((item) => {
                                        const isItemActive = isActive(item);
                                        const Icon = item.icon;

                                        return (
                                            <li key={item.label}>
                                                {item.href ? (
                                                    <Link
                                                        href={item.href}
                                                        prefetch
                                                        onClick={onClose}
                                                        aria-current={
                                                            isItemActive
                                                                ? 'page'
                                                                : undefined
                                                        }
                                                        className={cn(
                                                            itemClasses,
                                                            isItemActive
                                                                ? 'font-medium text-white'
                                                                : 'text-sidebar-item hover:bg-sidebar-active/40 hover:text-white',
                                                        )}
                                                    >
                                                        <Icon
                                                            strokeWidth={1.5}
                                                            aria-hidden
                                                            className={cn(
                                                                isItemActive &&
                                                                    'text-sidebar-icon-active',
                                                            )}
                                                        />
                                                        {item.label}
                                                    </Link>
                                                ) : (
                                                    <span
                                                        aria-disabled="true"
                                                        title="Bientôt disponible"
                                                        className={cn(
                                                            itemClasses,
                                                            'text-sidebar-label',
                                                        )}
                                                    >
                                                        <Icon
                                                            strokeWidth={1.5}
                                                            aria-hidden
                                                        />
                                                        {item.label}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>
                    ))}
            </div>
        </nav>
    );
}
