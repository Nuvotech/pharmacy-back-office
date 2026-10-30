<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Sync\IngestSyncBatch;
use App\Domain\Sync\PullCatalogue;
use App\Domain\Sync\PullStock;
use App\Domain\Sync\ResolveDevice;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PullCatalogueRequest;
use App\Http\Requests\Api\V1\PullStockRequest;
use App\Http\Requests\Api\V1\PushSyncRequest;
use App\Http\Resources\SyncBatchResource;
use App\Http\Resources\SyncMedicineResource;
use App\Http\Responses\ApiErrorResponse;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class SyncController extends Controller
{
    /**
     * `GET /api/v1/sync/catalogue?cursor=`: medicines changed since the cursor, plus every category.
     * The tablet repeats with `meta.next_cursor` while `meta.has_more` is true, then keeps that cursor.
     */
    public function catalogue(PullCatalogueRequest $request, PullCatalogue $pullCatalogue): JsonResponse
    {
        /** @var array{cursor?: string|null, limit?: int|null} $input */
        $input = $request->validated();

        try {
            $page = $pullCatalogue->handle($input['cursor'] ?? null, $input['limit'] ?? PullCatalogue::DEFAULT_LIMIT);
        } catch (InvalidArgumentException) {
            return ApiErrorResponse::make(422, 'INVALID_CURSOR', 'invalid_cursor');
        }

        return new JsonResponse([
            'data' => [
                'medicines' => SyncMedicineResource::collection($page['medicines']),
                'categories' => $page['categories']->map(fn (Category $category): array => [
                    'slug' => $category->slug,
                    'name' => $category->name,
                    'sort_order' => $category->sort_order,
                ]),
            ],
            'meta' => [
                'next_cursor' => $page['next_cursor'],
                'has_more' => $page['has_more'],
                'server_time' => now()->utc()->toIso8601ZuluString(),
            ],
        ]);
    }

    /**
     * `GET /api/v1/sync/stock?cursor=`: lots changed since the cursor (receptions, sales, corrections).
     * Same paging as the catalogue.
     */
    public function stock(PullStockRequest $request, PullStock $pullStock, ResolveDevice $resolveDevice): JsonResponse
    {
        /** @var array{cursor?: string|null, limit?: int|null} $input */
        $input = $request->validated();

        // The tablet pulls stock every minute while online: this is what the dashboard's "Appareils" shows.
        /** @var User $user */
        $user = $request->user();
        $resolveDevice->handle($user);

        try {
            $page = $pullStock->handle($input['cursor'] ?? null, $input['limit'] ?? PullStock::DEFAULT_LIMIT);
        } catch (InvalidArgumentException) {
            return ApiErrorResponse::make(422, 'INVALID_CURSOR', 'invalid_cursor');
        }

        return new JsonResponse([
            'data' => [
                'batches' => SyncBatchResource::collection($page['batches']),
            ],
            'meta' => [
                'next_cursor' => $page['next_cursor'],
                'has_more' => $page['has_more'],
                'server_time' => now()->utc()->toIso8601ZuluString(),
            ],
        ]);
    }

    /**
     * `POST /api/v1/sync/push`: events made offline on the tablet (sales). Returns one result per event
     * (`applied`, `duplicate` or `failed`) and the corrected quantities of the lots that changed.
     */
    public function push(PushSyncRequest $request, IngestSyncBatch $ingest, ResolveDevice $resolveDevice): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $outcome = $ingest->handle($resolveDevice->handle($user), $request->events());

        return new JsonResponse([
            'data' => $outcome,
            'meta' => ['server_time' => now()->utc()->toIso8601ZuluString()],
        ]);
    }
}
