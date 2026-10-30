<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * An event received from a device, by the device's UUID: an id seen before is never applied again.
 *
 * @property string $id
 * @property string $device_id
 * @property string $type
 * @property array<string, mixed> $payload
 * @property string $status applied | failed
 * @property string|null $error
 * @property Carbon $device_created_at
 * @property Carbon|null $received_at
 */
class SyncEvent extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var list<string>
     */
    protected $guarded = [];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'device_created_at' => 'datetime',
            'received_at' => 'datetime',
        ];
    }
}
