<?php

declare(strict_types=1);

namespace App\Domain\Stock\Import;

use App\Domain\Stock\RecordStockMovement;
use App\Enums\InvoiceCurrency;
use App\Enums\MovementType;
use App\Enums\ReceptionStatus;
use App\Models\Batch;
use App\Models\Medicine;
use App\Models\Reception;
use App\Models\StockImport;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Imports the valid rows of a checked opening-stock file, all or nothing: each row becomes a lot with an
 * `opening_stock` movement through the stock ledger, grouped under one "Stock initial" reception. A
 * medicine not in the catalogue is created; an existing one takes the file's box size and sale prices.
 *
 * @phpstan-import-type StockRow from CheckStockFile
 */
class ImportOpeningStock
{
    public function __construct(private readonly RecordStockMovement $recordStockMovement) {}

    /**
     * @throws ValidationException when the file was already imported or has nothing to import
     */
    public function handle(StockImport $stockImport, User $user): StockImport
    {
        return DB::transaction(function () use ($stockImport, $user): StockImport {
            $stockImport = StockImport::query()->whereKey($stockImport->id)->lockForUpdate()->firstOrFail();

            if ($stockImport->status !== 'checked') {
                throw ValidationException::withMessages(['import' => __('stock_import.already_imported', locale: 'fr')]);
            }
            if ($stockImport->valid_rows === []) {
                throw ValidationException::withMessages(['import' => __('stock_import.nothing_to_import', locale: 'fr')]);
            }

            $now = now();
            $reception = Reception::query()->create([
                'status' => ReceptionStatus::Validated,
                'invoice_ref' => __('stock_import.reception_ref', locale: 'fr'),
                'currency' => InvoiceCurrency::Cdf,
                'received_at' => $now,
                'validated_at' => $now,
                'total_cost' => $this->totalCost($stockImport->valid_rows),
                'is_opening_stock' => true,
                'user_id' => $user->id,
                'notes' => $stockImport->file_name,
            ]);

            $medicines = Medicine::query()->get()->keyBy(fn (Medicine $medicine): string => mb_strtolower($medicine->name));
            $created = 0;

            foreach ($stockImport->valid_rows as $row) {
                $key = mb_strtolower($row['name']);
                $medicine = $medicines->get($key);

                if ($medicine === null) {
                    $medicine = Medicine::query()->create([
                        'name' => $row['name'],
                        'dci' => $row['dci'],
                        'units_per_pack' => $row['units_per_pack'],
                        'sale_price_pack' => $row['sale_price_pack'],
                        'sale_price_unit' => $row['sale_price_unit'],
                        'is_active' => true,
                    ]);
                    $medicines->put($key, $medicine);
                    $created++;
                } else {
                    $medicine->fill([
                        'units_per_pack' => $row['units_per_pack'],
                        'sale_price_pack' => $row['sale_price_pack'],
                        'is_active' => true,
                    ]);
                    if ($row['sale_price_unit'] !== null) {
                        $medicine->sale_price_unit = $row['sale_price_unit'];
                    }
                    if ($medicine->dci === null && $row['dci'] !== null) {
                        $medicine->dci = $row['dci'];
                    }
                    $medicine->save();
                }

                $units = $row['packs'] * $row['units_per_pack'];
                $lot = Batch::query()->create([
                    'medicine_id' => $medicine->id,
                    'reception_id' => $reception->id,
                    'lot_number' => $row['lot_number'] ?? 'INIT-'.$now->format('Ymd').'-'.$row['line'],
                    'expiry_date' => $row['expiry_date'],
                    'purchase_price_unit' => bcdiv($row['purchase_price_pack'], (string) $row['units_per_pack'], 4),
                    'qty_received' => $units,
                    'received_at' => $now,
                ]);

                $this->recordStockMovement->handle(
                    $lot,
                    MovementType::OpeningStock,
                    $units,
                    $user,
                    ['type' => 'stock_import', 'id' => $stockImport->id],
                    occurredAt: $now,
                );
            }

            $stockImport->forceFill([
                'status' => 'imported',
                'reception_id' => $reception->id,
                'imported_lots' => count($stockImport->valid_rows),
                'created_medicines' => $created,
                'imported_at' => $now,
            ])->save();

            return $stockImport;
        });
    }

    /**
     * Purchase value of the file in FC: boxes × purchase price of a box.
     *
     * @param  list<StockRow>  $rows
     * @return numeric-string
     */
    private function totalCost(array $rows): string
    {
        $total = '0';
        foreach ($rows as $row) {
            $total = bcadd($total, bcmul((string) $row['packs'], $row['purchase_price_pack'], 2), 2);
        }

        return $total;
    }
}
