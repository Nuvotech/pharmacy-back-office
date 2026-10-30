<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mirrors the `stock_movements.type` enum column.
 */
enum MovementType: string
{
    case OpeningStock = 'opening_stock';
    case Reception = 'reception';
    case Sale = 'sale';
    case CustomerReturn = 'customer_return';
    case SupplierReturn = 'supplier_return';
    case Adjustment = 'adjustment';
    case ExpiryWriteoff = 'expiry_writeoff';
    case InventoryCorrection = 'inventory_correction';
    case SyncReallocation = 'sync_reallocation';
}
