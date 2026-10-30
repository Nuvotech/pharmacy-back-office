<?php

// Views for alerts, dashboard and reports (MySQL / MariaDB).
// v_medicine_stock: sellable stock per medicine (expired lots excluded) + out_of_stock / low_stock / ok
// v_batch_expiry:   lots with stock + expired / expiring_soon / ok (window = settings.expiry_alert_days)

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // The views use MySQL syntax; the test suite runs on SQLite and does not need them.
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(<<<'SQL'
CREATE OR REPLACE VIEW v_medicine_stock AS
SELECT
  m.id, m.name, m.dci, m.dosage, m.form, m.units_per_pack, m.min_stock_units,
  COALESCE(SUM(CASE WHEN b.expiry_date > CURRENT_DATE THEN b.qty_on_hand END), 0) AS sellable_units,
  COALESCE(SUM(CASE WHEN b.expiry_date <= CURRENT_DATE AND b.qty_on_hand > 0 THEN b.qty_on_hand END), 0) AS expired_units,
  CASE
    WHEN COALESCE(SUM(CASE WHEN b.expiry_date > CURRENT_DATE THEN b.qty_on_hand END), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(CASE WHEN b.expiry_date > CURRENT_DATE THEN b.qty_on_hand END), 0) <= m.min_stock_units THEN 'low_stock'
    ELSE 'ok'
  END AS stock_status
FROM medicines m
LEFT JOIN batches b ON b.medicine_id = m.id
WHERE m.is_active = 1
GROUP BY m.id, m.name, m.dci, m.dosage, m.form, m.units_per_pack, m.min_stock_units
SQL);

        DB::statement(<<<'SQL'
CREATE OR REPLACE VIEW v_batch_expiry AS
SELECT
  b.id AS batch_id, b.medicine_id, m.name AS medicine_name, b.lot_number, b.expiry_date,
  b.qty_on_hand, b.purchase_price_unit,
  b.qty_on_hand * b.purchase_price_unit AS value_at_cost,
  DATEDIFF(b.expiry_date, CURRENT_DATE) AS days_left,
  CASE
    WHEN b.expiry_date <= CURRENT_DATE THEN 'expired'
    WHEN b.expiry_date <= CURRENT_DATE + INTERVAL
         (SELECT CAST(value AS UNSIGNED) FROM settings WHERE `key` = 'expiry_alert_days') DAY
      THEN 'expiring_soon'
    ELSE 'ok'
  END AS expiry_status
FROM batches b
JOIN medicines m ON m.id = b.medicine_id
WHERE b.qty_on_hand > 0
SQL);
    }

    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS v_batch_expiry');
        DB::statement('DROP VIEW IF EXISTS v_medicine_stock');
    }
};
