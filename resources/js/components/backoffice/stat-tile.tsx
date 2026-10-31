import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatTileTone = 'plain' | 'warning' | 'danger' | 'primary';

/** design.md: cards stay white; the tone only colours the value ("don't colour whole cards"). */
const valueToneClasses: Record<StatTileTone, string> = {
    plain: 'text-ink',
    warning: 'text-warning',
    danger: 'text-danger',
    primary: 'text-primary',
};

type StatTileProps = {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    tone?: StatTileTone;
    /** Makes the whole tile a link to the related list. */
    href?: NonNullable<InertiaLinkProps['href']>;
    /** Compact KPI (value 20 px, no minimum height) instead of the large one (24 px). */
    isCompact?: boolean;
    /** Six in a row (dashboard): 20 px padding, value 18 px until the widest screens. */
    isDense?: boolean;
    /** Kept for existing call sites: labels are always the muted KPI label now. */
    isLabelMuted?: boolean;
    /** Layout overrides, e.g. a flex basis. */
    className?: string;
};

/**
 * KPI card (design.md 6.5, variant A): uppercase 12 px label, large semibold value, 14 px meta line.
 */
export function StatTile({
    label,
    value,
    sub,
    tone = 'plain',
    href,
    isCompact = false,
    isDense = false,
    className: extraClassName,
}: StatTileProps) {
    const className = cn(
        'flex h-full min-w-0 flex-col rounded-card bg-surface shadow-card',
        isDense ? 'gap-2 p-5' : 'gap-3 p-6',
        href &&
            'transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        extraClassName,
    );
    const content = (
        <>
            <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
                {label}
            </span>
            <span
                className={cn(
                    'font-semibold whitespace-nowrap tabular-nums',
                    isDense
                        ? 'text-xl leading-7 xl:text-lg 2xl:text-xl'
                        : isCompact
                          ? 'text-xl leading-7'
                          : 'text-2xl leading-8',
                    valueToneClasses[tone],
                )}
            >
                {value}
            </span>
            {/* Pinned to the bottom, so tiles in a row line up even when a label wraps. */}
            {sub ? (
                <span className="mt-auto text-sm text-ink-muted">{sub}</span>
            ) : null}
        </>
    );

    return href ? (
        <Link href={href} className={className}>
            {content}
        </Link>
    ) : (
        <div className={className}>{content}</div>
    );
}
