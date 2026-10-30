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

/** One day of the chart, amounts in FC. */
export type DailySales = {
    day: number;
    cash: number;
    mobileMoney: number;
};

type SalesChartProps = {
    days: DailySales[];
    /** "octobre": shown in the tooltip after the day number. */
    monthName: string;
    /** Read by screen readers instead of the bars. */
    summary: string;
};

/** A round top for the Y axis and its 4 equal steps, e.g. 1 230 000 → 1 600 000 (steps of 400 000). */
function yScale(days: DailySales[]): { max: number; ticks: number[] } {
    const highest = Math.max(
        ...days.map((day) => day.cash + day.mobileMoney),
        0,
    );
    const rawStep = Math.max(highest / 4, 1);
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const step =
        [1, 2, 2.5, 5, 10]
            .map((factor) => factor * magnitude)
            .find((candidate) => candidate >= rawStep) ?? 10 * magnitude;

    return { max: step * 4, ticks: [0, step, step * 2, step * 3, step * 4] };
}

const axisTick = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fill: 'var(--color-ink-muted)',
};

/** 0 → "0", 400 000 → "0,4 M", 25 000 → "25 k". */
function formatAxisAmount(value: number): string {
    if (value === 0) {
        return '0';
    }
    if (value >= 100_000) {
        return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`;
    }

    return value >= 1_000
        ? `${Math.round(value / 1_000)} k`
        : String(Math.round(value));
}

function SalesTooltip({
    active,
    payload,
    monthName,
}: TooltipContentProps & { monthName: string }) {
    const day = payload?.[0]?.payload as DailySales | undefined;

    if (!active || !day) {
        return null;
    }

    return (
        <div className="rounded-input border border-border bg-surface px-3 py-2 text-[13px] shadow-card">
            <div className="mb-1 font-semibold">
                <span className="font-mono">{day.day}</span> {monthName}
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
export function SalesChart({ days, monthName, summary }: SalesChartProps) {
    const scale = yScale(days);

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
                            domain={[0, scale.max]}
                            ticks={scale.ticks}
                            tickFormatter={formatAxisAmount}
                            tick={axisTick}
                            tickLine={false}
                            axisLine={false}
                            width={52}
                        />
                        <Tooltip
                            cursor={{ fill: 'var(--color-background)' }}
                            content={(props) => (
                                <SalesTooltip
                                    {...props}
                                    monthName={monthName}
                                />
                            )}
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
