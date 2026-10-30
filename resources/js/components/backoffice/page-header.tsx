import { Head, Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    subtitle?: ReactNode;
    /** Buttons and pills on the right; they wrap below the title on narrow screens. */
    actions?: ReactNode;
    /** Back link above the title, e.g. "← Médicaments". */
    back?: { label: string; href: NonNullable<InertiaLinkProps['href']> };
};

/** White page header with the h1, a muted subtitle and the page actions. Also sets the tab title. */
export function PageHeader({
    title,
    subtitle,
    actions,
    back,
}: PageHeaderProps) {
    return (
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border bg-surface px-4 py-5 sm:px-8">
            <Head title={title} />
            <div className="min-w-0 flex-[1_1_240px]">
                {back ? (
                    <Link
                        href={back.href}
                        className="mb-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary-hover"
                    >
                        <ArrowLeft className="size-3.5" aria-hidden />
                        {back.label}
                    </Link>
                ) : null}
                <h1 className="text-[22px] font-bold">{title}</h1>
                {subtitle ? (
                    <p className="text-[13px] text-ink-muted">{subtitle}</p>
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

/** Page body: 24 × 32 × 40 padding (16 on phones), sections 20 apart. */
export function PageContent({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-5 px-4 pt-6 pb-10 sm:px-8">
            {children}
        </div>
    );
}
