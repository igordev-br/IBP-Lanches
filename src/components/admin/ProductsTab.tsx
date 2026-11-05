import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Product, Category, OptionGroup } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  Package,
  Upload,
  X,
  Check,
} from 'lucide-react';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  optionGroups: OptionGroup[];
  onRefresh: () => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  categories,
  optionGroups,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenCreate = () => {
    setEditingProduct({
      name: '',
      code: `PRD-${products.length + 1}`,
      categoryId: categories[0]?.id || '',
      description: '',
      price: 20.0,
      cost: 8.0,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      available: true,
      isFeatured: false,
      stockQuantity: 50,
      minStock: 10,
      estimatedMinutes: 12,
      optionGroupIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsModalOpen(true);
  };

  const handleToggleAvailable = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { available: !p.available });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do produto');
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${p.name}" (${p.code}) do cardápio?`)) {
      return;
    }
    try {
      await api.deleteProduct(p.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir produto');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.categoryId) return;
    setLoading(true);

    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct);
      } else {
        await api.createProduct(editingProduct);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditingProduct((prev) => (prev ? { ...prev, image: reader.result as string } : null));
    };
    reader.readAsDataURL(file);
  };

  const handleToggleOptionGroup = (groupId: string) => {
    if (!editingProduct) return;
    const current = editingProduct.optionGroupIds || [];
    const updated = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];
    setEditingProduct({ ...editingProduct, optionGroupIds: updated });
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Gerenciamento do Cardápio & Produtos
          </h2>
          <p className="text-xs text-stone-500">
            Cadastre alimentos, bebidas, fotos, custos e adicionais configuráveis
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 text-xs focus:border-orange-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all' ? 'bg-orange-600 text-white' : 'bg-white border border-stone-200 text-stone-600'
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === c.id ? 'bg-orange-600 text-white' : 'bg-white border border-stone-200 text-stone-600'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Produto</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Preço Venda</th>
                <th className="p-3.5">Custo Estimado</th>
                <th className="p-3.5">Estoque</th>
                <th className="p-3.5">Preparo</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filtered.map((prod) => {
                const category = categories.find((c) => c.id === prod.categoryId);
                return (
                  <tr key={prod.id} className="hover:bg-stone-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <span>{prod.name}</span>
                            {prod.isFeatured && (
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {prod.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg">
                        {category?.name || 'Geral'}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-stone-900">
                      {formatCurrency(prod.price)}
                    </td>
                    <td className="p-3.5 text-stone-500">
                      {prod.cost ? formatCurrency(prod.cost) : '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-md ${
                          prod.stockQuantity <= prod.minStock
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {prod.stockQuantity} un
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500">
                      ~{prod.estimatedMinutes || 10}m
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleAvailable(prod)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                          prod.available
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                      >
                        {prod.available ? 'Disponível' : 'Pausado'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                        title="Editar produto"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                        title="Desativar do cardápio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 border border-stone-200 space-y-4 max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-base">
                {editingProduct.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Código Interno</label>
                  <input
                    type="text"
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria *</label>
                  <select
                    required
                    value={editingProduct.categoryId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Tempo Médio Preparo (minutos)</label>
                  <input
                    type="number"
                    value={editingProduct.estimatedMinutes || 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, estimatedMinutes: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Ingredientes, modo de preparo ou detalhes do sabor..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Preço Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={editingProduct.cost || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={editingProduct.minStock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Photo preview & upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Foto do Produto</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                    {editingProduct.image && (
                      <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      placeholder="URL da imagem (Unsplash ou link direto)"
                      className="w-full text-xs p-2 rounded-xl border border-stone-200"
                    />
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fazer upload de foto do computador/celular</span>
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Option Groups Selector */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="block text-xs font-bold text-stone-700">
                  Grupos de Opcionais & Adicionais Aplicáveis:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {optionGroups.map((group) => {
                    const isChecked = editingProduct.optionGroupIds?.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => handleToggleOptionGroup(group.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-600'
                        }`}
                      >
                        <span>{group.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-orange-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={editingProduct.available !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, available: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span>Disponível para venda no cardápio</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.isFeatured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-600"
                  />
                  <span>Destaque no topo do cardápio</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm"
                >
                  {loading ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
