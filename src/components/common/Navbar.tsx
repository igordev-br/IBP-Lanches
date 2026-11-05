import React from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { formatCurrency } from '../../utils/formatters.ts';
import { ShoppingBag, Clock, ShieldCheck, MapPin, ChevronDown } from 'lucide-react';
import { AppSettings, Table } from '../../types/index.ts';

interface NavbarProps {
  currentView: 'client' | 'admin';
  onViewChange: (view: 'client' | 'admin') => void;
  settings: AppSettings | null;
  availableTables: Table[];
  onOpenTableSelector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  settings,
  availableTables: _availableTables,
  onOpenTableSelector,
}) => {
  const { items, total, table, setIsCartOpen, activeOrderId, setIsTrackingOpen } = useCart();
  const { user } = useAuth();

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Logo & Church Branding */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => onViewChange('client')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-600 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <img
                src={settings?.logoUrl || '/icon.svg'}
                alt="IBPLanches"
                className="w-full h-full object-contain rounded-lg drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight leading-none">
                  {settings?.lanchoneteName || 'IBPLanches'}
                </span>
                {settings?.isOpen ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Aberto
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    Fechado
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-[11px] font-medium text-stone-700 truncate max-w-[140px] sm:max-w-[200px]">
                {settings?.churchName || 'Igreja Batista Pioneira'}
              </span>
            </div>
          </div>

          {/* Center / Mesa Button (Client Mode) */}
          {currentView === 'client' && (
            <div className="flex items-center justify-center shrink-0">
              <button
                type="button"
                onClick={onOpenTableSelector}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-orange-100/80 hover:bg-orange-200 active:scale-95 text-orange-950 text-xs font-bold border border-orange-300/80 transition shadow-xs"
                title="Escolher ou alterar mesa"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="truncate max-w-[85px] sm:max-w-[130px]">
                  {table ? `Mesa ${table.number}` : 'Mesa?'}
                </span>
                <ChevronDown className="w-3 h-3 text-orange-600 shrink-0" />
              </button>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* PWA Install (hidden on ultra-small mobile to prevent crowding) */}
            <div className="hidden md:block">
              <PWAInstallButton />
            </div>

            {/* If Client has an active order, show tracking alert badge */}
            {currentView === 'client' && activeOrderId && (
              <button
                type="button"
                onClick={() => setIsTrackingOpen(true)}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-stone-900 px-2 sm:px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition animate-pulse"
                title="Acompanhar status do pedido ativo"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>#{activeOrderId.replace('PED-', '')}</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            {currentView === 'client' && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                title="Abrir carrinho"
              >
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                {totalItemCount > 0 ? (
                  <>
                    <span className="bg-orange-500 text-white text-[11px] font-extrabold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                      {totalItemCount}
                    </span>
                    <span className="hidden md:inline text-amber-200 font-semibold border-l border-stone-700 pl-2">
                      {formatCurrency(total)}
                    </span>
                  </>
                ) : (
                  <span className="hidden sm:inline text-stone-400 font-normal">Vazio</span>
                )}
              </button>
            )}

            {/* Toggle between Client and Admin */}
            <button
              type="button"
              onClick={() => onViewChange(currentView === 'client' ? 'admin' : 'client')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition border ${
                currentView === 'admin'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-300'
              }`}
              title="Acesso da equipe / administração"
            >
              <ShieldCheck className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">
                {currentView === 'client' ? (user ? 'Painel' : 'Equipe') : 'Cardápio'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
