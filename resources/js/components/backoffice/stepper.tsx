import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepperProps = {
    steps: string[];
    /** Zero-based index of the current step; earlier steps are done. */
    currentIndex: number;
};

/**
 * Numbered wizard steps on white pills: done (green tick, design.md "done" = green), current
 * (blue-600), next (slate).
 */
export function Stepper({ steps, currentIndex }: StepperProps) {
    return (
        <ol className="flex flex-wrap gap-2" aria-label="Étapes">
            {steps.map((step, index) => {
                const isDone = index < currentIndex;
                const isCurrent = index === currentIndex;

                return (
                    <li
                        key={step}
                        aria-current={isCurrent ? 'step' : undefined}
                        className={cn(
                            'flex h-[38px] items-center gap-2 rounded bg-surface pr-4 pl-2 text-sm shadow-card',
                            isCurrent
                                ? 'font-medium text-primary'
                                : isDone
                                  ? 'text-ink-body'
                                  : 'text-ink-faint',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                                isDone && 'bg-success-soft text-success',
                                isCurrent && 'bg-primary text-white',
                                !isDone && !isCurrent && 'bg-background',
                            )}
                            aria-hidden
                        >
                            {isDone ? (
                                <Check className="size-3.5" strokeWidth={3} />
                            ) : (
                                index + 1
                            )}
                        </span>
                        {step}
                        {isDone ? (
                            <span className="sr-only">(terminé)</span>
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}
