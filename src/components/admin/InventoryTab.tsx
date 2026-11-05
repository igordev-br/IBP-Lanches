import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { InventoryItem, InventoryMovement } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RotateCw,
  AlertTriangle,
  History,
  X,
  SlidersHorizontal,
} from 'lucide-react';

export const InventoryTab: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Movement modal
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida_manual' | 'ajuste_inventario'>('entrada');
  const [movementQty, setMovementQty] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementCost, setMovementCost] = useState('');

  // Create item modal
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [newItemStock, setNewItemStock] = useState('50');
  const [newItemMin, setNewItemMin] = useState('10');
  const [newItemCost, setNewItemCost] = useState('0');
  const [newItemCategory, setNewItemCategory] = useState<'ingrediente' | 'bebida' | 'embalagem' | 'outros'>('ingrediente');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory();
      setItems(data.items);
      setMovements(data.movements);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMovement || !movementQty) return;

    try {
      await api.recordStockMovement(selectedItemForMovement.id, {
        type: movementType,
        quantity: Number(movementQty),
        reason: movementReason.trim() || undefined,
        cost: movementCost ? Number(movementCost) : undefined,
      });

      setSelectedItemForMovement(null);
      setMovementQty('');
      setMovementReason('');
      setMovementCost('');
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await api.createInventoryItem({
        name: newItemName.trim(),
        unit: newItemUnit,
        currentStock: Number(newItemStock),
        minStock: Number(newItemMin),
        unitCost: Number(newItemCost),
        category: newItemCategory,
      });

      setIsCreateItemModalOpen(false);
      setNewItemName('');
      fetchInventory();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar insumo');
    }
  };

  const lowStockItems = items.filter((i) => i.currentStock <= i.minStock);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Controle de Estoque & Insumos</span>
            {lowStockItems.length > 0 && (
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {lowStockItems.length} com estoque baixo
              </span>
            )}
          </h2>
          <p className="text-xs text-stone-500">
            Controle de ingredientes, embalagens e bebidas com baixa automática por vendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateItemModalOpen(true)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Insumo</span>
          </button>
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs text-rose-900 uppercase tracking-wider">
              Alerta de Estoque Mínimo Atingido
            </h4>
            <p className="text-xs text-rose-800">
              Os seguintes itens precisam de reposição para não comprometer o atendimento dos irmãos:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {lowStockItems.map((item) => (
                <span
                  key={item.id}
                  className="bg-white border border-rose-300 text-rose-900 font-bold text-xs px-2.5 py-1 rounded-lg"
                >
                  {item.name}: {item.currentStock} {item.unit} (mín: {item.minStock})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Inventory Items Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Insumo / Ingrediente</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Estoque Atual</th>
                <th className="p-3.5">Estoque Mínimo</th>
                <th className="p-3.5">Custo Médio</th>
                <th className="p-3.5">Situação</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {items.map((item) => {
                const isLow = item.currentStock <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition">
                    <td className="p-3.5 font-bold text-stone-900">
                      {item.name}
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-sm text-stone-900">
                      {item.currentStock} <span className="text-xs text-stone-500 font-normal">{item.unit}</span>
                    </td>
                    <td className="p-3.5 text-stone-500">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="p-3.5 text-stone-700">
                      {formatCurrency(item.unitCost)} / {item.unit}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isLow ? 'Estoque Baixo' : 'Normal'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedItemForMovement(item);
                          setMovementType('entrada');
                          setMovementQty('');
                          setMovementReason('');
                        }}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-3 py-1.5 rounded-xl text-xs transition"
                      >
                        Movimentar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Audit Trail History */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <History className="w-4 h-4 text-orange-600" />
          <span>Últimas Movimentações no Estoque</span>
        </h3>

        <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
          {movements.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400">
              Nenhuma movimentação registrada recentemente.
            </div>
          ) : (
            movements.map((mov) => {
              const item = items.find((i) => i.id === mov.inventoryItemId);
              return (
                <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${
                        mov.type === 'entrada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'saida_manual'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {mov.type === 'entrada' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">
                        {item?.name || 'Insumo'}: {mov.type === 'entrada' ? '+' : '-'}{mov.quantity} {item?.unit || ''}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {mov.reason} • Registrado por {mov.userName}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {formatDateTime(mov.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Movement Modal */}
      {selectedItemForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  Movimentar Estoque
                </h3>
                <p className="text-xs text-stone-500">
                  {selectedItemForMovement.name} (Atual: {selectedItemForMovement.currentStock} {selectedItemForMovement.unit})
                </p>
              </div>
              <button onClick={() => setSelectedItemForMovement(null)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Tipo de Movimentação</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMovementType('entrada')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                      movementType === 'entrada' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('saida_manual')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                      movementType === 'saida_manual' ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    Saída
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('ajuste_inventario')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                      movementType === 'ajuste_inventario' ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    Inventário
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {movementType === 'ajuste_inventario' ? 'Novo Saldo Real Contado' : 'Quantidade'} ({selectedItemForMovement.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Motivo / Justificativa</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Compra feira, perda por validade, acerto semanal..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Registrar Movimentação
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemForMovement(null)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Insumo Modal */}
      {isCreateItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">
                Cadastrar Novo Insumo
              </h3>
              <button onClick={() => setIsCreateItemModalOpen(false)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Insumo *</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Queijo Muçarela Ralado"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unidade</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="un">un (unidade)</option>
                    <option value="kg">kg (quilo)</option>
                    <option value="g">g (gramas)</option>
                    <option value="l">l (litro)</option>
                    <option value="ml">ml (mililitro)</option>
                    <option value="pct">pct (pacote)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="ingrediente">Ingrediente</option>
                    <option value="bebida">Bebida</option>
                    <option value="embalagem">Embalagem</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Estoque</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Mínimo</label>
                  <input
                    type="number"
                    value={newItemMin}
                    onChange={(e) => setNewItemMin(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Custo Un.</label>
                  <input
                    type="number"
                    step="0.10"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 text-center"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Cadastrar Insumo
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateItemModalOpen(false)}
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
