<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Users\SaveUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\BackOffice\StoreUserRequest;
use App\Http\Requests\BackOffice\UpdateUserRequest;
use App\Http\Resources\ManagedUserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Utilisateurs": accounts, their role, tablet login (username + PIN) and back-office login (email + password).
 */
class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()->orderByDesc('is_active')->orderBy('name')->get();

        return Inertia::render('users/index', [
            'users' => ManagedUserResource::collection($users),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('users/form');
    }

    public function store(StoreUserRequest $request, SaveUser $saveUser): RedirectResponse
    {
        /** @var array{name: string, role: string, username?: string|null, email?: string|null, pin?: string|null, password?: string|null, is_active: bool} $data */
        $data = $request->validated();
        $saveUser->handle(null, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('users.created', locale: 'fr')]);

        return to_route('users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('users/form', [
            'user' => new ManagedUserResource($user),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user, SaveUser $saveUser): RedirectResponse
    {
        /** @var array{name: string, role: string, username?: string|null, email?: string|null, pin?: string|null, password?: string|null, is_active: bool} $data */
        $data = $request->validated();
        $saveUser->handle($user, $data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('users.updated', locale: 'fr')]);

        return to_route('users.index');
    }
}
