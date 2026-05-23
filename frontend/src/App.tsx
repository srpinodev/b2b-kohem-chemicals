import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import CatalogPage from './pages/catalog/CatalogPage'
import ProductDetailPage from './pages/catalog/ProductDetailPage'
import LoginPage from './pages/auth/LoginPage'
import TwoFactorPage from './pages/auth/TwoFactorPage'
import TwoFactorSetupPage from './pages/auth/TwoFactorSetupPage'
import InvoicesPage from './pages/invoices/InvoicesPage'
import CartPage from './pages/orders/CartPage'
import CheckoutPage from './pages/orders/CheckoutPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'
import OrdersPage from './pages/orders/OrdersPage'
import PaymentReturnPage from './pages/orders/PaymentReturnPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminProductFormPage from './pages/admin/AdminProductFormPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
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
      <Route path="/auth/2fa-setup" element={<TwoFactorSetupPage />} />

      <Route path="/catalog" element={<Protected><CatalogPage /></Protected>} />
      <Route path="/catalog/:sku" element={<Protected><ProductDetailPage /></Protected>} />
      <Route path="/cart" element={<Protected><CartPage /></Protected>} />
      <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
      <Route path="/orders/:id" element={<Protected><OrderDetailPage /></Protected>} />
      <Route path="/orders/:id/checkout" element={<Protected><CheckoutPage /></Protected>} />
      <Route path="/invoices" element={<Protected><InvoicesPage /></Protected>} />
      <Route path="/payment/return" element={<Protected><PaymentReturnPage /></Protected>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />

      {/* Admin & Vendedor: gestión de productos */}
      <Route path="/admin" element={<Protected roles={['administrador', 'vendedor']}><DashboardPage /></Protected>} />
      <Route path="/admin/products" element={<Protected roles={['administrador', 'vendedor']}><AdminProductsPage /></Protected>} />
      <Route path="/admin/products/new" element={<Protected roles={['administrador', 'vendedor']}><AdminProductFormPage /></Protected>} />
      <Route path="/admin/products/:sku/edit" element={<Protected roles={['administrador', 'vendedor']}><AdminProductFormPage /></Protected>} />

      {/* Admin solo: gestión de usuarios */}
      <Route path="/admin/users" element={<Protected roles={['administrador']}><AdminUsersPage /></Protected>} />

      <Route path="/vendedor" element={<Protected roles={['vendedor', 'administrador']}><DashboardPage /></Protected>} />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/catalog' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
