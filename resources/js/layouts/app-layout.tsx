import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { BackofficeSidebar } from '@/components/backoffice/backoffice-sidebar';
import { useInitials } from '@/hooks/use-initials';
import { pharmacyName } from '@/lib/pharmacy';
import { roleLabels } from '@/lib/users';
import type { Auth } from '@/types';

/**
 * Back-office shell (design.md 4.2): a fixed 256 px slate sidebar, then a white 70 px top bar with the
 * signed-in user, then the page (its own header band and content) on the slate-100 canvas. Under 1024 px
 * the sidebar becomes a drawer opened from the top bar.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const getInitials = useInitials();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-ink-body">
            <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
                <BackofficeSidebar pharmacyName={pharmacyName} />
            </div>

            {isMenuOpen ? (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button
                        type="button"
                        aria-label="Fermer le menu"
                        className="absolute inset-0 bg-ink/40"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="relative h-full w-64">
                        <BackofficeSidebar
                            pharmacyName={pharmacyName}
                            onClose={() => setIsMenuOpen(false)}
                        />
                    </div>
                </div>
            ) : null}

            <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
                <header className="flex h-[70px] shrink-0 items-center gap-4 border-b border-border bg-surface px-4 sm:px-8 xl:px-12">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Ouvrir le menu"
                        aria-expanded={isMenuOpen}
                        className="flex size-9 items-center justify-center rounded text-ink-faint hover:bg-background lg:hidden"
                    >
                        <Menu className="size-5" aria-hidden />
                    </button>
                    <span className="truncate text-sm font-medium text-ink lg:hidden">
                        {pharmacyName}
                    </span>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <div className="text-sm font-medium text-ink">
                                {auth.user.name}
                            </div>
                            <div className="text-xs text-ink-faint">
                                {roleLabels[auth.user.role]}
                            </div>
                        </div>
                        <div
                            className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-on-primary-soft"
                            aria-hidden
                        >
                            {getInitials(auth.user.name)}
                        </div>
                    </div>
                </header>
                <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            </div>
        </div>
    );
}
