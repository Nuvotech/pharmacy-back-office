<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Stock\Import\CheckStockFile;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * An uploaded opening-stock file and the result of checking it. Importing turns its valid rows into lots.
 *
 * @phpstan-import-type StockRow from CheckStockFile
 * @phpstan-import-type StockRowError from CheckStockFile
 *
 * @property string $id
 * @property int|null $user_id
 * @property string $file_name
 * @property string $status checked | importing | imported | failed
 * @property int $row_count
 * @property list<StockRow> $valid_rows
 * @property list<StockRowError> $errors
 * @property string|null $reception_id
 * @property int $imported_lots
 * @property int $created_medicines
 * @property Carbon|null $imported_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class StockImport extends Model
{
    use HasUuids;

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
            'row_count' => 'integer',
            'valid_rows' => 'array',
            'errors' => 'array',
            'imported_lots' => 'integer',
            'created_medicines' => 'integer',
            'imported_at' => 'datetime',
        ];
    }
}
