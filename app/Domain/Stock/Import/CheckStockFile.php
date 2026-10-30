<?php

declare(strict_types=1);

namespace App\Domain\Stock\Import;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

/**
 * Checks the rows of an opening-stock file (one row per lot, columns as in the template) and splits them
 * into rows ready to import and errors to correct. Nothing is saved here.
 *
 * @phpstan-type StockRow array{line: int, name: string, dci: string|null, shelf: string|null, lot_number: string|null, expiry_date: string, packs: int, units_per_pack: int, sale_price_pack: numeric-string, sale_price_unit: numeric-string|null, purchase_price_pack: numeric-string}
 * @phpstan-type StockRowError array{line: int, medicine: string, column: string, problem: string}
 */
class CheckStockFile
{
    /** Template columns, in order. */
    public const COLUMNS = [
        'nom', 'dci', 'numero_lot', 'date_expiration', 'quantite', 'unites_par_boite', 'prix_boite',
        'prix_unite', 'prix_achat_boite', 'rayon',
    ];

    /** Rows allowed in one file. */
    public const MAX_ROWS = 5000;

    /**
     * @param  list<array<string, mixed>>  $rows  data rows keyed by column name; the first one is line 2
     * @return array{valid: list<StockRow>, errors: list<StockRowError>, row_count: int}
     */
    public function handle(array $rows, CarbonInterface $today): array
    {
        $valid = [];
        $errors = [];
        $lotLines = [];
        $boxSizeLines = [];
        $rowCount = 0;

        foreach ($rows as $index => $row) {
            if ($this->isEmptyRow($row)) {
                continue;
            }

            $rowCount++;
            $line = $index + 2;
            $name = $this->text($row['nom'] ?? null);
            $rowErrors = [];
            $error = function (string $column, string $problem) use (&$rowErrors, $line, $name): void {
                $rowErrors[] = ['line' => $line, 'medicine' => $name ?? '—', 'column' => $column, 'problem' => $problem];
            };

            if ($name === null) {
                $error('nom', 'Nom vide — chaque ligne doit nommer un médicament');
            } elseif (mb_strlen($name) > 255) {
                $error('nom', 'Nom trop long (255 caractères au plus)');
            }

            $shelf = $this->text($row['rayon'] ?? null);
            $shelf = $shelf === null ? null : mb_strtoupper($shelf);
            if ($shelf !== null && mb_strlen($shelf) > 20) {
                $error('rayon', 'Rayon trop long (20 caractères au plus)');
            }

            $lotNumber = $this->text($row['numero_lot'] ?? null);
            $lotNumber = $lotNumber === null ? null : mb_strtoupper($lotNumber);
            if ($lotNumber !== null && mb_strlen($lotNumber) > 100) {
                $error('numero_lot', 'Numéro de lot trop long (100 caractères au plus)');
            }

            $expiry = $this->expiryDate($row['date_expiration'] ?? null, $error);
            if ($expiry !== null && $expiry->toDateString() <= $today->toDateString()) {
                $error('date_expiration', 'Date passée ('.$expiry->format('d/m/Y').') — lot déjà expiré');
                $expiry = null;
            }

            $packs = $this->wholeNumber($row['quantite'] ?? null, 'quantite', 'boîte', $error);
            $unitsPerPack = $this->wholeNumber($row['unites_par_boite'] ?? null, 'unites_par_boite', 'unité par boîte', $error);
            $salePack = $this->amount($row['prix_boite'] ?? null, 'prix_boite', true, $error);
            $saleUnit = $this->amount($row['prix_unite'] ?? null, 'prix_unite', false, $error);
            $purchasePack = $this->amount($row['prix_achat_boite'] ?? null, 'prix_achat_boite', false, $error);

            if ($name !== null) {
                $medicineKey = mb_strtolower($name);

                if ($lotNumber !== null) {
                    $lotKey = $medicineKey.'|'.$lotNumber;
                    if (isset($lotLines[$lotKey])) {
                        $error('nom', "Doublon de la ligne {$lotLines[$lotKey]} avec le même numéro de lot");
                    } else {
                        $lotLines[$lotKey] = $line;
                    }
                }

                if ($unitsPerPack !== null) {
                    $first = $boxSizeLines[$medicineKey] ?? null;
                    if ($first !== null && $first['units'] !== $unitsPerPack) {
                        $error('unites_par_boite', "Différent de la ligne {$first['line']} ({$first['units']}) pour le même médicament");
                    } elseif ($first === null) {
                        $boxSizeLines[$medicineKey] = ['line' => $line, 'units' => $unitsPerPack];
                    }
                }
            }

            if ($rowErrors !== [] || $name === null || $expiry === null || $packs === null || $unitsPerPack === null || $salePack === null) {
                array_push($errors, ...$rowErrors);

                continue;
            }

            $valid[] = [
                'line' => $line,
                'name' => $name,
                'dci' => $this->text($row['dci'] ?? null),
                'shelf' => $shelf,
                'lot_number' => $lotNumber,
                'expiry_date' => $expiry->toDateString(),
                'packs' => $packs,
                'units_per_pack' => $unitsPerPack,
                'sale_price_pack' => $salePack,
                'sale_price_unit' => $saleUnit,
                'purchase_price_pack' => $purchasePack ?? '0',
            ];
        }

        return ['valid' => $valid, 'errors' => $errors, 'row_count' => $rowCount];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if ($this->text($value) !== null) {
                return false;
            }
        }

