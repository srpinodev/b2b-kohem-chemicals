import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentReturnPage() {
  const [params] = useSearchParams()
  const status = params.get('status')
  const orderId = params.get('order_id')

  const isSuccess = status === 'success'

  return (
    <div className="max-w-md mx-auto p-6 text-center mt-16">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
        {isSuccess ? (
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
        {isSuccess ? 'Pago procesado' : 'Pago cancelado'}
      </h1>

      <p className="text-gray-600 mb-6">
        {isSuccess
          ? 'Tu pago fue recibido correctamente. Recibirás la factura en tu correo.'
          : 'El proceso de pago fue cancelado. Puedes intentarlo nuevamente cuando quieras.'}
      </p>

      <div className="flex flex-col gap-3">
        {orderId && (
          <Link
            to={`/orders/${orderId}`}
            className="bg-blue-700 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-blue-800 transition"
          >
            Ver pedido
          </Link>
        )}
        {isSuccess && (
          <Link
            to="/invoices"
            className="border border-blue-700 text-blue-700 py-2.5 px-6 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            Ver facturas
          </Link>
        )}
        <Link to="/orders" className="text-sm text-gray-500 hover:text-gray-700 underline">
          Ir a mis pedidos
        </Link>
      </div>
    </div>
  )
}
