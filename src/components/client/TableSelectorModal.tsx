import React, { useState, useEffect } from 'react';
import { Table } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';
import { api } from '../../services/api.ts';
import { X, MapPin, Check, Search, Hash } from 'lucide-react';

interface TableSelectorModalProps {
  tables: Table[];
  onClose: () => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({ tables: propTables, onClose }) => {
  const { table, setTable } = useCart();
  const [tablesList, setTablesList] = useState<Table[]>(propTables || []);
  const [search, setSearch] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // If propTables is empty, fetch public config directly to guarantee tables are always available
  useEffect(() => {
    if (!propTables || propTables.length === 0) {
      setLoading(true);
      api.getPublicConfig()
        .then((res) => {
          if (res.tables && res.tables.length > 0) {
            setTablesList(res.tables);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTablesList(propTables);
    }
  }, [propTables]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelect = (t: Table) => {
    setTable({
      id: t.id,
      number: t.number,
      name: t.name,
      token: t.token,
    });
    onClose();
  };

  const handleSelectByNumber = (numStr: string) => {
    const formatted = numStr.padStart(2, '0');
    const found = tablesList.find((t) => t.number === formatted || t.number === numStr);
    if (found) {
      handleSelect(found);
    } else {
      // Allow selecting custom table number
      setTable({
        id: `tbl-${formatted}`,
        number: formatted,
        name: `Mesa ${formatted}`,
        token: `table_${formatted}`,
      });
      onClose();
    }
  };

  const activeTables = tablesList.filter((t) => t.active !== false);

  const filteredTables = activeTables.filter((t) => {
    if (!search.trim()) return true;
    return (
      t.number.includes(search) ||
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 touch-manipulation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in slide-in-from-bottom-6 sm:fade-in duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base leading-tight">
                Em qual mesa você está?
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Toque no número da sua mesa ou digite abaixo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition active:scale-95"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Number Tap Grid for Mobile (e.g. 1 to 8) */}
        <div className="py-3 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-orange-600" />
            <span>Seleção Rápida de Mesa:</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['01', '02', '03', '04', '05', '06', '07', '08'].map((num) => {
              const isSelected = table?.number === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectByNumber(num)}
                  className={`py-3 rounded-2xl font-black text-sm flex flex-col items-center justify-center transition active:scale-90 border shadow-xs ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-700 ring-2 ring-orange-300'
                      : 'bg-stone-50 hover:bg-orange-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <span className="text-base font-extrabold">{num}</span>
                  <span className={`text-[9px] font-bold ${isSelected ? 'text-orange-100' : 'text-stone-400'}`}>
                    Mesa
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Input or Search */}
        <div className="pt-2 pb-1 shrink-0 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ou digitar número da mesa..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-orange-500 outline-none font-bold"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => handleSelectByNumber(search)}
                className="bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold shrink-0 hover:bg-orange-700 active:scale-95 transition"
              >
                Confirmar
              </button>
            )}
          </div>
        </div>

        {/* Full Scrollable List */}
        <div className="mt-2 overflow-y-auto space-y-2 flex-1 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Carregando mesas cadastradas...
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-stone-500 font-medium">Nenhuma mesa encontrada com esse nome ou número.</p>
              {search && (
                <button
                  type="button"
                  onClick={() => handleSelectByNumber(search)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  Usar Mesa "{search}"
                </button>
              )}
            </div>
          ) : (
            filteredTables.map((t) => {
              const isSelected = table?.id === t.id || table?.number === t.number;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t)}
                  className={`w-full p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between text-left active:scale-98 ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-200'
                      : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl font-black text-base flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {t.number}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">{t.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-stone-400'}`}>
                        Mesa {t.number} • Autoatendimento por QR Code
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-center text-stone-500 font-medium shrink-0">
          Você também pode escanear o QR Code impresso no display da sua mesa.
        </div>

      </div>
    </div>
  );
};
