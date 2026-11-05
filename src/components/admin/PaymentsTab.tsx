import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Order, PaymentStatus } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCw,
  Search,
  Filter,
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react';

export const PaymentsTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterType, setFilterType] = useState<'pending_proof' | 'all' | 'approved' | 'cash'>('pending_proof');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDecision = async (decision: 'aprovado' | 'rejeitado') => {
    if (!selectedProofOrder) return;
    if (decision === 'rejeitado' && !rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição do comprovante.');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await api.proofDecision(
        selectedProofOrder.id,
        decision,
        decision === 'rejeitado' ? rejectionReason : undefined
      );

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedProofOrder(null);
      setShowRejectForm(false);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar decisão');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCashReceived = async (orderId: string) => {
    try {
      const updated = await api.updatePaymentStatus(orderId, 'pago_no_caixa', 'Dinheiro recebido no balcão');
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar pagamento em dinheiro');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterType === 'pending_proof') {
      return o.paymentProof && o.paymentProof.status === 'em_analise';
    } else if (filterType === 'approved') {
      return o.paymentStatus === 'pagamento_aprovado' || o.paymentStatus === 'pago_no_caixa';
    } else if (filterType === 'cash') {
      return o.paymentMethod === 'dinheiro';
    }
    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Central de Pagamentos & Comprovantes</span>
          </h2>
          <p className="text-xs text-stone-500">
            Conferência segura de comprovantes Pix, dinheiro e controle de caixa
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3.5 py-2 rounded-xl text-xs font-bold transition self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('pending_proof')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'pending_proof'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Comprovantes para Analisar</span>
          <span className="bg-black/20 text-stone-900 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
            {orders.filter((o) => o.paymentProof && o.paymentProof.status === 'em_analise').length}
          </span>
        </button>

        <button
          onClick={() => setFilterType('approved')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'approved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pagamentos Aprovados</span>
        </button>

        <button
          onClick={() => setFilterType('cash')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'cash'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Dinheiro Físico</span>
        </button>

        <button
          onClick={() => setFilterType('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            filterType === 'all'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          <span>Todos os Registros</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Pedido</th>
                <th className="p-3.5">Mesa</th>
                <th className="p-3.5">Valor Esperado</th>
                <th className="p-3.5">Forma</th>
                <th className="p-3.5">Comprovante</th>
                <th className="p-3.5">Status Pagamento</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    Nenhum pagamento correspondente a este filtro.
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
                      <span className="font-extrabold bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md">
                        Mesa {order.tableNumber}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-sm text-stone-900">
                      {formatCurrency(order.total)}
                      {order.cashChangeFor && (
                        <div className="text-[10px] text-amber-700 font-normal">
                          Troco para: {formatCurrency(order.cashChangeFor)}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize font-bold text-stone-700">
                        {order.paymentMethod === 'pix' ? 'Pix' : order.paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {order.paymentProof ? (
                        <button
                          onClick={() => {
                            setSelectedProofOrder(order);
                            setShowRejectForm(false);
                            setRejectionReason('');
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                            order.paymentProof.status === 'em_analise'
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                              : order.paymentProof.status === 'aprovado'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {order.paymentProof.status === 'em_analise'
                              ? 'Analisar Comprovante'
                              : order.paymentProof.status === 'aprovado'
                              ? 'Ver Comprovante (Aprovado)'
                              : 'Comprovante Rejeitado'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-stone-400 italic">Sem anexo</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.paymentStatus === 'pagamento_aprovado' || order.paymentStatus === 'pago_no_caixa'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'comprovante_em_analise'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {order.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {order.paymentMethod === 'dinheiro' && order.paymentStatus !== 'pago_no_caixa' && order.paymentStatus !== 'pagamento_aprovado' && (
                        <button
                          onClick={() => handleMarkCashReceived(order.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition"
                        >
                          Receber Dinheiro
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protected Payment Proof Modal */}
      {selectedProofOrder && selectedProofOrder.paymentProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150">
            
            {/* Header */}
            <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  Conferência de Comprovante Pix
                </h3>
                <p className="text-xs text-stone-500">
                  Pedido #{selectedProofOrder.orderNumber} — Mesa {selectedProofOrder.tableNumber} ({formatCurrency(selectedProofOrder.total)})
                </p>
              </div>
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proof Image */}
            <div className="p-4 bg-stone-900 overflow-y-auto flex items-center justify-center min-h-[300px]">
              <img
                src={selectedProofOrder.paymentProof.fileDataUrl}
                alt="Comprovante de pagamento"
                className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Actions / Decision Box */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span>Enviado às: {formatDateTime(selectedProofOrder.paymentProof.uploadedAt)}</span>
                <span className="font-bold text-stone-900">
                  Valor a conferir: {formatCurrency(selectedProofOrder.total)}
                </span>
              </div>

              {showRejectForm ? (
                <div className="space-y-2 pt-1 border-t border-stone-200">
                  <label className="block text-xs font-bold text-rose-700">
                    Motivo da Rejeição (o cliente verá esta mensagem):
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Valor no comprovante diferente do total / Imagem cortada"
                    className="w-full text-xs p-2 rounded-xl border border-rose-300 focus:border-rose-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision('rejeitado')}
                      disabled={actionLoading}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs transition"
                    >
                      Confirmar Rejeição
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-2 bg-stone-200 hover:bg-stone-300 rounded-xl text-xs font-bold text-stone-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision('aprovado')}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar Comprovante & Pagamento</span>
                  </button>

                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeitar...</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
