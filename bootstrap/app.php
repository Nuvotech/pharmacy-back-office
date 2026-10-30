<?php

use App\Domain\Auth\InvalidCredentials;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Responses\ApiErrorResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['sidebar_state']);

        $middleware->alias([
            'abilities' => CheckAbilities::class,
            'ability' => CheckForAnyAbility::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Device API errors all use { message, code, errors }, with a French message.
        $exceptions->render(fn (InvalidCredentials $e, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::make(422, 'INVALID_CREDENTIALS', 'invalid_credentials')
            : null);

        $exceptions->render(fn (ValidationException $e, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::make(422, 'VALIDATION_FAILED', 'validation_failed', errors: $e->errors())
            : null);

        $exceptions->render(fn (AuthenticationException $e, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::make(401, 'UNAUTHENTICATED', 'unauthenticated')
            : null);

        $exceptions->render(fn (AccessDeniedHttpException $e, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::make(403, 'FORBIDDEN', 'forbidden')
            : null);

        $exceptions->render(fn (NotFoundHttpException $e, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::make(404, 'NOT_FOUND', 'not_found')
            : null);

        $exceptions->render(fn (ThrottleRequestsException $e, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::make(
                429,
                'TOO_MANY_REQUESTS',
                'too_many_requests',
                ['seconds' => (string) ($e->getHeaders()['Retry-After'] ?? 60)],
                headers: $e->getHeaders(),
            )
            : null);
    })->create();
