import { Link, router } from '@inertiajs/react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { roleLabels } from '@/lib/users';
import { logout } from '@/routes';
import { edit as profile } from '@/routes/profile';
import type { User } from '@/types';

/**
 * Top-bar user menu (design.md 6.2: the avatar on the right opens a dropdown): the user's name and role,
 * then "Profil" (profile, password and security settings) and "Se déconnecter".
 */
export function UserMenu({ user }: { user: User }) {
    const getInitials = useInitials();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="flex items-center gap-3 rounded px-1 py-1 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                aria-label={`Menu de ${user.name}`}
            >
                <span className="hidden text-right sm:block">
                    <span className="block text-sm font-medium text-ink">
                        {user.name}
                    </span>
                    <span className="block text-xs text-ink-faint">
                        {roleLabels[user.role]}
                    </span>
                </span>
                <span
                    className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-on-primary-soft"
                    aria-hidden
                >
                    {getInitials(user.name)}
                </span>
                <ChevronDown className="size-4 text-ink-faint" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded">
                <DropdownMenuLabel className="font-normal">
                    <div className="truncate text-sm font-medium text-ink">
                        {user.name}
                    </div>
                    {user.email ? (
                        <div className="truncate text-xs text-ink-faint">
                            {user.email}
                        </div>
                    ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={profile()}
                        prefetch
                        className="flex w-full cursor-pointer items-center gap-2"
                    >
                        <UserRound className="size-4" strokeWidth={1.5} />
                        Profil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={logout()}
                        as="button"
                        onClick={() => router.flushAll()}
                        className="flex w-full cursor-pointer items-center gap-2"
                    >
                        <LogOut className="size-4" strokeWidth={1.5} />
                        Se déconnecter
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
