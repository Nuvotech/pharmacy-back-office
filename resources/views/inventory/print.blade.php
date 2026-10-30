<!DOCTYPE html>
<html lang="fr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Feuille de comptage · {{ $startedAt->format('d/m/Y') }}</title>
        @fonts
        @vite(['resources/css/app.css'])
        {{-- Print sheet: design tokens from tokens.css, A4 portrait, opens the print dialog on load. --}}
        <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: var(--font-sans); color: var(--color-ink); background: #fff; margin: 0; padding: 16px; }
            h1 { font-size: 20px; margin: 0 0 4px; }
            .meta { color: var(--color-ink-muted); font-size: 13px; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-ink-muted); border-bottom: 1.5px solid var(--color-border-strong); padding: 6px 6px; }
            td { border-bottom: 1px solid var(--color-divider); padding: 7px 6px; vertical-align: top; }
            .mono { font-family: var(--font-mono); }
            .right { text-align: right; }
            .box { width: 80px; border: 1px solid var(--color-border-strong); height: 22px; }
            .shelf-start td { border-top: 1.5px solid var(--color-border-strong); }
            .actions { margin-bottom: 16px; }
            .actions button { font: inherit; font-weight: 600; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--color-border-strong); background: #fff; cursor: pointer; }
            @media print { .actions { display: none; } body { padding: 0; } }
        </style>
    </head>
    <body>
        <div class="actions">
            <button type="button" onclick="window.print()">Imprimer</button>
        </div>
        <h1>Feuille de comptage · inventaire du {{ $startedAt->format('d/m/Y') }}</h1>
        <p class="meta">
            {{ count($lines) }} {{ count($lines) === 1 ? 'lot' : 'lots' }} · par rayon · notez les unités comptées,
            puis saisissez-les dans « Inventaire ».
        </p>
        <table>
            <thead>
                <tr>
                    <th>Rayon</th>
                    <th>Médicament</th>
                    <th>Lot</th>
                    <th>Exp.</th>
                    <th class="right">Système</th>
                    <th class="right">Compté</th>
                </tr>
            </thead>
            <tbody>
                @php($previousShelf = false)
                @forelse ($lines as $line)
                    <tr @class(['shelf-start' => $previousShelf !== false && $line['shelf'] !== $previousShelf])>
                        <td class="mono">{{ $line['shelf'] ?? '—' }}</td>
                        <td>{{ $line['medicine'] }}</td>
                        <td class="mono">{{ $line['lot_number'] }}</td>
                        <td class="mono">{{ $line['expiry'] }}</td>
                        <td class="mono right">{{ number_format($line['expected_units'], 0, ',', ' ') }}</td>
                        <td class="right"><div class="box" style="margin-left:auto"></div></td>
                    </tr>
                    @php($previousShelf = $line['shelf'])
                @empty
                    <tr><td colspan="6">Aucun lot à compter.</td></tr>
                @endforelse
            </tbody>
        </table>
        <script>window.addEventListener('load', () => window.print());</script>
    </body>
</html>
