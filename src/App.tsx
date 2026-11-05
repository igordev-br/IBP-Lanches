import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { api } from './services/api.ts';
import { AppSettings, Table, Category, Product, OptionGroup } from './types/index.ts';
import { Navbar } from './components/common/Navbar.tsx';
import { ClientApp } from './components/client/ClientApp.tsx';
import { AdminApp } from './components/admin/AdminApp.tsx';
import { TableSelectorModal } from './components/client/TableSelectorModal.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { RotateCw, WifiOff } from 'lucide-react';

function MainApp() {
  const [currentView, setCurrentView] = useState<'client' | 'admin'>('client');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor network status for PWA offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [configRes, menuRes, tablesRes] = await Promise.all([
        api.getPublicConfig(),
        api.getPublicMenu(),
        api.getTables().catch(() => []),
      ]);

      setSettings(configRes.settings);
      setCategories(menuRes.categories);
      setProducts(menuRes.products);
      setOptionGroups(menuRes.optionGroups);
      if (tablesRes && tablesRes.length > 0) {
        setTables(tablesRes);
      } else {
        setTables(configRes.tables);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl mb-4 animate-bounce">
          <span className="text-white font-black text-2xl">IBP</span>
        </div>
        <h2 className="text-lg font-black text-stone-900 tracking-tight">IBPLanches</h2>
        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-medium">
          <RotateCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
          Carregando cardápio da lanchonete...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-orange-500 selection:text-white">
      
      {/* Offline Toast if network drops */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Você está offline. Os pedidos só serão enviados quando a conexão retornar.</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        settings={settings}
        availableTables={tables}
        onOpenTableSelector={() => setIsTableModalOpen(true)}
      />

      {/* View Switcher */}
      {currentView === 'client' ? (
        <ClientApp
          settings={settings}
          categories={categories}
          products={products}
          optionGroups={optionGroups}
          tables={tables}
        />
      ) : (
        <AdminApp
          settings={settings}
          tables={tables}
          categories={categories}
          products={products}
          optionGroups={optionGroups}
          onRefreshData={loadInitialData}
          onBackToClient={() => setCurrentView('client')}
        />
      )}

      {/* Global Table Selector Modal */}
      {isTableModalOpen && (
        <TableSelectorModal
          tables={tables}
          onClose={() => setIsTableModalOpen(false)}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
