<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AccountResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AccountController extends Controller
{
    /**
     * Every active account that can sign in on a tablet. The tablet replaces its copy with this list, so a
     * deactivated account or a removed PIN stops working offline after the next download.
     */
    public function index(): AnonymousResourceCollection
    {
        $accounts = User::query()
            ->where('is_active', true)
            ->whereNotNull('username')
            ->whereNotNull('pin_hash')
            ->orderBy('name')
            ->get();

        return AccountResource::collection($accounts);
    }
}
