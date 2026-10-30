<?php

declare(strict_types=1);

namespace App\Imports;

use Maatwebsite\Excel\Concerns\Import;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * How an opening-stock file is read: the first row is the header (accents and case removed, so
 * "Unités par boîte" reads as `unites_par_boite`), formulas are read as their value.
 */
class StockFileImport implements Import, WithCalculatedFormulas, WithHeadingRow {}
