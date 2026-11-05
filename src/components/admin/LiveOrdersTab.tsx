import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../services/api.ts';
import { Order, PrepStatus, PaymentStatus, AppSettings } from '../../types/index.ts';
import { formatCurrency, formatDateTime, getElapsedTimeMinutes } from '../../utils/formatters.ts';
import { soundManager } from '../../utils/audio.ts';
import { PrintReceiptModal } from '../common/PrintReceiptModal.tsx';
import {
  Volume2,
  VolumeX,
  Printer,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  AlertTriangle,
  Check,
  Utensils,
  ArrowRight,
} from 'lucide-react';

interface LiveOrdersTabProps {
  settings: AppSettings | null;
}

export const LiveOrdersTab: React.FC<LiveOrdersTabProps> = ({ settings }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [searchTable, setSearchTable] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'entregue'>('active');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Track previous order count to detect new incoming orders and trigger chime
  const previousOrderCount = useRef<number>(0);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const data = await api.getOrders();

      // Check if new orders arrived
      if (previousOrderCount.current > 0 && data.length > previousOrderCount.current && soundEnabled) {
        soundManager.playNewOrderChime();
      }
      previousOrderCount.current = data.length;
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleUpdatePrepStatus = async (orderId: string, prepStatus: PrepStatus) => {
    try {
      const updated = await api.updatePrepStatus(orderId, prepStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  // Counts for tabs
  const activeCount = orders.filter((o) => o.prepStatus !== 'entregue' && o.prepStatus !== 'cancelado').length;
  const deliveredCount = orders.filter((o) => o.prepStatus === 'entregue').length;
  const allCount = orders.length;

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        searchTable === '' ||
        o.tableNumber.includes(searchTable) ||
        o.orderNumber.toString().includes(searchTable) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchTable.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'active') {
        return o.prepStatus !== 'entregue' && o.prepStatus !== 'cancelado';
      } else if (statusFilter === 'entregue') {
        return o.prepStatus === 'entregue';
      }
      return true;
    });
  }, [orders, searchTable, statusFilter]);

  // All Kanban column definitions (including Entregues!)
  const allKanbanColumns = [
    { status: 'aguardando_confirmacao' as PrepStatus, title: 'Novos / Pendentes', color: 'border-amber-400', badgeBg: 'bg-amber-100 text-amber-800' },
    { status: 'confirmado' as PrepStatus, title: 'Confirmados', color: 'border-blue-400', badgeBg: 'bg-blue-100 text-blue-800' },
    { status: 'em_preparacao' as PrepStatus, title: 'Em Preparo (Cozinha)', color: 'border-orange-500', badgeBg: 'bg-orange-100 text-orange-800' },
    { status: 'pronto' as PrepStatus, title: 'Prontos para Entrega', color: 'border-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
    { status: 'entregue' as PrepStatus, title: 'Entregues à Mesa', color: 'border-stone-600', badgeBg: 'bg-stone-200 text-stone-800' },
  ];

  // Dynamically select columns according to filter
  const visibleColumns = useMemo(() => {
    if (statusFilter === 'active') {
      return allKanbanColumns.filter((col) => col.status !== 'entregue');
    }
    if (statusFilter === 'entregue') {
      return allKanbanColumns.filter((col) => col.status === 'entregue');
    }
    return allKanbanColumns;
  }, [statusFilter]);

  return (
    <div className="space-y-5">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Central de Pedidos em Tempo Real</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-stone-500">
            Atualização automática a cada 4 segundos com alertas sonoros
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              soundEnabled
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            title="Ativar/desativar som de novos pedidos"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
          </button>

          {/* View Toggle */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'kanban' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Quadro
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg transition ${
                viewMode === 'list' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Lista
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition active:scale-95"
            title="Atualizar agora"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            placeholder="Filtrar por mesa (ex: 01), número do pedido ou nome..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 text-xs focus:border-orange-500 outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <span>Em Andamento</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              statusFilter === 'active' ? 'bg-orange-700 text-white' : 'bg-stone-100 text-stone-700'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <span>Todos os Pedidos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              statusFilter === 'all' ? 'bg-orange-700 text-white' : 'bg-stone-100 text-stone-700'
            }`}>
              {allCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('entregue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'entregue'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            <span>Entregues</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              statusFilter === 'entregue' ? 'bg-orange-700 text-white' : 'bg-stone-100 text-stone-700'
            }`}>
              {deliveredCount}
            </span>
          </button>
        </div>
      </div>

      {/* Orders View */}
      {viewMode === 'kanban' ? (
        <div className={`grid gap-4 items-start ${
          visibleColumns.length === 1
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : visibleColumns.length === 4
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
        }`}>
          {visibleColumns.map((col) => {
            const columnOrders = filteredOrders.filter((o) => o.prepStatus === col.status);
            return (
              <div
                key={col.status}
                className="bg-stone-100/90 rounded-2xl p-3 border border-stone-200 space-y-3 min-h-[380px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${col.badgeBg}`}>
                      {col.title}
                    </span>
                  </div>
                  <span className="text-xs font-black text-stone-500">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Orders in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnOrders.length === 0 ? (
                    <div className="py-12 text-center text-xs text-stone-400 font-medium">
                      Nenhum pedido nesta etapa
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const elapsed = getElapsedTimeMinutes(order.createdAt);
                      return (
                        <div
                          key={order.id}
                          className={`bg-white rounded-2xl p-3.5 shadow-xs border-l-4 ${col.color} border-y border-r border-stone-200 space-y-2.5 transition hover:shadow-md`}
                        >
                          {/* Order Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-sm text-stone-900">
                                  #{order.orderNumber}
                                </span>
                                <span className="bg-orange-600 text-white text-[11px] font-black px-2 py-0.2 rounded-md">
                                  MESA {order.tableNumber}
                                </span>
                              </div>
                              {order.customerName && (
                                <div className="text-[11px] font-bold text-stone-600 mt-0.5">
                                  {order.customerName}
                                  {order.customerPhone && (
                                    <span className="text-stone-400 font-normal"> ({order.customerPhone})</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  order.prepStatus === 'entregue'
                                    ? 'bg-stone-100 text-stone-600'
                                    : elapsed > 20
                                    ? 'bg-rose-100 text-rose-800'
                                    : elapsed > 10
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {order.prepStatus === 'entregue' ? 'Concluído' : `${elapsed} min`}
                              </span>
                            </div>
                          </div>

                          {/* Items summary */}
                          <div className="space-y-1 text-xs border-y border-stone-100 py-2">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between font-bold text-stone-800">
                                  <span>{it.quantity}x {it.productName}</span>
                                </div>
                                {it.selectedOptions && it.selectedOptions.length > 0 && (
                                  <div className="text-[10px] text-stone-500 pl-2">
                                    {it.selectedOptions.map((o) => o.optionName).join(', ')}
                                  </div>
                                )}
                                {it.notes && (
                                  <div className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded italic">
                                    Obs: {it.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Payment badge and total */}
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                order.paymentStatus === 'pagamento_aprovado' || order.paymentStatus === 'pago_no_caixa'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.paymentMethod.toUpperCase()} •{' '}
                              {order.paymentStatus === 'pagamento_aprovado' || order.paymentStatus === 'pago_no_caixa'
                                ? 'PAGO'
                                : 'PENDENTE'}
                            </span>

                            <span className="font-black text-sm text-stone-900">
                              {formatCurrency(order.total)}
                            </span>
                          </div>

                          {/* Action Advance Buttons */}
                          <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForPrint(order)}
                              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition"
                              title="Imprimir comanda"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {order.prepStatus === 'aguardando_confirmacao' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePrepStatus(order.id, 'confirmado')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition active:scale-95"
                              >
                                Confirmar Pedido
                              </button>
                            )}

                            {order.prepStatus === 'confirmado' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePrepStatus(order.id, 'em_preparacao')}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition active:scale-95"
                              >
                                Iniciar Preparo
                              </button>
                            )}

                            {order.prepStatus === 'em_preparacao' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePrepStatus(order.id, 'pronto')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 rounded-lg transition active:scale-95"
                              >
                                Marcar Pronto!
                              </button>
                            )}

                            {order.prepStatus === 'pronto' && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePrepStatus(order.id, 'entregue')}
                                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold text-[11px] py-1.5 rounded-lg transition active:scale-95"
                              >
                                Entregar à Mesa
                              </button>
                            )}

                            {order.prepStatus === 'entregue' && (
                              <div className="flex-1 text-center py-1 bg-stone-100 rounded-lg text-[10px] font-bold text-stone-600 flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Entregue na Mesa {order.tableNumber}</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Pedido</th>
                  <th className="p-3.5">Mesa</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Itens do Pedido</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Pagamento</th>
                  <th className="p-3.5">Status Preparo</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-stone-400">
                      Nenhum pedido encontrado para o filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition">
                      <td className="p-3.5 font-black text-stone-900">
                        #{order.orderNumber}
                        <div className="text-[10px] text-stone-400 font-normal">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-extrabold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-lg">
                          Mesa {order.tableNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-stone-800">{order.customerName || '—'}</div>
                        <div className="text-[10px] text-stone-400">{order.customerPhone}</div>
                      </td>
                      <td className="p-3.5 max-w-xs truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="p-3.5 font-black text-stone-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            order.paymentStatus === 'pagamento_aprovado' || order.paymentStatus === 'pago_no_caixa'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentMethod.toUpperCase()} • {order.paymentStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.prepStatus === 'entregue'
                            ? 'bg-stone-200 text-stone-800'
                            : order.prepStatus === 'pronto'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.prepStatus === 'em_preparacao'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.prepStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForPrint(order)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                          title="Imprimir comanda"
                        >
                          <Printer className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Comanda Modal */}
      {selectedOrderForPrint && (
        <PrintReceiptModal
          order={selectedOrderForPrint}
          settings={settings}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

    </div>
  );
};
