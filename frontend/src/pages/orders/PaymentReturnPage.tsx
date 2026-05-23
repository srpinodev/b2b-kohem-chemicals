import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentReturnPage() {
  const [params] = useSearchParams()
  const status = params.get('status')
  const orderId = params.get('order_id')
  const isSuccess = status === 'success'

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 pt-20 pb-10">
      <div className="bg-white rounded-2xl border border-dust-200 shadow-sm p-8 text-center">
        <div
          className={[
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 border-2',
            isSuccess
              ? 'bg-pine-100 border-pine-300 text-pine-600'
              : 'bg-red-50 border-red-200 text-red-600',
          ].join(' ')}
        >
          {isSuccess ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-gunmetal-800' : 'text-gunmetal-800'}`}>
          {isSuccess ? '¡Pago procesado!' : 'Pago cancelado'}
        </h1>

        <p className="text-gunmetal-500 mb-6 text-sm leading-relaxed">
          {isSuccess
            ? 'Tu pago fue recibido correctamente. Recibirás la factura en tu correo.'
            : 'El proceso de pago fue cancelado. Puedes intentarlo nuevamente cuando quieras.'}
        </p>

        <div className="flex flex-col gap-2">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="bg-gunmetal-600 hover:bg-gunmetal-700 text-dust-50 py-2.5 px-6 rounded-lg font-semibold text-sm transition"
            >
              Ver pedido
            </Link>
          )}
          {isSuccess && (
            <Link
              to="/invoices"
              className="border border-pine-400 text-pine-600 hover:bg-pine-50 py-2.5 px-6 rounded-lg font-semibold text-sm transition"
            >
              Ver facturas
            </Link>
          )}
          <Link
            to="/orders"
            className="text-sm text-gunmetal-400 hover:text-pine-600 hover:underline mt-1"
          >
            Ir a mis pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
