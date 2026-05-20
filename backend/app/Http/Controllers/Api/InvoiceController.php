<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $invoiceService) {}

    public function index()
    {
        $user = auth()->user();

        $query = Invoice::with(['order', 'company'])
            ->orderBy('created_at', 'desc');

        if ($user->hasRole('cliente')) {
            $query->where('company_id', $user->company_id);
        }

        return response()->json($query->paginate(15));
    }

    public function show(Invoice $invoice)
    {
        $user = auth()->user();

        if ($user->hasRole('cliente') && $invoice->company_id !== $user->company_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($invoice->load(['order.items.product', 'company', 'transactions']));
    }

    public function downloadPdf(Invoice $invoice): Response
    {
        $user = auth()->user();

        if ($user->hasRole('cliente') && $invoice->company_id !== $user->company_id) {
            abort(403);
        }

        $path = $this->invoiceService->getPdfPath($invoice);

        return response(
            Storage::get($path),
            200,
            [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$invoice->invoice_number.'.pdf"',
            ]
        );
    }
}
