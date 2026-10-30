import { cn } from '@/lib/utils';

export type FilterChipOption<Value extends string> = {
    value: Value;
    label: string;
    /** Shown after the label: "Écarts seulement · 9". */
    count?: number;
};

type FilterChipsProps<Value extends string> = {
    /** Names the group for screen readers, e.g. "Filtrer les alertes". */
    label: string;
    options: FilterChipOption<Value>[];
    selected: Value;
    onSelect: (value: Value) => void;
    /** 36 tall, for card headers. */
    isCompact?: boolean;
};

/** Single-choice filter buttons. The selected chip is ink with white text. */
export function FilterChips<Value extends string>({
    label,
    options,
    selected,
    onSelect,
    isCompact = false,
}: FilterChipsProps<Value>) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-1">
            {options.map((option) => {
                const isSelected = option.value === selected;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelect(option.value)}
                        className={cn(
                            'text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                            isCompact
                                ? 'h-9 rounded-chip px-3'
                                : 'h-11 rounded-control px-4',
                            isSelected
                                ? 'bg-ink text-white'
                                : 'text-ink-muted hover:bg-background',
                        )}
                    >
                        {option.label}
                        {option.count !== undefined ? (
                            <> · {option.count}</>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
