import { Form, Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { LoginIllustration } from '@/components/login-illustration';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { Spinner } from '@/components/ui/spinner';
import { usePharmacyName } from '@/lib/pharmacy';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const inputClasses =
    'h-[52px] w-full rounded-control border-[1.5px] border-login-border bg-white px-4 text-base text-login-ink outline-none placeholder:text-login-muted focus:border-login-navy';

/**
 * Background circle: 900 px on a laptop, growing with the screen height up to 1 500 px. It is
 * vertically centred and pushed a quarter of its width past the right edge, as in the design.
 */
const circleSize = 'clamp(900px, 112vh, 1500px)';

/** Back-office login, styled like the tablet login (design/tablet/tablet/screens/Tablet-Login.png). */
export default function Login({ status, canResetPassword }: Props) {
    const pharmacyName = usePharmacyName();

    return (
        <div className="min-h-svh overflow-hidden bg-white text-login-ink">
            <Head title="Connexion" />

            {/* Ultra-wide screens: keep the form and the illustration together in a centred frame. */}
            <div className="relative mx-auto flex min-h-svh w-full max-w-[2000px]">
                <div
                    aria-hidden
                    className="absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-login-circle lg:block"
                    style={{
                        width: circleSize,
                        height: circleSize,
                        right: `calc(${circleSize} * -0.245)`,
                    }}
                />

                <main className="relative flex w-full shrink-0 flex-col px-6 pt-12 pb-10 sm:px-[72px] lg:w-[560px] xl:w-[620px] 2xl:w-[720px] 2xl:px-24 2xl:pt-16 2xl:pb-14">
                    <div className="flex items-center gap-2.5 2xl:gap-3">
                        <div className="flex size-[34px] items-center justify-center rounded-[9px] bg-login-navy 2xl:size-10 2xl:rounded-[10px]">
                            <Plus
                                className="size-[18px] text-white 2xl:size-5"
                                strokeWidth={3}
                                aria-hidden
                            />
                        </div>
                        <span className="text-base font-bold tracking-[0.04em] text-login-heading uppercase 2xl:text-lg">
                            {pharmacyName}
                        </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-center gap-7 py-10 2xl:gap-9">
                        <div>
                            <h1 className="text-[52px] leading-[1.05] font-bold tracking-[0.02em] text-login-heading 2xl:text-[64px]">
                                BIENVENUE
                            </h1>
                            <p className="mt-1.5 text-[30px] font-light text-login-subtitle 2xl:text-[36px]">
                                Accès au back-office
                            </p>
                        </div>

                        <div className="flex w-full max-w-[380px] flex-col 2xl:max-w-[440px]">
                            {status ? (
                                <p className="mb-4 rounded-control bg-login-circle px-4 py-3 text-sm font-medium text-login-heading">
                                    {status}
                                </p>
                            ) : null}

                            <PasskeyVerify
                                label="Se connecter avec une clé d'accès"
                                loadingLabel="Authentification…"
                                separator="ou avec votre adresse e-mail"
                                separatorClassName="bg-white"
                            />

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="flex flex-col gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <LoginField
                                            label="Adresse e-mail"
                                            htmlFor="email"
                                        >
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                autoComplete="email"
                                                placeholder="pharmacien@exemple.cd"
                                                className={inputClasses}
                                            />
                                            <InputError
                                                message={errors.email}
                                                className="text-danger"
                                            />
                                        </LoginField>

                                        <LoginField
                                            label="Mot de passe"
                                            htmlFor="password"
                                        >
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                autoComplete="current-password"
                                                className={`${inputClasses} pr-11`}
                                            />
                                            <InputError
                                                message={errors.password}
                                                className="text-danger"
                                            />
                                        </LoginField>

                                        <label className="flex min-h-11 items-center gap-3 text-sm text-login-muted">
                                            <input
                                                type="checkbox"
                                                name="remember"
                                                className="size-5 accent-login-navy"
                                            />
                                            Se souvenir de moi
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            data-test="login-button"
                                            className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-login-navy text-[17px] font-bold text-white transition-colors hover:bg-login-navy-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-login-navy disabled:opacity-60"
                                        >
                                            {processing ? <Spinner /> : null}
                                            Se connecter
                                        </button>

                                        <div className="flex flex-col gap-1 text-[13px] text-login-muted">
                                            {canResetPassword ? (
                                                <p>
                                                    Mot de passe oublié ?{' '}
                                                    <Link
                                                        href={request()}
                                                        className="font-semibold text-login-navy hover:text-login-navy-hover"
                                                    >
                                                        Le réinitialiser
                                                    </Link>
                                                </p>
                                            ) : (
                                                <p>
                                                    Mot de passe oublié ?
                                                    Demandez au pharmacien.
                                                </p>
                                            )}
                                            <p>
                                                Pas encore de compte ? Demandez
                                                à l'administrateur.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[13px] text-login-muted 2xl:text-sm">
                        <span
                            className="size-2 rounded-full bg-login-navy"
                            aria-hidden
                        />
                        Back-office · gestion du stock et des ventes
                    </div>
                </main>

                {/* Grows with the screen, but never taller than 80 % of it. */}
                <div className="relative hidden min-w-0 flex-1 items-center justify-center p-8 lg:flex xl:p-12 2xl:p-16">
                    <LoginIllustration className="h-auto max-h-[80vh] w-full max-w-[680px] xl:max-w-[820px] 2xl:max-w-[1000px]" />
                </div>
            </div>
        </div>
    );
}

function LoginField({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label
                htmlFor={htmlFor}
                className="text-[13px] font-medium text-login-muted"
            >
                {label}
            </label>
            {children}
        </div>
    );
}
