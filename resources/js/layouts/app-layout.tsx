import type { ReactNode } from 'react';
import { BackofficeSidebar } from '@/components/backoffice/backoffice-sidebar';
import { pharmacyName } from '@/lib/pharmacy';

/**
 * Back-office shell: dark sidebar and main column in a wrapping row, so the sidebar
 * stacks above the content on narrow screens. Pages render their own PageHeader.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-wrap bg-background text-ink">
            <BackofficeSidebar pharmacyName={pharmacyName} />
            <main className="flex min-w-0 flex-[999_1_560px] flex-col">
                {children}
            </main>
        </div>
    );
}
