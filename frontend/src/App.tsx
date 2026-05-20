import { Navigate, Route, Routes } from 'react-router-dom'
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

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/catalog" replace /> : <LoginPage />} />
      <Route path="/auth/2fa" element={<TwoFactorPage />} />

      <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
      <Route path="/catalog/:sku" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/orders/:id/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
      <Route path="/payment/return" element={<ProtectedRoute><PaymentReturnPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['administrador']}><DashboardPage /></ProtectedRoute>} />
      <Route path="/vendedor" element={<ProtectedRoute roles={['vendedor', 'administrador']}><DashboardPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/catalog' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
