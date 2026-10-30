import { Search } from 'lucide-react';
import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    /** Accessible name; not shown (the placeholder describes the search). */
    label: string;
};

/** White search field with an icon, 44 tall. */
export function SearchInput({ label, className, ...props }: SearchInputProps) {
    const id = useId();

    return (
        <div
            className={cn(
                'flex h-11 min-w-0 items-center gap-2.5 rounded-control bg-surface px-4 shadow-card focus-within:outline-2 focus-within:outline-primary',
                className,
            )}
        >
            <Search
                className="size-[18px] shrink-0 text-ink-muted"
                aria-hidden
            />
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                type="search"
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted"
                {...props}
            />
        </div>
    );
}
