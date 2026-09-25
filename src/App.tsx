import { useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './hooks/useCart';
import { useCatalog } from './hooks/useCatalog';
import { storeConfig } from './config/store.config';
import type { Product } from './lib/types';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { CheckoutTypeModal } from './components/CheckoutTypeModal';
import { LoginModal } from './components/LoginModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { FloatingButtons } from './components/FloatingButtons';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Profile } from './pages/Profile';
import { Checkout } from './pages/Checkout';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsAdmin } from './pages/admin/ProductsAdmin';
import { InventoryAdmin } from './pages/admin/InventoryAdmin';
import { CategoriesAdmin } from './pages/admin/CategoriesAdmin';
import { OrdersAdmin } from './pages/admin/OrdersAdmin';
import { ShippingAdmin } from './pages/admin/ShippingAdmin';
import { BankAccountsAdmin } from './pages/admin/BankAccountsAdmin';
import { AdminsAdmin } from './pages/admin/AdminsAdmin';

function App() {
  return (
    <div className="min-h-screen bg-bg-subtle overflow-x-hidden">
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/perfil" element={<ProfileRoute />} />
        <Route path="/checkout" element={<CheckoutRoute />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<ProductsAdmin />} />
          <Route path="inventario" element={<InventoryAdmin />} />
          <Route path="categorias" element={<CategoriesAdmin />} />
          <Route path="pedidos" element={<OrdersAdmin />} />
          <Route path="envios" element={<ShippingAdmin />} />
          <Route path="cuentas" element={<BankAccountsAdmin />} />
          <Route path="administradores" element={<AdminsAdmin />} />
        </Route>
      </Routes>
    </div>
  );
}

// El estado del carrito debe compartirse entre rutas. Lo elevamos a un
// contenedor que envuelve las rutas que lo necesitan mediante props.
// Para simplicidad y por ser SPA, cada ruta usa su propio useCart apoyado en
// localStorage (misma fuente de verdad persistida).

function Storefront() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, products, featured, inventory, loading, inventoryFor } = useCatalog();
  const cart = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutTypeOpen, setIsCheckoutTypeOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginFromCheckout, setIsLoginFromCheckout] = useState(false);

  const productsPerPage = storeConfig.productsPerPage;

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products
      .filter((p) => (selectedCategory ? p.category_id === selectedCategory : true))
      .filter((p) =>
        query === ''
          ? true
          : p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      );
  }, [products, selectedCategory, searchQuery]);

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === '') return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('products-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (user) {
      navigate('/checkout');
    } else {
      setIsCheckoutTypeOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    if (isLoginFromCheckout) navigate('/checkout');
    setIsLoginFromCheckout(false);
  };

  const getCategoryName = (categoryId: string) =>
    categories.find((cat) => cat.id === categoryId)?.name || '';

  const mainListingTitle = selectedCategory
    ? `Productos en ${getCategoryName(selectedCategory)}`
    : storeConfig.content.catalogTitle;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <p className="text-content-muted">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        onSearch={handleSearchChange}
        searchQuery={searchQuery}
        onLoginClick={() => {
          setIsLoginFromCheckout(false);
          setIsLoginOpen(true);
        }}
        suggestions={searchSuggestions}
        onSuggestionClick={setSelectedProduct}
      />

      <main className="container mx-auto px-4 py-8 pb-32 max-w-[1800px] overflow-x-hidden">
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        )}

        {!selectedCategory && featured.length > 0 && (
          <FeaturedProducts
            products={featured}
            inventory={inventory}
            onProductClick={setSelectedProduct}
            onAddToCart={cart.addItem}
          />
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-content-muted text-lg">{storeConfig.content.emptyCatalog}</p>
          </div>
        ) : (
          <div id="products-listing" className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
              <h2 className="text-2xl font-bold text-content px-6">{mainListingTitle}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6 mb-8">
              {currentProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inventory={inventoryFor(product.id)}
                  onAddToCart={cart.addItem}
                  onProductClick={setSelectedProduct}
                  priority={index < 5}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        {selectedCategory && featured.length > 0 && (
          <FeaturedProducts
            products={featured}
            inventory={inventory}
            onProductClick={setSelectedProduct}
          />
        )}
      </main>

      <FloatingButtons
        cartItemsCount={cart.totalItems}
        onCartClick={() => setIsCartOpen(true)}
        onTrackClick={() => setIsTrackOrderOpen(true)}
      />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart.items}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onCheckout={handleCheckout}
      />

      <CheckoutTypeModal
        isOpen={isCheckoutTypeOpen}
        onClose={() => setIsCheckoutTypeOpen(false)}
        onGuestCheckout={() => {
          setIsCheckoutTypeOpen(false);
          navigate('/checkout');
        }}
        onLoginCheckout={() => {
          setIsCheckoutTypeOpen(false);
          setIsLoginFromCheckout(true);
          setIsLoginOpen(true);
        }}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <TrackOrderModal isOpen={isTrackOrderOpen} onClose={() => setIsTrackOrderOpen(false)} />

      <ProductDetailModal
        product={selectedProduct}
        inventory={selectedProduct ? inventoryFor(selectedProduct.id) : undefined}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={cart.addItem}
      />
    </>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex flex-col items-center gap-6 mt-12">
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2.5 bg-surface hover:bg-surface-hover text-content-soft rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-line hover:border-brand/40"
          title="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2 flex-wrap justify-center">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) pageNum = i + 1;
            else if (currentPage <= 4) pageNum = i + 1;
            else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
            else pageNum = currentPage - 3 + i;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
                  currentPage === pageNum
                    ? 'bg-brand text-brand-contrast shadow-card border border-brand'
                    : 'bg-surface hover:bg-surface-hover text-content-soft border border-line hover:border-brand/40'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2.5 bg-surface hover:bg-surface-hover text-content-soft rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-line hover:border-brand/40"
          title="Página siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-content-muted text-sm">
        Página <span className="text-brand font-semibold">{currentPage}</span> de{' '}
        <span className="text-brand font-semibold">{totalPages}</span>
      </div>

      <div className="h-px w-24 bg-gradient-to-r from-transparent via-line to-transparent" />
    </div>
  );
}

function ProfileRoute() {
  const cart = useCart();
  return <Profile cartItemsCount={cart.totalItems} onReplaceCart={cart.replaceCart} />;
}

function CheckoutRoute() {
  const cart = useCart();
  return <Checkout items={cart.items} onClearCart={cart.clearCart} />;
}

export default App;
