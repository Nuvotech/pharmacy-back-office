import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type PaginationProps = {
    from: number;
    to: number;
    total: number;
    previousHref?: NonNullable<InertiaLinkProps['href']>;
    nextHref?: NonNullable<InertiaLinkProps['href']>;
};

const pageButtonClasses =
    'inline-flex h-9 items-center rounded bg-background px-3 text-sm';

/**
 * Pagination footer (design.md 8.4): 56 px with a top divider, "1–10 sur 412" in slate-600 on the
 * left, Précédent / Suivant on the right. A missing href disables the button.
 */
export function Pagination({
    from,
    to,
    total,
    previousHref,
    nextHref,
}: PaginationProps) {
    return (
        <nav
            aria-label="Pagination"
            className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-2.5"
        >
            <p className="text-sm text-ink-muted">
                <span className="font-mono">
                    {from}–{to}
                </span>{' '}
                sur <span className="font-mono">{total}</span>
            </p>
            <div className="flex gap-2">
                {[
                    { label: 'Précédent', href: previousHref },
                    { label: 'Suivant', href: nextHref },
                ].map(({ label, href }) =>
                    href ? (
                        <Link
                            key={label}
                            href={href}
                            className={cn(
                                pageButtonClasses,
                                'font-medium text-ink-body hover:bg-border',
                            )}
                        >
                            {label}
                        </Link>
                    ) : (
                        <span
                            key={label}
                            aria-disabled="true"
                            className={cn(
                                pageButtonClasses,
                                'text-ink-faint opacity-60',
                            )}
                        >
                            {label}
                        </span>
                    ),
                )}
            </div>
        </nav>
    );
}
