import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardProps = {
    /** Section title (h2). */
    title?: ReactNode;
    /** Shown on the right of the title: chips, links, notes. */
    actions?: ReactNode;
    /** Pad the body. Turn off for full-width tables. */
    isPadded?: boolean;
    /** Form cards: 16 px between items instead of 12. */
    isRoomy?: boolean;
    className?: string;
    children: ReactNode;
};

/**
 * White card (design.md 6.4): radius 4, soft shadow, no border. With a title, a 56 px header with a
 * slate-200 divider (none above a full-width table, whose header row follows); body padding 24.
 */
export function Card({
    title,
    actions,
    isPadded = true,
    isRoomy = false,
    className,
    children,
}: CardProps) {
    const hasHeader = Boolean(title || actions);

    return (
        <section
            className={cn(
                'min-w-0 rounded-card bg-surface shadow-card',
                className,
            )}
        >
            {hasHeader ? (
                <div
                    className={cn(
                        'flex min-h-14 flex-wrap items-center gap-3 px-6 py-2',
                        isPadded && 'border-b border-border',
                    )}
                >
                    {title ? (
                        <h2 className="flex-auto text-base font-medium text-ink">
                            {title}
                        </h2>
                    ) : null}
                    {actions}
                </div>
            ) : null}
            <div
                className={cn(
                    isPadded && 'flex flex-col p-6',
                    isPadded && (isRoomy ? 'gap-4' : 'gap-3'),
                )}
            >
                {children}
            </div>
        </section>
    );
}
