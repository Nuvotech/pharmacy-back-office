import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'ok' | 'warning' | 'danger';

const toneClasses: Record<BadgeTone, string> = {
    ok: 'bg-primary-soft text-on-primary-soft',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
};

type BadgeProps = {
    tone: BadgeTone;
    /** Mono text, for values such as a cover of "0,4 mois". */
    isMono?: boolean;
    children: ReactNode;
};

/** Status label: OK, Stock bas / Expire bientôt, Rupture / Expiré. Always text plus colour. */
export function Badge({ tone, isMono = false, children }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-block rounded-[6px] px-2 py-1 text-xs font-bold whitespace-nowrap',
                isMono && 'font-mono',
                toneClasses[tone],
            )}
        >
            {children}
        </span>
    );
}
