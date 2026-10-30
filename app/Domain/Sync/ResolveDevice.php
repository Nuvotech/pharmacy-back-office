<?php

declare(strict_types=1);

namespace App\Domain\Sync;

use App\Models\Device;
use App\Models\User;

/**
 * The device behind a sync request, marked as synced now by this user. Until device registration exists,
 * the device is identified by the token name the app signed in with (e.g. "Caisse 1"); it is created on its
 * first sync.
 */
class ResolveDevice
{
    public function handle(User $user): Device
    {
        $device = Device::query()->firstOrCreate(['name' => $user->currentAccessToken()->name], ['is_active' => true]);
        $device->forceFill(['last_sync_at' => now(), 'last_user_id' => $user->id])->save();

        return $device;
    }
}
