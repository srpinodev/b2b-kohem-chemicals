import { useEffect, useState } from 'react'
import { downloadInvoicePdf, getInvoices } from '../../services/api/payments'
import type { Invoice } from '../../types'

const TYPE_LABEL: Record<string, string> = {
  invoice: 'Factura',
  proforma: 'Proforma',
  credit_note: 'Nota crédito',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-dust-200 text-gunmetal-700 border-dust-300',
  issued: 'bg-gold-100 text-gold-700 border-gold-200',
  paid: 'bg-pine-100 text-pine-700 border-pine-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    getInvoices()
      .then((r) => setInvoices(r.data.data))
      .catch(() => setError('No se pudieron cargar las facturas.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (inv: Invoice) => {
    setDownloading(inv.id)
    try {
      await downloadInvoicePdf(inv.id, inv.invoice_number)
    } catch {
      alert('Error al descargar el PDF.')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-xl border border-dust-200 p-8 animate-pulse h-72" />
    </div>
  )

  if (error) return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
        {error}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-1">Contabilidad</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gunmetal-800">Mis facturas</h1>
        <p className="text-sm text-gunmetal-400 mt-1">
          {invoices.length} documento(s) emitido(s)
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-dust-200 p-10 text-center text-gunmetal-400">
          No hay facturas registradas aún.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dust-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dust-100 border-b border-dust-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Número</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Estado</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500 text-right">Total (COP)</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-gunmetal-500">Emisión</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dust-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-dust-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-gunmetal-800">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-gunmetal-700">
                      {TYPE_LABEL[inv.type] ?? inv.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLE[inv.status]}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gunmetal-800">
                      ${Number(inv.total).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-gunmetal-500">{inv.issued_at ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDownload(inv)}
                        disabled={downloading === inv.id}
                        className="inline-flex items-center gap-1.5 text-pine-500 hover:text-pine-700 text-xs font-semibold disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {downloading === inv.id ? 'Descargando...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
