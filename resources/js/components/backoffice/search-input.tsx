import { Search } from 'lucide-react';
import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    /** Accessible name; not shown (the placeholder describes the search). */
    label: string;
};

/** Search field (design.md 6.16 input): 38 tall, white, slate-300 border, blue focus ring, icon. */
export function SearchInput({ label, className, ...props }: SearchInputProps) {
    const id = useId();

    return (
        <div
            className={cn(
                'flex h-[38px] min-w-0 items-center gap-2 rounded-input border border-border-strong bg-surface px-3 focus-within:border-focus focus-within:ring-[3px] focus-within:ring-primary-soft',
                className,
            )}
        >
            <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                type="search"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-sidebar-item"
                {...props}
            />
        </div>
    );
}
