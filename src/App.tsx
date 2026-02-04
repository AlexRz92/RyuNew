import { useEffect, useState } from 'react';
import { supabase, Category, Product, Inventory } from './lib/supabase';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { Cart, CartItem } from './components/Cart';
import { CheckoutModal } from './components/CheckoutModal';
import { CheckoutTypeModal } from './components/CheckoutTypeModal';
import { LoginModal } from './components/LoginModal';
import { TrackOrderModal } from './components/TrackOrderModal';
import { FloatingButtons } from './components/FloatingButtons';
import { FeaturedProducts } from './components/FeaturedProducts';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutTypeOpen, setIsCheckoutTypeOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const productsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const [categoriesRes, productsRes, featuredRes, inventoryRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
        supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(10),
        supabase.from('inventory').select('*'),
      ]);

      if (categoriesRes.error) {
        console.error('Categories error:', categoriesRes.error);
      } else if (categoriesRes.data) {
        console.log('Categories loaded:', categoriesRes.data.length);
        setCategories(categoriesRes.data);
      }

      if (productsRes.error) {
        console.error('Products error:', productsRes.error);
      } else if (productsRes.data) {
        console.log('Products loaded:', productsRes.data.length);
        setProducts(productsRes.data);
      }

      if (inventoryRes.error) {
        console.error('Inventory error:', inventoryRes.error);
      } else if (inventoryRes.data) {
        console.log('Inventory loaded:', inventoryRes.data.length);
        setInventory(inventoryRes.data);
      }

      if (featuredRes.error) {
        console.error('Featured error:', featuredRes.error);
      } else if (featuredRes.data && featuredRes.data.length > 0) {
        setFeaturedProducts(featuredRes.data);
      } else if (productsRes.data) {
        setFeaturedProducts(productsRes.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products
    .filter((p) => selectedCategory ? p.category_id === selectedCategory : true)
    .filter((p) => searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById('products-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    document.getElementById('products-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    document.getElementById('products-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutTypeOpen(true);
  };

  const handleGuestCheckout = () => {
    setIsCheckoutTypeOpen(false);
    setIsGuestCheckout(true);
    setIsCheckoutOpen(true);
  };

  const handleLoginCheckout = () => {
    setIsCheckoutTypeOpen(false);
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    setIsGuestCheckout(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsGuestCheckout(false);
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando productos...</p>
        </div>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || '';
  };

  const mainListingTitle = selectedCategory
    ? `Productos en ${getCategoryName(selectedCategory)}`
    : 'Todos los productos';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Header onSearch={handleSearchChange} searchQuery={searchQuery} />

      <main className="container mx-auto px-4 py-8 pb-32 max-w-[1800px]">
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        )}

        {!selectedCategory && featuredProducts.length > 0 && (
          <FeaturedProducts
            products={featuredProducts}
            inventory={inventory}
            onProductClick={setSelectedProduct}
          />
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No hay productos disponibles</p>
          </div>
        ) : (
          <>
            <div id="products-listing" className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <h2 className="text-2xl font-bold text-white px-6">{mainListingTitle}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    inventory={inventory.find((inv) => inv.product_id === product.id)}
                    onAddToCart={addToCart}
                    onProductClick={setSelectedProduct}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-6 mt-12">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex gap-2 flex-wrap justify-center">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 7) {
                          pageNum = i + 1;
                        } else if (currentPage <= 4) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          pageNum = totalPages - 6 + i;
                        } else {
                          pageNum = currentPage - 3 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3.5 py-2 rounded-lg font-semibold transition-all ${
                              currentPage === pageNum
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30 border border-orange-500/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10"
                      title="Página siguiente"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-slate-400 text-sm">
                    Página <span className="text-amber-400 font-semibold">{currentPage}</span> de <span className="text-amber-400 font-semibold">{totalPages}</span>
                  </div>

                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                </div>
              )}
            </div>
          </>
        )}

        {selectedCategory && featuredProducts.length > 0 && (
          <FeaturedProducts
            products={featuredProducts}
            inventory={inventory}
            onProductClick={setSelectedProduct}
          />
        )}
      </main>

      <FloatingButtons
        cartItemsCount={totalCartItems}
        onCartClick={() => setIsCartOpen(true)}
        onTrackClick={() => setIsTrackOrderOpen(true)}
      />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
      />

      <CheckoutTypeModal
        isOpen={isCheckoutTypeOpen}
        onClose={() => setIsCheckoutTypeOpen(false)}
        onGuestCheckout={handleGuestCheckout}
        onLoginCheckout={handleLoginCheckout}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onSuccess={handleCheckoutSuccess}
        isGuest={isGuestCheckout}
      />

      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      <ProductDetailModal
        product={selectedProduct}
        inventory={inventory.find((inv) => inv.product_id === selectedProduct?.id)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}

export default App;
