import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Expense, CashClosing, Order } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import {
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  TrendingUp,
  Receipt,
  X,
  CheckCircle2,
} from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'financial' | 'expenses' | 'cash_closing'>('financial');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'ingredientes' | 'bebidas' | 'embalagens' | 'limpeza' | 'outros'>('ingredientes');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Cash Closing modal
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [initialBalance, setInitialBalance] = useState('100.00');
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const loadData = async () => {
    try {
      const [dash, exp, cls, ord] = await Promise.all([
        api.getDashboard('today'),
        api.getExpenses(),
        api.getCashClosings(),
        api.getOrders(),
      ]);
      setDashboardData(dash);
      setExpenses(exp);
      setClosings(cls);
      setOrders(ord);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    try {
      await api.createExpense({
        title: expenseTitle.trim(),
        amount: Number(expenseAmount),
        category: expenseCategory,
        notes: expenseNotes.trim() || undefined,
      });

      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar despesa');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja excluir esta despesa?')) return;
    try {
      await api.deleteExpense(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  const handleCreateClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCashCounted) return;

    try {
      await api.createCashClosing({
        initialBalance: Number(initialBalance),
        actualCashCounted: Number(actualCashCounted),
        notes: closingNotes.trim() || undefined,
      });

      setIsClosingModalOpen(false);
      setActualCashCounted('');
      setClosingNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao fechar caixa');
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Numero Pedido', 'Mesa', 'Data Hora', 'Valor Total', 'Forma Pagamento', 'Status Pagamento', 'Itens'],
      ...orders.map((o) => [
        `#${o.orderNumber}`,
        `Mesa ${o.tableNumber}`,
        formatDateTime(o.createdAt),
        o.total.toFixed(2),
        o.paymentMethod,
        o.paymentStatus,
        `"${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ')}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_vendas_ibplanches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalExpensesSum = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Relatórios Financeiros & Fechamento de Caixa
          </h2>
          <p className="text-xs text-stone-500">
            Acompanhe receitas recebidas, despesas de compras e conferência física do caixa
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab buttons */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setSubTab('financial')}
              className={`px-3 py-1.5 rounded-lg transition ${
                subTab === 'financial' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Vendas & Margens
            </button>
            <button
              onClick={() => setSubTab('expenses')}
              className={`px-3 py-1.5 rounded-lg transition ${
                subTab === 'expenses' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Despesas ({expenses.length})
            </button>
            <button
              onClick={() => setSubTab('cash_closing')}
              className={`px-3 py-1.5 rounded-lg transition ${
                subTab === 'cash_closing' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Fechamento de Caixa
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            title="Exportar pedidos em planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Financial & Sales Summary */}
      {subTab === 'financial' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Faturamento Total Recebido
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {formatCurrency(dashboardData?.confirmedPayments || 0)}
              </div>
              <p className="text-[11px] text-stone-500">Pagamentos confirmados</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Despesas Totais Lançadas
              </span>
              <div className="text-2xl font-black text-rose-600">
                {formatCurrency(totalExpensesSum)}
              </div>
              <p className="text-[11px] text-stone-500">Compras de insumos e embalagens</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Resultado Líquido da Lanchonete
              </span>
              <div className="text-2xl font-black text-stone-900">
                {formatCurrency((dashboardData?.confirmedPayments || 0) - totalExpensesSum)}
              </div>
              <p className="text-[11px] text-stone-500">Recursos gerados para a igreja</p>
            </div>
          </div>

          {/* Orders Sales Table */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-stone-900">
                Histórico Geral de Pedidos Realizados
              </h3>
              <span className="text-xs text-stone-400">{orders.length} pedidos</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Pedido</th>
                    <th className="p-3.5">Mesa</th>
                    <th className="p-3.5">Data & Hora</th>
                    <th className="p-3.5">Itens Comprados</th>
                    <th className="p-3.5">Pagamento</th>
                    <th className="p-3.5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/70 transition">
                      <td className="p-3.5 font-black text-stone-900">#{o.orderNumber}</td>
                      <td className="p-3.5 font-bold">Mesa {o.tableNumber}</td>
                      <td className="p-3.5 text-stone-500">{formatDateTime(o.createdAt)}</td>
                      <td className="p-3.5 max-w-sm truncate text-stone-700">
                        {o.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                      </td>
                      <td className="p-3.5">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-stone-900">
                        {formatCurrency(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Expenses Tracker */}
      {subTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-stone-900">
              Despesas e Compras da Lanchonete
            </h3>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Nova Despesa</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Descrição</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Registrado Por</th>
                  <th className="p-3.5">Valor (R$)</th>
                  <th className="p-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      Nenhuma despesa lançada até o momento.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50/70 transition">
                      <td className="p-3.5 font-bold text-stone-900">
                        {exp.title}
                        {exp.notes && <div className="text-[10px] text-stone-400 font-normal">{exp.notes}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 font-semibold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-500">{exp.date}</td>
                      <td className="p-3.5 text-stone-600">{exp.registeredBy}</td>
                      <td className="p-3.5 font-black text-rose-600">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition"
                          title="Excluir despesa"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Subtab 3: Cash Closings */}
      {subTab === 'cash_closing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">
                Histórico de Fechamentos de Caixa
              </h3>
              <p className="text-xs text-stone-500">
                Conferência do dinheiro em espécie na gaveta, vendas em Pix e eventuais sobras/faltas
              </p>
            </div>
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Receipt className="w-4 h-4" />
              <span>Realizar Fechamento de Caixa</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Data / Hora</th>
                  <th className="p-3.5">Operador</th>
                  <th className="p-3.5">Saldo Inicial</th>
                  <th className="p-3.5">Dinheiro Recebido</th>
                  <th className="p-3.5">Pix Confirmado</th>
                  <th className="p-3.5">Dinheiro Contado</th>
                  <th className="p-3.5">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {closings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-400">
                      Nenhum fechamento registrado ainda. Clique no botão acima para fechar o caixa de hoje.
                    </td>
                  </tr>
                ) : (
                  closings.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50/70 transition">
                      <td className="p-3.5 font-bold text-stone-900">
                        {c.date}
                        <div className="text-[10px] text-stone-400">{formatDateTime(c.createdAt)}</div>
                      </td>
                      <td className="p-3.5 text-stone-700">{c.closedBy}</td>
                      <td className="p-3.5 text-stone-600">{formatCurrency(c.initialBalance)}</td>
                      <td className="p-3.5 font-bold text-emerald-700">{formatCurrency(c.totalCashReceived)}</td>
                      <td className="p-3.5 text-teal-700 font-bold">{formatCurrency(c.totalPixConfirmed)}</td>
                      <td className="p-3.5 font-black text-stone-900">{formatCurrency(c.actualCashCounted)}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            c.difference === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.difference > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.difference >= 0 ? `+${formatCurrency(c.difference)}` : formatCurrency(c.difference)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">Lançar Nova Despesa</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Título / Descrição *</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Ex: Compra de Pães Brioche"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="45.00"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="ingredientes">Ingredientes</option>
                    <option value="bebidas">Bebidas</option>
                    <option value="embalagens">Embalagens</option>
                    <option value="limpeza">Limpeza</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Observações</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Nota fiscal ou fornecedor..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Registrar Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Closing Modal */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">Fechamento de Caixa</h3>
              <button onClick={() => setIsClosingModalOpen(false)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClosing} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Saldo Inicial em Caixa (R$)</label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Dinheiro Físico Contado na Gaveta (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(e.target.value)}
                  placeholder="Ex: 350.00"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 font-black text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Observações do Fechamento</label>
                <input
                  type="text"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Ex: Tudo conferido conforme as comandas"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Concluir Fechamento
                </button>
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
