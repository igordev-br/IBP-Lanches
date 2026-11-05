import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { AppSettings, Table, Category, Product, OptionGroup } from '../../types/index.ts';
import { DashboardTab } from './DashboardTab.tsx';
import { LiveOrdersTab } from './LiveOrdersTab.tsx';
import { KitchenTab } from './KitchenTab.tsx';
import { ProductsTab } from './ProductsTab.tsx';
import { CategoriesTab } from './CategoriesTab.tsx';
import { TablesTab } from './TablesTab.tsx';
import { PaymentsTab } from './PaymentsTab.tsx';
import { InventoryTab } from './InventoryTab.tsx';
import { ReportsTab } from './ReportsTab.tsx';
import { UsersTab } from './UsersTab.tsx';
import { SettingsTab } from './SettingsTab.tsx';
import { AdminLoginModal } from './AdminLoginModal.tsx';
import {
  LayoutDashboard,
  BellRing,
  ChefHat,
  UtensilsCrossed,
  Layers,
  QrCode,
  Receipt,
  Package,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface AdminAppProps {
  settings: AppSettings | null;
  tables: Table[];
  categories: Category[];
  products: Product[];
  optionGroups: OptionGroup[];
  onRefreshData: () => void;
  onBackToClient: () => void;
}

type AdminMenuKey =
  | 'dashboard'
  | 'live_orders'
  | 'kitchen'
  | 'products'
  | 'categories'
  | 'tables'
  | 'payments'
  | 'inventory'
  | 'reports'
  | 'users'
  | 'settings';

export const AdminApp: React.FC<AdminAppProps> = ({
  settings,
  tables,
  categories,
  products,
  optionGroups,
  onRefreshData,
  onBackToClient,
}) => {
  const { user, logout, hasRole } = useAuth();
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('dashboard');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // If not authenticated, prompt login modal
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <AdminLoginModal
          onClose={onBackToClient}
          onSuccess={() => onRefreshData()}
        />
      </div>
    );
  }

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'gerente'] },
    { key: 'live_orders', label: 'Pedidos em Tempo Real', icon: BellRing, roles: ['admin', 'gerente', 'atendente', 'caixa'] },
    { key: 'kitchen', label: 'Cozinha (KDS)', icon: ChefHat, roles: ['admin', 'gerente', 'cozinha'] },
    { key: 'products', label: 'Cardápio & Produtos', icon: UtensilsCrossed, roles: ['admin', 'gerente'] },
    { key: 'categories', label: 'Categorias & Opcionais', icon: Layers, roles: ['admin', 'gerente'] },
    { key: 'tables', label: 'Mesas & QR Codes', icon: QrCode, roles: ['admin', 'gerente'] },
    { key: 'payments', label: 'Central de Pagamentos', icon: Receipt, roles: ['admin', 'gerente', 'caixa'] },
    { key: 'inventory', label: 'Controle de Estoque', icon: Package, roles: ['admin', 'gerente', 'cozinha'] },
    { key: 'reports', label: 'Relatórios & Caixa', icon: BarChart3, roles: ['admin', 'gerente', 'caixa'] },
    { key: 'users', label: 'Usuários & Permissões', icon: Users, roles: ['admin'] },
    { key: 'settings', label: 'Configurações', icon: Settings, roles: ['admin', 'gerente'] },
  ];

  const visibleMenuItems = menuItems.filter((item) => hasRole(item.roles as any));

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 shrink-0 flex flex-col justify-between border-r border-stone-800">
        
        <div>
          {/* Top Brand */}
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-xs">
                IBP
              </div>
              <div>
                <div className="font-extrabold text-sm text-white leading-tight">IBPLanches Admin</div>
                <div className="text-[10px] text-orange-400 font-semibold">{settings?.churchName || 'Igreja'}</div>
              </div>
            </div>

            <button
              onClick={onBackToClient}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 md:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Current User Badge */}
          <div className="p-3 bg-stone-800/60 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <div>
                <div className="font-bold text-white truncate max-w-[130px]">{user.name}</div>
                <div className="text-[10px] uppercase font-bold text-stone-400">{user.role}</div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="text-stone-400 hover:text-rose-400 p-1"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-2 space-y-1 overflow-x-auto md:overflow-y-auto flex md:flex-col scrollbar-none">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveMenu(item.key as AdminMenuKey)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar Actions */}
        <div className="p-3 border-t border-stone-800 hidden md:block space-y-2">
          <button
            onClick={onBackToClient}
            className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 py-2.5 rounded-xl text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Cardápio</span>
          </button>
        </div>

      </aside>

      {/* Main Administrative Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {activeMenu === 'dashboard' && <DashboardTab />}
        {activeMenu === 'live_orders' && <LiveOrdersTab settings={settings} />}
        {activeMenu === 'kitchen' && <KitchenTab />}
        {activeMenu === 'products' && (
          <ProductsTab
            products={products}
            categories={categories}
            optionGroups={optionGroups}
            onRefresh={onRefreshData}
          />
        )}
        {activeMenu === 'categories' && (
          <CategoriesTab
            categories={categories}
            optionGroups={optionGroups}
            onRefresh={onRefreshData}
          />
        )}
        {activeMenu === 'tables' && (
          <TablesTab
            tables={tables}
            settings={settings}
            onRefresh={onRefreshData}
          />
        )}
        {activeMenu === 'payments' && <PaymentsTab />}
        {activeMenu === 'inventory' && <InventoryTab />}
        {activeMenu === 'reports' && <ReportsTab />}
        {activeMenu === 'users' && <UsersTab />}
        {activeMenu === 'settings' && (
          <SettingsTab
            settings={settings}
            onRefresh={onRefreshData}
          />
        )}
      </main>

    </div>
  );
};
