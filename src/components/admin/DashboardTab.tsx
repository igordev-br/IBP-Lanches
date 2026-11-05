import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ChefHat,
  RotateCw,
} from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard(period);
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Dashboard da Lanchonete
          </h2>
          <p className="text-xs text-stone-500">
            Métricas em tempo real de vendas, pagamentos e operação
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'week' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'month' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Geral
            </button>
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
            title="Atualizar dados"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Vendas Confirmadas */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Pagamentos Confirmados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatCurrency(data?.confirmedPayments || 0)}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            Dinheiro recebido e Pix conferido
          </div>
        </div>

        {/* Faturamento Bruto */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-orange-600">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Faturamento Bruto
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatCurrency(data?.grossRevenue || 0)}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            Total de {data?.totalOrders || 0} pedidos realizados
          </div>
        </div>

        {/* Pagamentos Pendentes */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Valores a Receber
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {formatCurrency(data?.pendingPayments || 0)}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {data?.pendingProofsCount || 0} comprovantes aguardando análise
          </div>
        </div>

        {/* Saldo Líquido Estimado */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Saldo Líquido (Caixa)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900">
            {formatCurrency(data?.netEstimatedBalance || 0)}
          </div>
          <div className="text-[11px] text-stone-500 font-medium">
            Vendas confirmadas - Despesas ({formatCurrency(data?.totalExpenses || 0)})
          </div>
        </div>

      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-amber-900">
              {data?.pendingProofsCount || 0}
            </div>
            <div className="text-xs text-amber-800 font-semibold">
              Comprovantes para Conferir
            </div>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-orange-950">
              {data?.ordersInPrep || 0}
            </div>
            <div className="text-xs text-orange-900 font-semibold">
              Pedidos em Preparo na Cozinha
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-emerald-950">
              {data?.ordersReady || 0}
            </div>
            <div className="text-xs text-emerald-900 font-semibold">
              Pedidos Prontos para Entrega
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales by Payment Method */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">
              Vendas por Forma de Pagamento
            </h3>
            <span className="text-xs text-stone-400">Distribuição</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Pix */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-teal-700">Pix Instantâneo</span>
                <span className="text-stone-900">{formatCurrency(data?.paymentBreakdown?.pix || 0)}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data?.grossRevenue > 0 ? ((data?.paymentBreakdown?.pix || 0) / data.grossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Dinheiro */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">Dinheiro Físico</span>
                <span className="text-stone-900">{formatCurrency(data?.paymentBreakdown?.dinheiro || 0)}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data?.grossRevenue > 0 ? ((data?.paymentBreakdown?.dinheiro || 0) / data.grossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Cartão */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-blue-700">Cartão na Maquininha</span>
                <span className="text-stone-900">{formatCurrency(data?.paymentBreakdown?.cartao_maquininha || 0)}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${data?.grossRevenue > 0 ? ((data?.paymentBreakdown?.cartao_maquininha || 0) / data.grossRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-stone-900 uppercase tracking-wider">
              Produtos Mais Vendidos
            </h3>
            <span className="text-xs text-stone-400">Top 5</span>
          </div>

          <div className="space-y-3 pt-1">
            {(!data?.topProducts || data.topProducts.length === 0) ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Nenhum produto vendido no período selecionado.
              </div>
            ) : (
              data.topProducts.map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-stone-900">{prod.name}</div>
                      <div className="text-[10px] text-stone-500">{prod.quantity} unidades vendidas</div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-stone-900">
                    {formatCurrency(prod.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
