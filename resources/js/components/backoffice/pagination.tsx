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
    'inline-flex h-10 items-center rounded-input border border-border bg-surface px-3.5 text-[13px]';

/** "1–10 sur 412" with Précédent / Suivant. A missing href disables the button. */
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
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
        >
            <p className="text-[13px] text-ink-muted">
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
                                'font-semibold text-ink hover:bg-background',
                            )}
                        >
                            {label}
                        </Link>
                    ) : (
                        <span
                            key={label}
                            aria-disabled="true"
                            className={cn(pageButtonClasses, 'text-ink-muted')}
                        >
                            {label}
                        </span>
                    ),
                )}
            </div>
        </nav>
    );
}
