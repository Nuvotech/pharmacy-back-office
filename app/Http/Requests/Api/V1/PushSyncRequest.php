<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The envelope of a sync push: at most 200 events. Each event's payload is checked on its own during
 * ingest, so one bad event doesn't refuse the whole batch.
 */
class PushSyncRequest extends FormRequest
{
    public const MAX_EVENTS = 200;

    /**
     * Access is checked by the `abilities:counter` middleware on the route.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'events' => ['present', 'array', 'max:'.self::MAX_EVENTS],
            'events.*.id' => ['required', 'uuid', 'distinct'],
            'events.*.type' => ['required', 'string', 'max:50'],
            'events.*.created_at' => ['required', 'date'],
            'events.*.payload' => ['required', 'array'],
        ];
    }

    /**
     * @return list<array{id: string, type: string, created_at: string, payload: array<string, mixed>}>
     */
    public function events(): array
    {
        /** @var array{events: list<array{id: string, type: string, created_at: string, payload: array<string, mixed>}>} $data */
        $data = $this->validated();

        return $data['events'];
    }
}
