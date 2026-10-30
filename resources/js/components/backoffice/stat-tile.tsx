import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatTileTone = 'plain' | 'warning' | 'danger' | 'primary';

const toneClasses: Record<StatTileTone, string> = {
    plain: 'bg-surface text-ink shadow-card',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    primary: 'bg-primary-soft text-on-primary-soft',
};

type StatTileProps = {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    tone?: StatTileTone;
    /** Makes the whole tile a link to the related list. */
    href?: NonNullable<InertiaLinkProps['href']>;
    /** Shorter tile without a sub line (import summary): no minimum height, value 28. */
    isCompact?: boolean;
    /** Muted label on a plain tile ("Lots avec écart"). */
    isLabelMuted?: boolean;
    /** Layout overrides, e.g. a flex basis. */
    className?: string;
};

/** KPI tile: label, large mono value, small sub line. */
export function StatTile({
    label,
    value,
    sub,
    tone = 'plain',
    href,
    isCompact = false,
    isLabelMuted = false,
    className: extraClassName,
}: StatTileProps) {
    const className = cn(
        'flex flex-col gap-1 rounded-card',
        isCompact
            ? 'justify-start px-5 py-[18px]'
            : 'min-h-[108px] justify-between px-[18px] py-4',
        toneClasses[tone],
        href &&
            'transition-[filter] hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        extraClassName,
    );
    const content = (
        <>
            <span
                className={cn(
                    'text-[13px] font-semibold',
                    isLabelMuted && 'text-ink-muted',
                )}
            >
                {label}
            </span>
            <span
                className={cn(
                    'font-mono leading-tight font-semibold',
                    isCompact ? 'text-[28px]' : 'text-[26px]',
                )}
            >
                {value}
            </span>
            {sub ? <span className="text-xs opacity-85">{sub}</span> : null}
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
