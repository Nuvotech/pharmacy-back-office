import { useId } from 'react';
import type {
    InputHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

type ControlOptions = {
    /** Mono text, for numbers, codes and dates. */
    isMono?: boolean;
    /** 48 tall (reception form) instead of 44. */
    isLarge?: boolean;
};

/**
 * design.md 6.16: 38 px input, radius 4, 1 px slate-300 border, 14 px slate-900 text, slate-400
 * placeholder; focus blue-500 border with a 3 px blue-100 ring.
 */
const controlClasses = ({ isMono, isLarge }: ControlOptions) =>
    cn(
        'w-full min-w-0 rounded-input border border-border-strong bg-surface px-3 text-sm text-ink outline-none placeholder:text-sidebar-item focus:border-focus focus:ring-[3px] focus:ring-primary-soft disabled:bg-background disabled:text-ink-faint',
        isLarge ? 'h-10' : 'h-[38px]',
        isMono && 'tabular-nums',
    );

type FieldShellProps = {
    label: string;
    /** Muted help line under the control. */
    hint?: ReactNode;
    /** Validation message under the control; also turns its border red. */
    error?: string;
    className?: string;
    children: (id: string, describedBy: string | undefined) => ReactNode;
};

function FieldShell({
    label,
    hint,
    error,
    className,
    children,
}: FieldShellProps) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
        [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
            <label htmlFor={id} className="text-sm font-medium text-ink-body">
                {label}
            </label>
            {children(id, describedBy)}
            {error ? (
                <p id={errorId} className="text-xs text-danger">
                    {error}
                </p>
            ) : null}
            {hint ? (
                <p id={hintId} className="text-xs text-ink-faint">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> &
    ControlOptions & {
        label: string;
        hint?: ReactNode;
        error?: string;
        containerClassName?: string;
    };

/** Label above a bordered input. */
export function TextField({
    label,
    hint,
    error,
    isMono,
    isLarge,
    containerClassName,
    className,
    ...props
}: TextFieldProps) {
    return (
        <FieldShell
            label={label}
            hint={hint}
            error={error}
            className={containerClassName}
        >
            {(id, describedBy) => (
                <input
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        controlClasses({ isMono, isLarge }),
                        error && 'border-danger focus:border-danger',
                        className,
                    )}
                    {...props}
                />
            )}
        </FieldShell>
    );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> &
    ControlOptions & {
        label: string;
        hint?: ReactNode;
        error?: string;
        options: { value: string; label: string }[];
        containerClassName?: string;
    };

/** Label above a native select (keyboard and screen-reader friendly). */
export function SelectField({
    label,
    hint,
    error,
    options,
    isMono,
    isLarge,
    containerClassName,
    className,
    ...props
}: SelectFieldProps) {
    return (
        <FieldShell
            label={label}
            hint={hint}
            error={error}
            className={containerClassName}
        >
            {(id, describedBy) => (
                <select
                    id={id}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        controlClasses({ isMono, isLarge }),
                        'pr-8',
                        error && 'border-danger focus:border-danger',
                        className,
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            )}
        </FieldShell>
    );
}
