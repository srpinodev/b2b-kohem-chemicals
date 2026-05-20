import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/catalog/CatalogPage'
import ProductDetailPage from './pages/catalog/ProductDetailPage'
import LoginPage from './pages/auth/LoginPage'
import TwoFactorPage from './pages/auth/TwoFactorPage'
import InvoicesPage from './pages/invoices/InvoicesPage'
import CartPage from './pages/orders/CartPage'
import CheckoutPage from './pages/orders/CheckoutPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'
import OrdersPage from './pages/orders/OrdersPage'
import PaymentReturnPage from './pages/orders/PaymentReturnPage'
import { useAuthStore } from './store/authStore'

import type { RoleName } from './types'

function Protected({ children, roles }: { children: React.ReactNode; roles?: RoleName[] }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/catalog" replace /> : <LoginPage />} />
      <Route path="/auth/2fa" element={<TwoFactorPage />} />

      <Route path="/catalog" element={<Protected><CatalogPage /></Protected>} />
      <Route path="/catalog/:sku" element={<Protected><ProductDetailPage /></Protected>} />
      <Route path="/cart" element={<Protected><CartPage /></Protected>} />
      <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
      <Route path="/orders/:id" element={<Protected><OrderDetailPage /></Protected>} />
      <Route path="/orders/:id/checkout" element={<Protected><CheckoutPage /></Protected>} />
      <Route path="/invoices" element={<Protected><InvoicesPage /></Protected>} />
      <Route path="/payment/return" element={<Protected><PaymentReturnPage /></Protected>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/admin" element={<Protected roles={['administrador']}><DashboardPage /></Protected>} />
      <Route path="/vendedor" element={<Protected roles={['vendedor', 'administrador']}><DashboardPage /></Protected>} />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/catalog' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
