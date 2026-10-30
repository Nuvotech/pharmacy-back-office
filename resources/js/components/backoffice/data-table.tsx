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
 * Card table: uppercase header row with dividers above and below, rows of at least 56 px
 * separated by a 1 px divider. Columns have fixed widths, like the grid in the design.
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
                    <tr className="border-y border-divider">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={cn(
                                    'px-1.5 py-2.5 text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase first:pl-5 last:pr-5',
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
                <tbody
                    className={cn(isHeaderHidden && 'border-t border-divider')}
                >
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-5 py-6 text-ink-muted"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className={cn(
                                    'border-b border-divider',
                                    rowClassName?.(row),
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn(
                                            'h-14 px-1.5 py-2 align-middle first:pl-5 last:pr-5',
                                            column.align === 'right' &&
                                                'text-right font-mono',
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

/** Two-line cell: main text plus a 12 px muted detail. */
export function CellLines({
    main,
    detail,
}: {
    main: ReactNode;
    detail?: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <div className="font-semibold">{main}</div>
            {detail ? (
                <div className="text-xs text-ink-muted">{detail}</div>
            ) : null}
        </div>
    );
}
