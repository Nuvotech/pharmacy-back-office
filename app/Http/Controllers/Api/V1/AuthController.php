<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Auth\IssueApiToken;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    /**
     * Sign in with username and PIN; returns the user and a bearer token.
     */
    public function login(LoginRequest $request, IssueApiToken $issueApiToken): JsonResponse
    {
        /** @var array{username: string, pin: string, device_name: string} $credentials */
        $credentials = $request->validated();

        $issued = $issueApiToken->handle($credentials['username'], $credentials['pin'], $credentials['device_name']);

        return (new UserResource($issued->user))
            ->additional(['meta' => [
                'token' => $issued->plainTextToken,
                'token_type' => 'Bearer',
                'abilities' => $issued->user->role->tokenAbilities(),
                'expires_at' => $issued->expiresAt->utc()->toIso8601ZuluString(),
            ]])
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * The user the bearer token belongs to.
     */
    public function me(Request $request): UserResource
    {
        /** @var User $user */
        $user = $request->user();

        return new UserResource($user);
    }

    /**
     * Revoke the bearer token used for this request.
     */
    public function logout(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->currentAccessToken()->delete();

        return response()->noContent();
    }
}
