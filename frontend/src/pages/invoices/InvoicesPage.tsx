import { useEffect, useState } from 'react'
import { downloadInvoicePdf, getInvoices } from '../../services/api/payments'
import type { Invoice } from '../../types'

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

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    issued: 'Emitida',
    paid: 'Pagada',
    cancelled: 'Cancelada',
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    issued: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando facturas...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Facturas</h1>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          No hay facturas registradas aún.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total (COP)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Emisión</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3 capitalize">
                    {inv.type === 'credit_note'
                      ? 'Nota Crédito'
                      : inv.type === 'proforma'
                        ? 'Proforma'
                        : 'Factura'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[inv.status]}`}>
                      {statusLabel[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(inv.total).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inv.issued_at ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDownload(inv)}
                      disabled={downloading === inv.id}
                      className="text-blue-600 hover:underline text-xs font-medium disabled:opacity-50"
                    >
                      {downloading === inv.id ? 'Descargando...' : 'Descargar PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
