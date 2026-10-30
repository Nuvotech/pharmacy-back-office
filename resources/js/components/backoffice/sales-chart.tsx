import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { formatFc } from '@/lib/format';
import type { DailySales } from '@/lib/mock/sales-report';

type SalesChartProps = {
    days: DailySales[];
    /** Read by screen readers instead of the bars. */
    summary: string;
};

const axisTick = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fill: 'var(--color-ink-muted)',
};

/** 0 → "0", 400 000 → "0,4 M", 1 200 000 → "1,2 M". */
function formatMillions(value: number): string {
    return value === 0
        ? '0'
        : `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`;
}

function SalesTooltip({ active, payload }: TooltipContentProps) {
    const day = payload?.[0]?.payload as DailySales | undefined;

    if (!active || !day) {
        return null;
    }

    return (
        <div className="rounded-input border border-border bg-surface px-3 py-2 text-[13px] shadow-card">
            <div className="mb-1 font-semibold">
                <span className="font-mono">{day.day}</span> octobre
            </div>
            <TooltipLine label="Espèces" value={day.cash} swatch="bg-primary" />
            <TooltipLine
                label="Mobile money"
                value={day.mobileMoney}
                swatch="bg-mobile-money"
            />
            <div className="mt-1 flex justify-between gap-4 border-t border-divider pt-1 font-semibold">
                <span>Total</span>
                <span className="font-mono">
                    {formatFc(day.cash + day.mobileMoney)}
                </span>
            </div>
        </div>
    );
}

function TooltipLine({
    label,
    value,
    swatch,
}: {
    label: string;
    value: number;
    swatch: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-muted">
                <span
                    className={`size-2.5 rounded-[3px] ${swatch}`}
                    aria-hidden
                />
                {label}
            </span>
            <span className="font-mono">{formatFc(value)}</span>
        </div>
    );
}

/** Stacked daily sales: cash at the bottom, mobile money on top, with exact values on hover. */
export function SalesChart({ days, summary }: SalesChartProps) {
    return (
        <div className="overflow-x-auto">
            <div
                role="img"
                aria-label={summary}
                className="h-[260px] min-w-[640px]"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={days}
                        barCategoryGap={4}
                        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke="var(--color-divider)"
                        />
                        <XAxis
                            dataKey="day"
                            tick={axisTick}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--color-border-strong)' }}
                        />
                        <YAxis
                            domain={[0, 1_600_000]}
                            ticks={[0, 400_000, 800_000, 1_200_000, 1_600_000]}
                            tickFormatter={formatMillions}
                            tick={axisTick}
                            tickLine={false}
                            axisLine={false}
                            width={52}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--color-background)' }}
                            content={(props) => <SalesTooltip {...props} />}
                        />
                        <Bar
                            dataKey="cash"
                            name="Espèces"
                            stackId="sales"
                            fill="var(--color-primary)"
                            radius={[0, 0, 2, 2]}
                        />
                        <Bar
                            dataKey="mobileMoney"
                            name="Mobile money"
                            stackId="sales"
                            fill="var(--color-mobile-money)"
                            radius={[3, 3, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
