<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

/**
 * The single error shape of the device API: { "message", "code", "errors" }.
 */
final class ApiErrorResponse
{
    /**
     * @param  string  $messageKey  key in lang/fr/api.php; the message is always French
     * @param  array<string, string>  $replace
     * @param  array<string, list<string>>  $errors  per-field messages, for 422
     * @param  array<string, string|int>  $headers
     */
    public static function make(
        int $status,
        string $code,
        string $messageKey,
        array $replace = [],
        array $errors = [],
        array $headers = [],
    ): JsonResponse {
        return new JsonResponse([
            'message' => __('api.'.$messageKey, $replace, 'fr'),
            'code' => $code,
            'errors' => (object) $errors,
        ], $status, $headers);
    }
}
