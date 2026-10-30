import { Head, Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    /** Shown after the title, past a divider (design.md 6.3: breadcrumb position). */
    subtitle?: ReactNode;
    /** Buttons and pills on the right; they wrap below the title on narrow screens. */
    actions?: ReactNode;
    /** Parent page, shown as a breadcrumb: "Médicaments › {title}". */
    back?: { label: string; href: NonNullable<InertiaLinkProps['href']> };
};

/**
 * Page-header band (design.md 6.3): slate-100 band under the top bar with the title (18/600), a
 * divider, then the breadcrumb or subtitle; page actions on the right. Also sets the tab title.
 */
export function PageHeader({
    title,
    subtitle,
    actions,
    back,
}: PageHeaderProps) {
    const detail = back ? (
        <nav aria-label="Fil d'Ariane" className="flex items-center text-sm">
            <Link
                href={back.href}
                className="text-ink-faint hover:text-primary"
            >
                {back.label}
            </Link>
            <ChevronRight className="mx-3 size-3 text-ink-faint" aria-hidden />
            <span className="truncate text-ink-body">{title}</span>
        </nav>
    ) : subtitle ? (
        <p className="text-sm text-ink-faint">{subtitle}</p>
    ) : null;

    return (
        <header className="flex min-h-[60px] flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background px-4 py-2.5 sm:px-8 xl:px-12">
            <Head title={title} />
            <div className="flex min-w-0 flex-[1_1_240px] flex-wrap items-center gap-y-1">
                <h1 className="text-lg leading-7 font-semibold text-ink">
                    {title}
                </h1>
                {detail ? (
                    <>
                        <span
                            className="mx-4 hidden h-5 w-px bg-border-strong sm:block"
                            aria-hidden
                        />
                        <div className="min-w-0 basis-full sm:basis-auto">
                            {detail}
                        </div>
                    </>
                ) : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-3">
                    {actions}
                </div>
            ) : null}
        </header>
    );
}

/** Page body (design.md 4.1): 48 px gutter (32 / 16 on smaller screens), 32 px top, 24 px gaps. */
export function PageContent({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6 px-4 pt-8 pb-12 sm:px-8 xl:px-12">
            {children}
        </div>
    );
}
