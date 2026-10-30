import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * design.md 6.7: 38 px, radius 4, 14 px / 500. Primary blue-600 (hover blue-700); secondary slate-100
 * with slate-700 text (hover slate-200). Focus: 2 px blue-500 ring at 2 px offset.
 */
export const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-control px-4 font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-white hover:bg-primary-hover',
                secondary: 'bg-background text-ink-body hover:bg-border',
                danger: 'bg-danger text-white hover:bg-danger/90',
                'danger-soft':
                    'bg-danger-soft text-danger hover:bg-danger-soft/70',
            },
            size: {
                default: 'h-[38px] text-sm',
                large: 'h-10 text-sm',
                small: 'h-9 text-sm',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>;

export function Button({
    variant,
    size,
    className,
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}

type ButtonLinkProps = InertiaLinkProps & VariantProps<typeof buttonVariants>;

/** A link styled as a button, for actions that navigate to another screen. */
export function ButtonLink({
    variant,
    size,
    className,
    ...props
}: ButtonLinkProps) {
    return (
        <Link
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}
