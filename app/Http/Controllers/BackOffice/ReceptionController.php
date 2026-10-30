<?php

declare(strict_types=1);

namespace App\Http\Controllers\BackOffice;

use App\Domain\Receptions\SaveReceptionDraft;
use App\Domain\Receptions\ShortDated;
use App\Domain\Receptions\ValidateReception;
use App\Enums\ReceptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Receptions\SaveReceptionRequest;
use App\Http\Resources\ReceptionResource;
use App\Models\ExchangeRate;
use App\Models\Medicine;
use App\Models\Reception;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Nouvelle réception": a delivery typed from the supplier's invoice, saved as a draft, then validated into
 * lots. The page reopens the user's latest draft.
 */
class ReceptionController extends Controller
{
    public function create(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $draft = Reception::query()
            ->where('status', ReceptionStatus::Draft)
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->with('lines.medicine')
            ->first();

        return Inertia::render('receptions/create', [
            'reception' => $draft ? (new ReceptionResource($draft))->resolve($request) : null,
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'medicines' => Medicine::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'dci', 'units_per_pack']),
            'exchangeRate' => ExchangeRate::query()->inForceOn(today()->toDateString())->value('usd_to_cdf'),
            'shortDatedMonths' => ShortDated::MONTHS,
            'today' => today()->toDateString(),
        ]);
    }

    public function saveDraft(SaveReceptionRequest $request, SaveReceptionDraft $saveDraft): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $saveDraft->handle($user, $request->reception());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('receptions.draft_saved', locale: 'fr')]);

        return to_route('receptions.create');
    }

    public function validateReception(SaveReceptionRequest $request, ValidateReception $validateReception): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $reception = $validateReception->handle($user, $request->reception(), $request->isShortDatedConfirmed());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('receptions.validated', ['count' => $reception->lines->count()], 'fr'),
        ]);

        return to_route('receptions.create');
    }
}
