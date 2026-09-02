import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { ChatBot } from "./components/ChatBot";
import { ScrollToTop } from "./components/ScrollToTop";
import { TermsPage, PrivacyPage, ShippingPage, ReturnsPage } from "./pages/Policies";
import { RequireAdmin } from "./components/RequireAdmin";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Blog } from "./pages/Blog";
import { ProductDetail } from "./pages/ProductDetail";
import { Checkout } from "./pages/Checkout";
import { OrderConfirmed } from "./pages/OrderConfirmed";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminProductForm } from "./pages/admin/AdminProductForm";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminStock } from "./pages/admin/AdminStock";
import { AdminExpenses } from "./pages/admin/AdminExpenses";
import { AdminEarnings } from "./pages/admin/AdminEarnings";
import { AdminRemittances } from "./pages/admin/AdminRemittances";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminShipping } from "./pages/admin/AdminShipping";
import { AdminBanners } from "./pages/admin/AdminBanners";

function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ChatBot />
    </div>
  );
}

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
      <Route path="/shop" element={<StorefrontLayout><Shop /></StorefrontLayout>} />
      <Route path="/about" element={<StorefrontLayout><About /></StorefrontLayout>} />
      <Route path="/blog" element={<StorefrontLayout><Blog /></StorefrontLayout>} />
      <Route path="/contact" element={<StorefrontLayout><Contact /></StorefrontLayout>} />
      <Route path="/terms" element={<StorefrontLayout><TermsPage /></StorefrontLayout>} />
      <Route path="/privacy" element={<StorefrontLayout><PrivacyPage /></StorefrontLayout>} />
      <Route path="/shipping" element={<StorefrontLayout><ShippingPage /></StorefrontLayout>} />
      <Route path="/returns" element={<StorefrontLayout><ReturnsPage /></StorefrontLayout>} />
      <Route path="/product/:slug" element={<StorefrontLayout><ProductDetail /></StorefrontLayout>} />
      {/* The cart lives in the slide-over drawer; old /cart links go to the shop. */}
      <Route path="/cart" element={<Navigate to="/shop" replace />} />
      <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
      <Route
        path="/order-confirmed/:orderNumber"
        element={<StorefrontLayout><OrderConfirmed /></StorefrontLayout>}
      />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="stock" element={<AdminStock />} />
        <Route path="expenses" element={<AdminExpenses />} />
        <Route path="earnings" element={<AdminEarnings />} />
        <Route path="remittances" element={<AdminRemittances />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="banners" element={<AdminBanners />} />
      </Route>
    </Routes>
    </>
  );
}
