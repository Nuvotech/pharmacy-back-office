import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DataTableColumn<Row> = {
    key: string;
    /** Header text. Use `isHeaderHidden` for icon or action columns. */
    header: string;
    /** Fixed width, e.g. "130px". Leave unset for the flexible column(s). */
    width?: string;
    /** Numbers are right-aligned in mono. */
    align?: 'left' | 'right';
    isHeaderHidden?: boolean;
    render: (row: Row) => ReactNode;
};

type DataTableProps<Row> = {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    rowKey: (row: Row) => string;
    /** Below this width the table scrolls sideways inside its card, never the page. */
    minWidth: number;
    /** Extra classes per row, e.g. the warning tint of a short-dated line. */
    rowClassName?: (row: Row) => string | undefined;
    /** Shown in place of rows when the list is empty. */
    emptyMessage?: string;
    caption?: string;
    /** Extra `<tr>` after the rows, e.g. the entry row of the reception table. */
    appendedRow?: ReactNode;
    /** Keeps the header cells for screen readers but hides the header row (adjustment log). */
    isHeaderHidden?: boolean;
};

/**
 * Card table (design.md 6.9): slate-50 header row of 50 px with 12 px uppercase, widest-tracked labels;
 * body rows of at least 52 px with no dividers (whitespace separates them), slate-50 on hover.
 */
export function DataTable<Row>({
    columns,
    rows,
    rowKey,
    minWidth,
    rowClassName,
    emptyMessage = 'Aucun élément',
    caption,
    appendedRow,
    isHeaderHidden = false,
}: DataTableProps<Row>) {
    return (
        <div className="overflow-x-auto">
            <table
                className="w-full table-fixed border-collapse text-sm"
                style={{ minWidth }}
            >
                {caption ? (
                    <caption className="sr-only">{caption}</caption>
                ) : null}
                <colgroup>
                    {columns.map((column) => (
                        <col key={column.key} style={{ width: column.width }} />
                    ))}
                </colgroup>
                <thead className={cn(isHeaderHidden && 'sr-only')}>
                    <tr className="bg-surface-muted">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={cn(
                                    'h-[50px] px-2 text-xs font-semibold tracking-widest text-ink-muted uppercase first:pl-6 last:pr-6',
                                    column.align === 'right'
                                        ? 'text-right'
                                        : 'text-left',
                                )}
                            >
                                <span
                                    className={cn(
                                        column.isHeaderHidden && 'sr-only',
                                    )}
                                >
                                    {column.header}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-6 py-8 text-center text-ink-faint"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className={cn(
                                    'transition-colors hover:bg-surface-muted',
                                    rowClassName?.(row),
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            'h-[52px] px-2 py-2.5 align-middle text-ink-body first:pl-6 last:pr-6',
                                            column.align === 'right' &&
                                                'text-right tabular-nums',
                                        )}
                                    >
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                    {appendedRow}
                </tbody>
            </table>
        </div>
    );
}

/** Two-line cell (design.md 6.9): name 14 / 500 slate-900, meta 14 slate-600, 4 px apart. */
export function CellLines({
    main,
    detail,
}: {
    main: ReactNode;
    detail?: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <div className="font-medium text-ink">{main}</div>
            {detail ? (
                <div className="mt-1 text-sm text-ink-muted">{detail}</div>
            ) : null}
        </div>
    );
}
