import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { formatCurrency } from '../../utils/formatters.ts';
import { soundManager } from '../../utils/audio.ts';
import { api } from '../../services/api.ts';
import confetti from 'canvas-confetti';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MapPin,
  QrCode,
  Banknote,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { AppSettings } from '../../types/index.ts';

interface CartDrawerProps {
  settings: AppSettings | null;
  onOpenTableSelector: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ settings, onOpenTableSelector }) => {
  const {
    items,
    table,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    total,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod,
    cashChangeFor,
    setCashChangeFor,
    setActiveOrder,
    isCartOpen,
    setIsCartOpen,
    setIsTrackingOpen,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [needChange, setNeedChange] = useState(false);

  const handleCopyPix = () => {
    if (settings?.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleSendOrder = async () => {
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Seu carrinho está vazio.');
      return;
    }

    if (settings && settings.isOpen === false) {
      setErrorMessage('A lanchonete está fechada para novos pedidos no momento.');
      return;
    }

    if (!table) {
      setErrorMessage('Por favor, identifique a sua mesa antes de enviar o pedido.');
      return;
    }

    if (paymentMethod === 'dinheiro' && needChange) {
      const changeVal = parseFloat(cashChangeFor.replace(',', '.'));
      if (isNaN(changeVal) || changeVal <= total) {
        setErrorMessage(`O valor para troco deve ser maior que o total do pedido (${formatCurrency(total)}).`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Map items for API payload
      const payloadItems = items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        selectedOptions: it.selectedOptions.map((o) => ({
          groupId: o.groupId,
          optionId: o.optionId,
        })),
        notes: it.notes,
      }));

      const newOrder = await api.createOrder({
        tableId: table.id,
        tableNumber: table.number,
        customerName: customerName && typeof customerName === 'string' ? customerName.trim() || undefined : undefined,
        customerPhone: customerPhone && typeof customerPhone === 'string' ? customerPhone.trim() || undefined : undefined,
        items: payloadItems,
        paymentMethod,
        cashChangeFor: needChange && cashChangeFor ? parseFloat(String(cashChangeFor).replace(',', '.')) : undefined,
      });

      // Success feedback
      soundManager.playSuccessChime();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        console.warn('Confetti error', e);
      }

      // Save order tracking info
      setActiveOrder(newOrder.id, newOrder.clientToken);
      clearCart();
      setIsCartOpen(false);
      setIsTrackingOpen(true);
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      setErrorMessage(err.message || 'Falha ao enviar o pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleClearCartPrompt = () => {
    if (confirm('Deseja cancelar e esvaziar todo o pedido atual?')) {
      clearCart();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end touch-manipulation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsCartOpen(false);
        }
      }}
    >
      <div
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-stone-900">Seu Pedido</h2>
            <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearCartPrompt}
                className="text-[11px] font-bold text-stone-500 hover:text-rose-600 transition px-2 py-1 rounded-lg hover:bg-stone-100"
                title="Esvaziar carrinho e cancelar pedido"
              >
                Limpar Carrinho
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCartOpen(false);
              }}
              className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600 transition active:scale-95"
              title="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Notice & Selector */}
        <div
          onClick={onOpenTableSelector}
          className="p-3 bg-orange-50 hover:bg-orange-100 border-b border-orange-200/80 flex items-center justify-between cursor-pointer transition active:scale-98"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <div className="text-xs">
              <span className="text-stone-500">Mesa de atendimento: </span>
              <strong className="text-stone-900">
                {table ? `Mesa ${table.number} (${table.name})` : 'Toque para escolher sua Mesa'}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTableSelector();
            }}
            className="text-xs font-black text-orange-800 bg-orange-200/70 hover:bg-orange-200 px-2.5 py-1 rounded-lg shrink-0 ml-2"
          >
            {table ? 'Alterar' : 'Escolher'}
          </button>
        </div>

        {/* Scrollable Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <X className="w-8 h-8 text-stone-300" />
              </div>
              <p className="font-bold text-stone-600">Seu carrinho está vazio</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Navegue pelo cardápio e selecione produtos gostosos para adicionar ao pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs hover:border-stone-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 leading-tight">
                        {item.productName}
                      </h4>
                      <span className="text-xs text-stone-500 font-medium">
                        {formatCurrency(item.unitPrice)} un
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selected Options */}
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="mt-2 text-xs text-stone-600 space-y-0.5 pl-2 border-l-2 border-orange-200">
                      {item.selectedOptions.map((opt, optIdx) => (
                        <div key={optIdx} className="flex justify-between text-[11px]">
                          <span>• {opt.optionName}</span>
                          {opt.price > 0 && (
                            <span className="font-semibold text-stone-700">+{formatCurrency(opt.price)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Item Notes */}
                  {item.notes && (
                    <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-md italic">
                      Obs: {item.notes}
                    </div>
                  )}

                  {/* Quantity and Subtotal */}
                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:bg-white transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold px-1 text-stone-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-stone-600 hover:bg-white transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-bold text-sm text-stone-900">
                      {formatCurrency(item.totalItemPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer identification & Payment Options (only if items present) */}
          {items.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-stone-200">
              
              {/* Customer Info (Optional) */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2.5">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Identificação (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome / apelido"
                    className="text-xs p-2 rounded-xl border border-stone-200 bg-white focus:border-orange-500 outline-none"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp / Celular"
                    className="text-xs p-2 rounded-xl border border-stone-200 bg-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Forma de Pagamento
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                      paymentMethod === 'pix'
                        ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-xs ring-1 ring-teal-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-1 text-teal-600" />
                    <span>Pix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('dinheiro')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                      paymentMethod === 'dinheiro'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                    <span>Dinheiro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao_maquininha')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition ${
                      paymentMethod === 'cartao_maquininha'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                    <span>Cartão</span>
                  </button>
                </div>

                {/* Pix Details */}
                {paymentMethod === 'pix' && (
                  <div className="bg-white p-3 rounded-xl border border-teal-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-600">Chave Pix da Igreja:</span>
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {settings?.pixKeyType || 'E-mail'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 bg-stone-50 rounded-lg border border-stone-200">
                      <span className="font-mono text-xs text-stone-800 truncate select-all">
                        {settings?.pixKey || 'financeiro@ibplanches.org.br'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="flex items-center gap-1 text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded-md transition shrink-0 active:scale-95"
                      >
                        {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPix ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="text-[11px] text-stone-500 leading-tight">
                      Favorecido: <strong className="text-stone-700">{settings?.pixReceiverName || 'Lanchonete da Igreja'}</strong> ({settings?.pixBankName || 'Sicredi'})
                    </div>
                    <div className="text-[10px] text-teal-800 bg-teal-50 p-2 rounded-lg leading-tight">
                      Após enviar o pedido, você poderá anexar a foto do comprovante do Pix para agilizar sua entrega!
                    </div>
                  </div>
                )}

                {/* Dinheiro Details */}
                {paymentMethod === 'dinheiro' && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-2.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={needChange}
                        onChange={(e) => setNeedChange(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-stone-800">Precisa de troco?</span>
                    </label>

                    {needChange && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-600">Troco para quanto?</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-stone-400 font-bold text-xs">R$</span>
                          <input
                            type="text"
                            value={cashChangeFor}
                            onChange={(e) => setCashChangeFor(e.target.value)}
                            placeholder="50,00"
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:border-emerald-500 outline-none font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cartão Details */}
                {paymentMethod === 'cartao_maquininha' && (
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
                    Pagamento com cartão de débito ou crédito na maquininha. O atendente levará a máquina até a sua mesa ou você pode pagar no balcão.
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Summary & Submit */}
        {items.length > 0 && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
            {settings && settings.isOpen === false && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>A lanchonete está fechada para novos pedidos no momento. O cardápio permanece visível para consulta.</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-stone-900 pt-1 border-t border-stone-200">
                <span>Total a Pagar</span>
                <span className="text-orange-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={settings?.isOpen === false ? undefined : (!table ? onOpenTableSelector : handleSendOrder)}
              disabled={isSubmitting || settings?.isOpen === false}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 active:scale-98 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              {settings?.isOpen === false ? (
                <span>Lanchonete Fechada para Novos Pedidos</span>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Pedido ao Caixa...</span>
                </>
              ) : !table ? (
                <span className="flex items-center gap-1.5 animate-pulse">
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <span>Toque Aqui para Escolher a Mesa</span>
                </span>
              ) : (
                <>
                  <span>Enviar Pedido (Mesa {table.number})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="w-full bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-700 font-bold py-2.5 rounded-xl text-xs transition text-center"
            >
              Continuar Comprando / Fechar Carrinho
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
