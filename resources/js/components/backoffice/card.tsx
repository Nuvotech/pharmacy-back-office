import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardProps = {
    /** Section title (h2). */
    title?: ReactNode;
    /** Shown on the right of the title: chips, links, notes. */
    actions?: ReactNode;
    /** Pad the body. Turn off for full-width tables. */
    isPadded?: boolean;
    /** Form cards: padding 22 × 24 and 16 between items, instead of 18 × 20 and 12. */
    isRoomy?: boolean;
    className?: string;
    children: ReactNode;
};

/** White section card: radius 16, soft shadow, no border. */
export function Card({
    title,
    actions,
    isPadded = true,
    isRoomy = false,
    className,
    children,
}: CardProps) {
    const hasHeader = Boolean(title || actions);
    const sidePadding = isRoomy ? 'px-6' : 'px-5';

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
                        'flex flex-wrap items-center gap-3',
                        sidePadding,
                        isRoomy ? 'pt-[22px]' : 'pt-[18px]',
                        isPadded ? 'pb-0' : 'pb-3',
                    )}
                >
                    {title ? (
                        <h2 className="flex-auto text-[17px] font-bold">
                            {title}
                        </h2>
                    ) : null}
                    {actions}
                </div>
            ) : null}
            <div
                className={cn(
                    isPadded && ['flex flex-col', sidePadding],
                    isPadded &&
                        (isRoomy ? 'gap-4 pb-[22px]' : 'gap-3 pb-[18px]'),
                    isPadded &&
                        (hasHeader
                            ? isRoomy
                                ? 'pt-4'
                                : 'pt-3'
                            : isRoomy
                              ? 'pt-[22px]'
                              : 'pt-[18px]'),
                )}
            >
                {children}
            </div>
        </section>
    );
}
