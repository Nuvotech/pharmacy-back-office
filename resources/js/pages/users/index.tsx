import { Link } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { Badge } from '@/components/backoffice/badge';
import { ButtonLink, iconButtonClasses } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { CellLines, DataTable } from '@/components/backoffice/data-table';
import type { DataTableColumn } from '@/components/backoffice/data-table';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { roleLabels } from '@/lib/users';
import type { ManagedUser } from '@/lib/users';
import { create, edit } from '@/routes/users';

const columns: DataTableColumn<ManagedUser>[] = [
    {
        key: 'name',
        header: 'Nom',
        render: (user) => (
            <CellLines
                main={user.name}
                detail={user.username ? `Identifiant ${user.username}` : '—'}
            />
        ),
    },
    {
        key: 'role',
        header: 'Rôle',
        width: '130px',
        render: (user) => roleLabels[user.role],
    },
    {
        key: 'tablet',
        header: 'Tablette',
        width: '140px',
        render: (user) => (
            <span className="text-ink-muted">
                {user.username && user.has_pin ? 'PIN défini' : 'Pas d’accès'}
            </span>
        ),
    },
    {
        key: 'email',
        header: 'Back-office',
        width: '220px',
        render: (user) => (
            <span className="text-ink-muted">
                {user.email ?? 'Pas d’accès'}
            </span>
        ),
    },
    {
        key: 'status',
        header: 'Statut',
        width: '120px',
        render: (user) =>
            user.is_active ? (
                <Badge tone="ok">Actif</Badge>
            ) : (
                <Badge tone="danger">Désactivé</Badge>
            ),
    },
    {
        key: 'edit',
        header: 'Action',
        width: '70px',
        isHeaderHidden: true,
        render: (user) => (
            <div className="flex justify-end">
                <Link
                    href={edit(user.id)}
                    className={iconButtonClasses}
                    aria-label={`Modifier ${user.name}`}
                    title="Modifier"
                >
                    <Pencil className="size-5" strokeWidth={1.5} aria-hidden />
                </Link>
            </div>
        ),
    },
];

type UsersIndexProps = {
    users: { data: ManagedUser[] };
};

/** "Utilisateurs": who can sign in on the tablet (identifiant + PIN) and in the back office (e-mail). */
export default function UsersIndex({ users }: UsersIndexProps) {
    const activeCount = users.data.filter((user) => user.is_active).length;

    return (
        <>
            <PageHeader
                title="Utilisateurs"
                subtitle={`${activeCount} compte${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''} · un compte désactivé ne peut plus se connecter`}
                actions={
                    <ButtonLink href={create()}>
                        <Plus strokeWidth={2.6} aria-hidden />
                        Nouvel utilisateur
                    </ButtonLink>
                }
            />
            <PageContent>
                <Card isPadded={false} className="overflow-hidden">
                    <DataTable
                        columns={columns}
                        rows={users.data}
                        rowKey={(user) => String(user.id)}
                        minWidth={800}
                        caption="Liste des utilisateurs"
                        emptyMessage="Aucun utilisateur"
                    />
                </Card>
            </PageContent>
        </>
    );
}
