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

/**
 * Single-choice filter buttons, styled like design.md's top-nav pills (6.2): 14 px slate-700 text,
 * the selected one on a blue-50 pill in blue-700.
 */
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
                            'rounded-md text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                            isCompact ? 'h-8 px-3' : 'h-[38px] px-3',
                            isSelected
                                ? 'bg-primary-softer font-medium text-on-primary-soft'
                                : 'text-ink-body hover:bg-surface-muted',
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
