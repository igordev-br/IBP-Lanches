import React, { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { Product, Category, OptionGroup, AppSettings, Table } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import { ProductModal } from './ProductModal.tsx';
import { CartDrawer } from './CartDrawer.tsx';
import { OrderTrackingModal } from './OrderTrackingModal.tsx';
import { TableSelectorModal } from './TableSelectorModal.tsx';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';
import {
  Search,
  Clock,
  Plus,
  ShoppingBag,
  Sparkles,
  MapPin,
  Info,
  Calendar,
} from 'lucide-react';

interface ClientAppProps {
  settings: AppSettings | null;
  categories: Category[];
  products: Product[];
  optionGroups: OptionGroup[];
  tables: Table[];
}

export const ClientApp: React.FC<ClientAppProps> = ({
  settings,
  categories,
  products,
  optionGroups,
  tables,
}) => {
  const { table, items, total, setIsCartOpen, activeOrderId, isTrackingOpen, setIsTrackingOpen, addItem } = useCart();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.available) return false;
      const matchCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.available && p.isFeatured);
  }, [products]);

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 pb-28">
      
      {/* Hero & Church Greetings Banner */}
      <section className="bg-linear-to-b from-orange-600 to-amber-600 text-white pt-8 pb-10 px-4 sm:px-6 relative overflow-hidden shadow-md">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          
          {/* Top Info Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md text-xs font-black border border-white/30 cursor-pointer hover:bg-black/45 active:scale-95 transition shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{table ? `Você está na Mesa ${table.number} • Alterar` : 'Toque aqui para escolher sua Mesa'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                settings?.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {settings?.isOpen ? 'Lanchonete Aberta' : 'Fechada no Momento'}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
              {settings?.lanchoneteName || 'IBPLanches'}
            </h1>
            <p className="text-orange-100 text-xs sm:text-sm font-medium max-w-xl leading-relaxed">
              {settings?.welcomeMessage || 'Lanchonete e comunhão da igreja. Peça pelo celular e receba na sua mesa com agilidade!'}
            </p>
          </div>

          {/* Opening Hours & Instructions Bar */}
          <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] text-amber-100/90">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{settings?.openingHours || 'Domingos após o culto (19h30 - 22h00)'}</span>
            </div>
            {settings?.contactPhone && (
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Atendimento: {settings.contactPhone}</span>
              </div>
            )}
          </div>

          {/* Install Banner helper */}
          <div className="pt-2">
            <PWAInstallButton variant="banner" />
          </div>

        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 space-y-6 relative z-20">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por lanche, salgado, bebida, refrigerante..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl shadow-sm border border-stone-200/80 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-stone-800 placeholder-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Categories Horizontal Tabs */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs ${
                selectedCategoryId === 'all'
                  ? 'bg-orange-600 text-white shadow-orange-500/20'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
              }`}
            >
              <span>🔥</span>
              <span>Todos</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-orange-500/20'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/90'
                  }`}
                >
                  <span>{cat.icon || '🍴'}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Section (if 'all' is selected and no search) */}
        {selectedCategoryId === 'all' && !searchQuery && featuredProducts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Destaques da Lanchonete
              </h2>
              <span className="text-xs text-stone-400">Mais pedidos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredProducts.slice(0, 3).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduct(prod)}
                  className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-row sm:flex-col group"
                >
                  <div className="relative w-32 sm:w-full h-32 sm:h-44 bg-stone-100 shrink-0 overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      Destaque
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-sm leading-tight group-hover:text-orange-600 transition">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-sm font-black text-orange-600">
                        {formatCurrency(prod.price)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(prod);
                        }}
                        className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white flex items-center justify-center transition active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Products Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-stone-900">
              {selectedCategoryId === 'all'
                ? 'Cardápio Completo'
                : categories.find((c) => c.id === selectedCategoryId)?.name || 'Produtos'}
            </h2>
            <span className="text-xs text-stone-400">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'opção' : 'opções'}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-8 text-center text-stone-400 space-y-2">
              <p className="font-bold text-stone-600">Nenhum produto encontrado</p>
              <p className="text-xs">Tente buscar por outro termo ou selecione outra categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-xs hover:shadow-md transition cursor-pointer flex gap-3 group relative"
                >
                  {/* Photo */}
                  <div className="relative w-24 h-24 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    {product.estimatedMinutes && (
                      <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {product.estimatedMinutes}m
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm leading-snug group-hover:text-orange-600 transition">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-orange-600">
                        {formatCurrency(product.price)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 border border-orange-200/80 hover:border-orange-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pedir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Sticky Mobile Floating Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-stone-800 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-xs">
                {totalCartCount}
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-stone-200">
                  {table ? `Mesa ${table.number}` : 'Mesa a definir'}
                </div>
                <div className="font-black text-sm text-white">
                  Ver Carrinho ({formatCurrency(total)})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-stone-800/80 px-3 py-1.5 rounded-xl">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </div>
          </button>
        </div>
      )}

      {/* Product Customization Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          optionGroups={optionGroups}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addItem}
        />
      )}

      {/* Cart Drawer Slideover */}
      <CartDrawer
        settings={settings}
        onOpenTableSelector={() => setIsTableModalOpen(true)}
      />

      {/* Order Tracking Modal */}
      {isTrackingOpen && (
        <OrderTrackingModal
          settings={settings}
          onClose={() => setIsTrackingOpen(false)}
          onNewOrder={() => {
            setIsTrackingOpen(false);
            setIsCartOpen(false);
          }}
        />
      )}

      {/* Floating Active Order Tracker pill when modal is minimized */}
      {activeOrderId && !isTrackingOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsTrackingOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs border-2 border-white transition cursor-pointer"
            title="Acompanhar status do pedido"
          >
            <Clock className="w-4 h-4 text-stone-900" />
            <span>Acompanhar Pedido</span>
          </button>
        </div>
      )}

      {/* Table Selector Modal */}
      {isTableModalOpen && (
        <TableSelectorModal
          tables={tables}
          onClose={() => setIsTableModalOpen(false)}
        />
      )}

    </div>
  );
};
