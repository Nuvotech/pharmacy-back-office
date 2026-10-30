<?php

use App\Models\Category;
use App\Models\Medicine;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function pullCatalogue(array $query = [])
{
    return test()->getJson(route('api.v1.sync.catalogue', $query));
}

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create(), ['counter']);
});

test('the first pull returns every medicine with its categories and the category list', function () {
    $douleur = Category::factory()->create(['slug' => 'douleur', 'name' => 'Douleur', 'sort_order' => 2]);
    $medicine = Medicine::factory()->create([
        'name' => 'PARACETAMOL 500 MG CES 1CE',
        'sale_price_pack' => '1000.00',
        'sale_price_unit' => null,
        'image_path' => 'medicines/paracetamol.webp',
    ]);
    $medicine->categories()->attach($douleur);

    $response = pullCatalogue();

    $response->assertOk()
        ->assertJsonCount(1, 'data.medicines')
        ->assertJsonPath('data.medicines.0.id', $medicine->id)
        ->assertJsonPath('data.medicines.0.sale_price_pack', '1000.00')
        ->assertJsonPath('data.medicines.0.sale_price_unit', null)
        ->assertJsonPath('data.medicines.0.image_path', 'medicines/paracetamol.webp')
        ->assertJsonPath('data.medicines.0.category_slugs', ['douleur'])
        ->assertJsonPath('data.medicines.0.is_active', true)
        ->assertJsonPath('data.categories.0', ['slug' => 'douleur', 'name' => 'Douleur', 'sort_order' => 2])
        ->assertJsonPath('meta.has_more', false);
    expect($response->json('meta.next_cursor'))->toBeString()
        ->and($response->json('meta.server_time'))->toEndWith('Z');
});

test('pages follow the cursor without skipping or repeating medicines changed in the same second', function () {
    $this->freezeTime();
    $medicines = Medicine::factory()->count(5)->create();

    $first = pullCatalogue(['limit' => 2]);
    $second = pullCatalogue(['limit' => 2, 'cursor' => $first->json('meta.next_cursor')]);
    $third = pullCatalogue(['limit' => 2, 'cursor' => $second->json('meta.next_cursor')]);

    $pulled = collect([$first, $second, $third])->flatMap(fn ($page) => $page->json('data.medicines.*.id'));

    expect($first->json('meta.has_more'))->toBeTrue()
        ->and($second->json('meta.has_more'))->toBeTrue()
        ->and($third->json('meta.has_more'))->toBeFalse()
        ->and($pulled->sort()->values()->all())->toBe($medicines->pluck('id')->sort()->values()->all());
});

test('the next pull returns only medicines changed since, including deactivated ones', function () {
    $unchanged = Medicine::factory()->create();
    $changed = Medicine::factory()->create();
    $cursor = pullCatalogue()->json('meta.next_cursor');

    $this->travel(1)->minute();
    $changed->update(['is_active' => false]);

    $response = pullCatalogue(['cursor' => $cursor]);

    $response->assertOk()
        ->assertJsonCount(1, 'data.medicines')
        ->assertJsonPath('data.medicines.0.id', $changed->id)
        ->assertJsonPath('data.medicines.0.is_active', false);
    expect($response->json('data.medicines.*.id'))->not->toContain($unchanged->id);
});

test('with nothing new the cursor stays the same', function () {
    Medicine::factory()->create();
    $cursor = pullCatalogue()->json('meta.next_cursor');

    pullCatalogue(['cursor' => $cursor])
        ->assertJsonCount(0, 'data.medicines')
        ->assertJsonPath('meta.next_cursor', $cursor);
});

test('a page above the maximum gets the maximum', function () {
    Medicine::factory()->count(3)->create();

    pullCatalogue(['limit' => 100000])->assertOk()->assertJsonCount(3, 'data.medicines');
});

test('an unreadable cursor is refused so the tablet starts again', function () {
    pullCatalogue(['cursor' => 'not-a-cursor'])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_CURSOR');
});

test('the catalogue needs a counter token', function () {
    Sanctum::actingAs(User::factory()->create(), ['back-office']);

    pullCatalogue()->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
});
