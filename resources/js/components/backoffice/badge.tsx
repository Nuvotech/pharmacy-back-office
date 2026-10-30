import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'ok' | 'warning' | 'danger';

/** design.md 2.2 / 6.6: green = good, red = bad; amber for the in-between pharmacy states. */
const toneClasses: Record<BadgeTone, string> = {
    ok: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
};

type BadgeProps = {
    tone: BadgeTone;
    /** Tabular figures, for values such as a cover of "0,4 mois". */
    isMono?: boolean;
    children: ReactNode;
};

/** Status badge (design.md 6.6): 22 px, radius 4, 12 / 600. Always text plus colour. */
export function Badge({ tone, isMono = false, children }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex h-[22px] items-center rounded px-2 text-xs font-semibold tracking-wide whitespace-nowrap',
                isMono && 'tabular-nums',
                toneClasses[tone],
            )}
        >
            {children}
        </span>
    );
}
