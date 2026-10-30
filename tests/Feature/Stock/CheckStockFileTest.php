<?php

use App\Domain\Stock\Import\CheckStockFile;
use Carbon\CarbonImmutable;

function stockRow(array $overrides = []): array
{
    return [
        'nom' => 'PARACETAMOL 500 MG',
        'dci' => 'Paracétamol',
        'numero_lot' => 'pc-8810',
        'date_expiration' => '11/2027',
        'quantite' => '34',
        'unites_par_boite' => '10',
        'prix_boite' => '1 000',
        'prix_unite' => '120',
        'prix_achat_boite' => '700,50',
        'rayon' => 'a2',
        ...$overrides,
    ];
}

function checkRows(array $rows): array
{
    return app(CheckStockFile::class)->handle($rows, CarbonImmutable::parse('2026-10-30'));
}

test('a complete row is ready to import, normalised', function () {
    $result = checkRows([stockRow()]);

    expect($result['errors'])->toBe([])
        ->and($result['row_count'])->toBe(1)
        ->and($result['valid'][0])->toBe([
            'line' => 2,
            'name' => 'PARACETAMOL 500 MG',
            'dci' => 'Paracétamol',
            'shelf' => 'A2',
            'lot_number' => 'PC-8810',
            'expiry_date' => '2027-11-30',
            'packs' => 34,
            'units_per_pack' => 10,
            'sale_price_pack' => '1000.00',
            'sale_price_unit' => '120.00',
            'purchase_price_pack' => '700.50',
        ]);
});

test('dates are read as Excel dates, JJ/MM/AAAA, AAAA-MM-JJ or MM/AAAA', function (mixed $value, string $expected) {
    expect(checkRows([stockRow(['date_expiration' => $value])])['valid'][0]['expiry_date'])->toBe($expected);
})->with([
    'Excel serial date' => [47088, '2028-12-01'],
    'day/month/year' => ['15/03/2028', '2028-03-15'],
    'ISO' => ['2028-03-15', '2028-03-15'],
    'month/year' => ['02/2028', '2028-02-29'],
]);

test('each problem from the design is reported with its line, column and French message', function () {
    $result = checkRows([
        stockRow(),
        stockRow(['nom' => 'CEFTRIAXONE 1 G', 'numero_lot' => 'CF-1', 'date_expiration' => '']),
        stockRow(['nom' => 'PARACETAMOL SIROP', 'numero_lot' => 'PS-1', 'date_expiration' => '12/09/2026']),
        stockRow(['nom' => 'AMOXICILLINE 250 MG', 'numero_lot' => 'AX-1', 'prix_boite' => 'deux mille']),
        stockRow(['nom' => 'QUININE 300 MG', 'numero_lot' => 'QN-1', 'unites_par_boite' => '0']),
        stockRow(['nom' => 'COTRIMOXAZOLE 480 MG', 'numero_lot' => 'CT-1', 'quantite' => '-20']),
        stockRow(['numero_lot' => 'PC-8810']),
    ]);

    expect($result['row_count'])->toBe(7)
        ->and($result['valid'])->toHaveCount(1)
        ->and($result['errors'])->toBe([
            ['line' => 3, 'medicine' => 'CEFTRIAXONE 1 G', 'column' => 'date_expiration', 'problem' => "Date vide — chaque lot doit avoir une date d'expiration"],
            ['line' => 4, 'medicine' => 'PARACETAMOL SIROP', 'column' => 'date_expiration', 'problem' => 'Date passée (12/09/2026) — lot déjà expiré'],
            ['line' => 5, 'medicine' => 'AMOXICILLINE 250 MG', 'column' => 'prix_boite', 'problem' => "Texte « deux mille » au lieu d'un nombre"],
            ['line' => 6, 'medicine' => 'QUININE 300 MG', 'column' => 'unites_par_boite', 'problem' => 'Vaut 0 — au moins 1 unité par boîte'],
            ['line' => 7, 'medicine' => 'COTRIMOXAZOLE 480 MG', 'column' => 'quantite', 'problem' => 'Nombre négatif (-20)'],
            ['line' => 8, 'medicine' => 'PARACETAMOL 500 MG', 'column' => 'nom', 'problem' => 'Doublon de la ligne 2 avec le même numéro de lot'],
        ]);
});

test('the same medicine with two box sizes is refused on the later line', function () {
    $result = checkRows([stockRow(), stockRow(['numero_lot' => 'PC-2', 'unites_par_boite' => '20'])]);

    expect($result['errors'][0])->toMatchArray([
        'line' => 3,
        'column' => 'unites_par_boite',
        'problem' => 'Différent de la ligne 2 (10) pour le même médicament',
    ]);
});

test('empty rows are skipped and a lot number is optional', function () {
    $result = checkRows([stockRow(['numero_lot' => '']), ['nom' => null, 'quantite' => ''], stockRow(['numero_lot' => null, 'nom' => 'B'])]);

    expect($result['row_count'])->toBe(2)
        ->and($result['errors'])->toBe([])
        ->and($result['valid'][0]['lot_number'])->toBeNull();
});
