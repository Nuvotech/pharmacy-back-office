import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepperProps = {
    steps: string[];
    /** Zero-based index of the current step; earlier steps are done. */
    currentIndex: number;
};

/** Numbered wizard steps: done (✓), current (ink), next (white, muted). */
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
                            'flex h-11 items-center gap-2.5 rounded-full pr-4 pl-2 text-sm font-semibold',
                            isDone && 'bg-primary-soft text-on-primary-soft',
                            isCurrent && 'bg-ink text-white',
                            !isDone &&
                                !isCurrent &&
                                'bg-surface text-ink-muted',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-7 items-center justify-center rounded-full font-mono text-[13px] font-bold',
                                isDone && 'bg-primary text-white',
                                isCurrent && 'bg-white text-ink',
                                !isDone && !isCurrent && 'bg-background',
                            )}
                            aria-hidden
                        >
                            {isDone ? (
                                <Check className="size-4" strokeWidth={3} />
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
