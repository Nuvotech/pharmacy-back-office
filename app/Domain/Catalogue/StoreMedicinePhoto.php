<?php

declare(strict_types=1);

namespace App\Domain\Catalogue;

use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Stores a medicine photo on the public disk as WebP, at most 400 px on its longest side, so the tablets
 * can download it over a weak connection.
 */
class StoreMedicinePhoto
{
    public const MAX_SIZE_PX = 400;

    private const WEBP_QUALITY = 80;

    /**
     * @param  string  $contents  the image file's bytes (PNG, JPEG, WebP or GIF)
     * @param  string  $path  where to store it on the public disk, e.g. "medicines/paracetamol.webp"
     * @return string the stored path
     */
    public function handle(string $contents, string $path): string
    {
        $source = @imagecreatefromstring($contents);
        if ($source === false) {
            throw new RuntimeException('The file is not a readable image.');
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min(1, self::MAX_SIZE_PX / max($width, $height));
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));

        $target = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($target, false);
        imagesavealpha($target, true);
        imagefill($target, 0, 0, (int) imagecolorallocatealpha($target, 0, 0, 0, 127));
        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        imagewebp($target, null, self::WEBP_QUALITY);
        $webp = (string) ob_get_clean();

        Storage::disk('public')->put($path, $webp);

        return $path;
    }
}
