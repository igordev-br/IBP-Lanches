import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Order, PrepStatus } from '../../types/index.ts';
import { formatTimeOnly, getElapsedTimeMinutes } from '../../utils/formatters.ts';
import { soundManager } from '../../utils/audio.ts';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Bell,
  Utensils,
  ArrowRight,
} from 'lucide-react';

export const KitchenTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenOrders = async () => {
    try {
      const data = await api.getKitchenOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(() => {
      fetchKitchenOrders();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (orderId: string, nextStatus: PrepStatus) => {
    try {
      const updated = await api.updatePrepStatus(orderId, nextStatus);
      soundManager.playSuccessChime();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)).filter((o) => o.prepStatus !== 'entregue'));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar comanda.');
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="bg-stone-900 text-white p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>KDS Cozinha & Balcão</span>
              <span className="bg-orange-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                {orders.length} comandas ativas
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Tela operacional de produção e entrega rápida aos irmãos na mesa
            </p>
          </div>
        </div>

        <button
          onClick={fetchKitchenOrders}
          className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold transition self-start sm:self-auto"
        >
          <RotateCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Orders Grid */}
      {loading && orders.length === 0 ? (
        <div className="py-20 text-center text-stone-400">
          <RotateCw className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
          <p className="text-xs font-semibold">Carregando comandas de produção...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-stone-200 space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-stone-900">Todas as comandas foram atendidas!</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            A cozinha está livre de pedidos pendentes. Assim que um cliente enviar um pedido por QR Code, ele aparecerá aqui com aviso sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const elapsed = getElapsedTimeMinutes(order.createdAt);
            const isCriticalTime = elapsed >= 18;
            const isWarningTime = elapsed >= 10 && elapsed < 18;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border-2 flex flex-col justify-between overflow-hidden shadow-sm transition hover:shadow-md ${
                  order.prepStatus === 'em_preparacao'
                    ? 'border-orange-500'
                    : order.prepStatus === 'pronto'
                    ? 'border-emerald-500'
                    : 'border-stone-300'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-4 flex items-center justify-between text-white ${
                    order.prepStatus === 'em_preparacao'
                      ? 'bg-orange-600'
                      : order.prepStatus === 'pronto'
                      ? 'bg-emerald-600'
                      : 'bg-stone-800'
                  }`}
                >
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                      Entrada às {formatTimeOnly(order.createdAt)}
                    </div>
                    <div className="text-2xl font-black">
                      #{order.orderNumber}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black bg-white/20 px-3 py-1 rounded-xl">
                      MESA {order.tableNumber}
                    </div>
                    <div
                      className={`text-[10px] font-black mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        isCriticalTime
                          ? 'bg-rose-500 text-white animate-pulse'
                          : isWarningTime
                          ? 'bg-amber-400 text-stone-900'
                          : 'bg-white/30 text-white'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {elapsed} min
                    </div>
                  </div>
                </div>

                {/* Items and notes */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
                  {order.customerName && (
                    <div className="text-xs font-bold text-stone-600 pb-2 border-b border-stone-100">
                      Cliente: {order.customerName}
                    </div>
                  )}

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-stone-50 p-2.5 rounded-2xl border border-stone-200/80 space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {item.quantity}
                          </span>
                          <span className="font-extrabold text-sm text-stone-900 leading-tight">
                            {item.productName}
                          </span>
                        </div>

                        {/* Options */}
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="pl-8 text-xs text-stone-600 font-semibold space-y-0.5">
                            {item.selectedOptions.map((opt, oIdx) => (
                              <div key={oIdx} className="text-orange-950">• {opt.optionName}</div>
                            ))}
                          </div>
                        )}

                        {/* Notes highlighted */}
                        {item.notes && (
                          <div className="mt-1 p-2 rounded-xl bg-amber-200 text-amber-950 font-black text-xs border border-amber-300">
                            OBS: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Big Actions */}
                <div className="p-3 bg-stone-50 border-t border-stone-200">
                  {order.prepStatus === 'aguardando_confirmacao' && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, 'em_preparacao')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-2xl text-sm transition active:scale-98 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ChefHat className="w-5 h-5" />
                      <span>Iniciar Preparo Agora</span>
                    </button>
                  )}

                  {order.prepStatus === 'confirmado' && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, 'em_preparacao')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-2xl text-sm transition active:scale-98 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ChefHat className="w-5 h-5" />
                      <span>Iniciar Preparo</span>
                    </button>
                  )}

                  {order.prepStatus === 'em_preparacao' && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, 'pronto')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-sm transition active:scale-98 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Marcar como Pronto!</span>
                    </button>
                  )}

                  {order.prepStatus === 'pronto' && (
                    <button
                      onClick={() => handleAdvanceStatus(order.id, 'entregue')}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black py-3 rounded-2xl text-sm transition active:scale-98 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Utensils className="w-5 h-5 text-orange-400" />
                      <span>Confirmar Entrega na Mesa {order.tableNumber}</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
