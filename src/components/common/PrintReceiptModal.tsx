import React from 'react';
import { Order, AppSettings } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import { Printer, X } from 'lucide-react';

interface PrintReceiptModalProps {
  order: Order | null;
  settings: AppSettings | null;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ order, settings, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 print:hidden">
          <span className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-orange-600" />
            Comanda de Impressão
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 text-stone-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Comanda Card (formatted for 58mm / 80mm thermal receipt or standard paper) */}
        <div className="font-mono text-xs text-stone-900 p-4 border border-dashed border-stone-300 rounded-xl mt-3 space-y-3 bg-stone-50/50 print:border-none print:p-0 print:m-0 print:bg-transparent">
          
          {/* Header */}
          <div className="text-center space-y-0.5 border-b border-stone-300 pb-2">
            <div className="font-black text-sm uppercase">{settings?.lanchoneteName || 'IBPLANCHES'}</div>
            <div className="text-[10px] text-stone-600">{settings?.churchName || 'Igreja Batista'}</div>
            <div className="text-[10px] text-stone-500">{formatDateTime(order.createdAt)}</div>
          </div>

          {/* Order & Table Highlight */}
          <div className="flex justify-between items-center py-1 border-b border-stone-300 font-bold text-sm">
            <span>PEDIDO #{order.orderNumber}</span>
            <span className="bg-stone-900 text-white px-2 py-0.5 rounded text-xs">
              MESA {order.tableNumber}
            </span>
          </div>

          {order.customerName && (
            <div className="text-[11px] text-stone-700">
              Cliente: <strong className="uppercase">{order.customerName}</strong>
              {order.customerPhone && ` (${order.customerPhone})`}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2 py-2 border-b border-stone-300">
            <div className="font-bold text-[10px] uppercase text-stone-500">Itens / Descrição</div>
            {order.items.map((it, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>{it.quantity}x {it.productName}</span>
                  <span>{formatCurrency(it.totalItemPrice)}</span>
                </div>
                {it.selectedOptions && it.selectedOptions.length > 0 && (
                  <div className="text-[10px] text-stone-600 pl-3">
                    {it.selectedOptions.map((o, oIdx) => (
                      <div key={oIdx}>• {o.optionName}</div>
                    ))}
                  </div>
                )}
                {it.notes && (
                  <div className="text-[10px] font-bold text-rose-800 bg-rose-50 p-1 rounded">
                    OBS: {it.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 text-right">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-black border-t border-stone-300 pt-1">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="border-t border-stone-300 pt-2 text-[10px] text-stone-600 space-y-0.5">
            <div>
              Pagamento:{' '}
              <strong className="uppercase">
                {order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'dinheiro' ? 'DINHEIRO' : 'CARTÃO'}
              </strong>
            </div>
            <div>
              Status:{' '}
              <strong className="uppercase">
                {order.paymentStatus.replace('_', ' ')}
              </strong>
            </div>
            {order.cashChangeFor && (
              <div>Troco solicitado para: {formatCurrency(order.cashChangeFor)}</div>
            )}
          </div>

          {/* Footer note */}
          <div className="text-center text-[9px] text-stone-500 pt-2 border-t border-dashed border-stone-300">
            Obrigado pela comunhão! Deus abençoe.
          </div>
        </div>

      </div>
    </div>
  );
};
