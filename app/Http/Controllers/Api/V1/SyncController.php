<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Sync\PullCatalogue;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PullCatalogueRequest;
use App\Http\Resources\SyncMedicineResource;
use App\Http\Responses\ApiErrorResponse;
use App\Models\Category;
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
}