        return true;
    }

    private function text(mixed $value): ?string
    {
        if ($value === null || is_array($value) || is_object($value)) {
            return null;
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    /**
     * An Excel date, "JJ/MM/AAAA", "AAAA-MM-JJ" or "MM/AAAA" (last day of that month).
     *
     * @param  callable(string, string): void  $error
     */
    private function expiryDate(mixed $value, callable $error): ?CarbonImmutable
    {
        if (is_int($value) || is_float($value)) {
            try {
                return CarbonImmutable::instance(ExcelDate::excelToDateTimeObject($value))->startOfDay();
            } catch (Throwable) {
                $error('date_expiration', 'Date illisible — format JJ/MM/AAAA ou MM/AAAA');

                return null;
            }
        }

        $text = $this->text($value);
        if ($text === null) {
            $error('date_expiration', "Date vide — chaque lot doit avoir une date d'expiration");

            return null;
        }

        $date = match (true) {
            preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $text, $m) === 1 => checkdate((int) $m[2], (int) $m[1], (int) $m[3])
                ? CarbonImmutable::create((int) $m[3], (int) $m[2], (int) $m[1])
                : null,
            preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $text, $m) === 1 => checkdate((int) $m[2], (int) $m[3], (int) $m[1])
                ? CarbonImmutable::create((int) $m[1], (int) $m[2], (int) $m[3])
                : null,
            preg_match('/^(\d{1,2})\/(\d{4})$/', $text, $m) === 1 => (int) $m[1] >= 1 && (int) $m[1] <= 12
                ? CarbonImmutable::create((int) $m[2], (int) $m[1], 1)?->endOfMonth()->startOfDay()
                : null,
            default => null,
        };

        if (! $date instanceof CarbonImmutable) {
            $error('date_expiration', "Date illisible « {$text} » — format JJ/MM/AAAA ou MM/AAAA");

            return null;
        }

        return $date;
    }

    /**
     * A whole number of at least 1.
     *
     * @param  callable(string, string): void  $error
     */
    private function wholeNumber(mixed $value, string $column, string $unitLabel, callable $error): ?int
    {
        $text = $this->text($value);
        if ($text === null) {
            $error($column, 'Vide — saisissez un nombre');

            return null;
        }

        $normalized = str_replace([' ', "\u{202F}", "\u{00A0}"], '', $text);
        if (! is_numeric($normalized)) {
            $error($column, "Texte « {$text} » au lieu d'un nombre");

            return null;
        }
        if ((float) $normalized < 0) {
            $error($column, "Nombre négatif ({$normalized})");

            return null;
        }
        if (floor((float) $normalized) !== (float) $normalized) {
            $error($column, "Nombre entier attendu ({$normalized})");

            return null;
        }
        if ((int) $normalized === 0) {
            $error($column, "Vaut 0 — au moins 1 {$unitLabel}");

            return null;
        }

        return (int) $normalized;
    }

    /**
     * An amount in FC (comma or dot as decimal separator), 2 decimals at most.
     *
     * @param  callable(string, string): void  $error
     * @return numeric-string|null
     */
    private function amount(mixed $value, string $column, bool $isRequired, callable $error): ?string
    {
        $text = $this->text($value);
        if ($text === null) {
            if ($isRequired) {
                $error($column, 'Vide — saisissez un prix en FC');
            }

            return null;
        }

        $normalized = str_replace([' ', "\u{202F}", "\u{00A0}", ','], ['', '', '', '.'], $text);
        if (! is_numeric($normalized)) {
            $error($column, "Texte « {$text} » au lieu d'un nombre");

            return null;
        }
        if ((float) $normalized < 0) {
            $error($column, "Nombre négatif ({$normalized})");

            return null;
        }

        return bcadd($normalized, '0', 2);
    }
}
