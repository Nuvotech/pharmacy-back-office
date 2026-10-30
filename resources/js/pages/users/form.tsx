import { useForm } from '@inertiajs/react';
import { useId } from 'react';
import type { FormEvent } from 'react';
import { Button, ButtonLink } from '@/components/backoffice/button';
import { Card } from '@/components/backoffice/card';
import { SelectField, TextField } from '@/components/backoffice/field';
import { PageContent, PageHeader } from '@/components/backoffice/page-header';
import { roleLabels } from '@/lib/users';
import type { ManagedUser } from '@/lib/users';
import { index, store, update } from '@/routes/users';
import type { Role } from '@/types';

type UserFormProps = {
    /** Set when editing; absent for "Nouvel utilisateur". */
    user?: { data: ManagedUser };
};

type UserFormData = {
    name: string;
    role: Role;
    username: string;
    pin: string;
    email: string;
    password: string;
    is_active: boolean;
};

const roleOptions = (Object.keys(roleLabels) as Role[]).map((role) => ({
    value: role,
    label: roleLabels[role],
}));

export default function UserForm({ user: resource }: UserFormProps) {
    const user = resource?.data;
    const activeId = useId();
    const form = useForm<UserFormData>({
        name: user?.name ?? '',
        role: user?.role ?? 'cashier',
        username: user?.username ?? '',
        pin: '',
        email: user?.email ?? '',
        password: '',
        is_active: user?.is_active ?? true,
    });
    const { data, setData, errors, processing } = form;
    const isCashier = data.role === 'cashier';
    const keepsPin = user?.has_pin === true && data.username !== '';
    const keepsPassword = user !== undefined && user.email !== null;

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        form.submit(user ? update(user.id) : store(), {
            onSuccess: () => form.reset('pin', 'password'),
        });
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <PageHeader
                title={user ? user.name : 'Nouvel utilisateur'}
                back={{ label: 'Utilisateurs', href: index() }}
                actions={
                    <>
                        <ButtonLink href={index()} variant="secondary">
                            Annuler
                        </ButtonLink>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="px-[22px]"
                        >
                            Enregistrer
                        </Button>
                    </>
                }
            />
            <PageContent>
                <div className="flex max-w-[860px] flex-col gap-5">
                    <Card title="Identité" isRoomy>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-4 gap-y-3.5">
                            <TextField
                                label="Nom"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                error={errors.name}
                                autoComplete="off"
                            />
                            <SelectField
                                label="Rôle"
                                value={data.role}
                                onChange={(event) =>
                                    setData('role', event.target.value as Role)
                                }
                                options={roleOptions}
                                error={errors.role}
                                hint={
                                    isCashier
                                        ? 'Vend à la caisse. Pas d’accès au back-office.'
                                        : 'Accès au back-office et à la tablette.'
                                }
                            />
                        </div>
                        <div className="flex min-h-11 items-center gap-3 text-[15px]">
                            <input
                                id={activeId}
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(event) =>
                                    setData('is_active', event.target.checked)
                                }
                                aria-describedby={`${activeId}-description`}
                                aria-invalid={
                                    errors.is_active ? true : undefined
                                }
                                className="size-[22px] shrink-0 accent-primary"
                            />
                            <label htmlFor={activeId}>
                                <span className="font-semibold">
                                    Compte actif
                                </span>
                                <span
                                    id={`${activeId}-description`}
                                    className="block text-[13px] text-ink-muted"
                                >
                                    Désactivé, le compte ne peut plus se
                                    connecter, même sur une tablette hors ligne
                                    après sa prochaine synchronisation.
                                </span>
                            </label>
                        </div>
                        {errors.is_active ? (
                            <p className="text-xs text-danger">
                                {errors.is_active}
                            </p>
                        ) : null}
                    </Card>

                    <Card title="Connexion à la tablette" isRoomy>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-4 gap-y-3.5">
                            <TextField
                                label={
                                    isCashier
                                        ? 'Identifiant'
                                        : 'Identifiant (facultatif)'
                                }
                                value={data.username}
                                onChange={(event) =>
                                    setData('username', event.target.value)
                                }
                                error={errors.username}
                                hint="Ex. grace.m — saisi sur la tablette avec le code PIN."
                                autoCapitalize="none"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            <TextField
                                label="Code PIN"
                                type="password"
                                value={data.pin}
                                onChange={(event) =>
                                    setData(
                                        'pin',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                error={errors.pin}
                                hint={
                                    keepsPin
                                        ? 'Laisser vide pour garder le PIN actuel.'
                                        : '4 à 8 chiffres.'
                                }
                                isMono
                                inputMode="numeric"
                                maxLength={8}
                                autoComplete="new-password"
                            />
                        </div>
                    </Card>

                    {isCashier ? null : (
                        <Card title="Connexion au back-office" isRoomy>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-4 gap-y-3.5">
                                <TextField
                                    label="E-mail"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    error={errors.email}
                                    autoComplete="off"
                                />
                                <TextField
                                    label="Mot de passe"
                                    type="password"
                                    value={data.password}
                                    onChange={(event) =>
                                        setData('password', event.target.value)
                                    }
                                    error={errors.password}
                                    hint={
                                        keepsPassword
                                            ? 'Laisser vide pour garder le mot de passe actuel.'
                                            : 'Au moins 8 caractères.'
                                    }
                                    autoComplete="new-password"
                                />
                            </div>
                        </Card>
                    )}
                </div>
            </PageContent>
        </form>
    );
}
