import React, { useState, useMemo, useEffect } from 'react';
import { Product, OptionGroup, OrderItemOption } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import { X, Clock, Plus, Minus, Check, AlertCircle, ArrowLeft } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  optionGroups: OptionGroup[];
  onClose: () => void;
  onAddToCart: (item: {
    productId: string;
    productName: string;
    productCode: string;
    unitPrice: number;
    quantity: number;
    selectedOptions: OrderItemOption[];
    notes?: string;
  }) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  optionGroups,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Relevant option groups for this product
  const relevantGroups = useMemo(() => {
    return optionGroups.filter((g) => product.optionGroupIds?.includes(g.id));
  }, [optionGroups, product]);

  // Handle single choice (radio style) or multi choice (checkbox style)
  const handleSelectOption = (groupId: string, optionId: string, maxChoices: number) => {
    setErrorMessage(null);
    setSelectedOptionsMap((prev) => {
      const current = prev[groupId] || [];
      if (maxChoices === 1) {
        return { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
        } else {
          if (current.length >= maxChoices) {
            setErrorMessage(`Máximo de ${maxChoices} opções permitidas neste grupo.`);
            return prev;
          }
          return { ...prev, [groupId]: [...current, optionId] };
        }
      }
    });
  };

  // Build the list of selected options with their prices
  const selectedOptionsList: OrderItemOption[] = useMemo(() => {
    const list: OrderItemOption[] = [];
    relevantGroups.forEach((group) => {
      const selectedIds = selectedOptionsMap[group.id] || [];
      selectedIds.forEach((optId) => {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          list.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            price: opt.price,
          });
        }
      });
    });
    return list;
  }, [relevantGroups, selectedOptionsMap]);

  // Options price addition
  const optionsTotal = selectedOptionsList.reduce((sum, opt) => sum + opt.price, 0);
  const unitPriceWithOptions = product.price + optionsTotal;
  const grandTotal = unitPriceWithOptions * quantity;

  // Validate required groups
  const handleAdd = () => {
    for (const group of relevantGroups) {
      const selected = selectedOptionsMap[group.id] || [];
      if (group.required && selected.length < (group.minChoices || 1)) {
        setErrorMessage(`Por favor, selecione ao menos uma opção em: "${group.name}".`);
        return;
      }
    }

    onAddToCart({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      unitPrice: product.price,
      quantity,
      selectedOptions: selectedOptionsList,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto touch-manipulation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 sm:fade-in duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Floating Close Button (always accessible at top right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white active:scale-90 text-stone-800 flex items-center justify-center shadow-lg backdrop-blur-xs border border-stone-200 transition"
          aria-label="Fechar e voltar ao cardápio"
          title="Fechar"
        >
          <X className="w-5 h-5 text-stone-900" />
        </button>

        {/* Product Image Header */}
        <div className="relative h-52 sm:h-60 bg-stone-100 shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />

          <div className="absolute bottom-4 left-4 right-16 text-white">
            <div className="flex items-center gap-2 mb-1">
              {product.estimatedMinutes && (
                <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-500 text-stone-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  <Clock className="w-3 h-3" />
                  ~{product.estimatedMinutes} min
                </span>
              )}
              {product.code && (
                <span className="text-[11px] font-bold bg-black/40 text-stone-200 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {product.code}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black drop-shadow-sm leading-tight">
              {product.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Description */}
          <p className="text-sm text-stone-600 leading-relaxed">
            {product.description}
          </p>

          {/* Option Groups */}
          {relevantGroups.map((group) => {
            const isSingle = group.maxChoices === 1;
            const currentSelected = selectedOptionsMap[group.id] || [];

            return (
              <div key={group.id} className="border border-stone-200/90 rounded-2xl p-4 bg-stone-50/70">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{group.name}</span>
                    {group.required ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        Obrigatório
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-stone-500">
                        Opcional (até {group.maxChoices})
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  {group.options.map((opt) => {
                    const isSelected = currentSelected.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(group.id, opt.id, group.maxChoices)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition text-sm active:scale-98 ${
                          isSelected
                            ? 'bg-orange-50/90 border-orange-500 text-stone-900 font-bold shadow-xs'
                            : 'bg-white border-stone-200/90 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-${isSingle ? 'full' : 'md'} border flex items-center justify-center transition ${
                              isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span>{opt.name}</span>
                        </div>
                        {opt.price > 0 && (
                          <span className="text-xs font-bold text-orange-700 bg-orange-100/60 px-2 py-0.5 rounded-lg">
                            +{formatCurrency(opt.price)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Special Notes Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Observações do produto (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem cebola, maionese à parte, carne bem passada..."
              className="w-full text-sm p-3 rounded-xl border border-stone-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer with Quantity, Cancel & Add Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2">
            
            {/* Quantity selector */}
            <div className="flex items-center bg-white border border-stone-300 rounded-xl p-1 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-stone-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 transition active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Cancel / Voltar ao Cardápio Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-3 py-3 rounded-xl bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-800 font-bold text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer"
              title="Voltar ao Cardápio"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Cardápio</span>
            </button>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-black py-3 px-3 rounded-xl shadow-md transition flex items-center justify-between text-xs sm:text-sm"
            >
              <span>Adicionar</span>
              <span className="font-extrabold bg-orange-700/60 px-2 py-0.5 rounded-lg">
                {formatCurrency(grandTotal)}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
