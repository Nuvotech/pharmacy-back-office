import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-control px-4 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary:
                    'bg-primary font-bold text-white hover:bg-primary-hover',
                secondary:
                    'border border-border-strong bg-surface font-semibold text-ink hover:bg-background',
                danger: 'bg-danger font-semibold text-white hover:bg-danger/90',
                'danger-soft':
                    'bg-danger-soft font-semibold text-danger hover:bg-danger-soft/70',
            },
            size: {
                default: 'h-11 text-sm',
                large: 'h-12 text-[15px]',
                small: 'h-10 text-sm',
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
