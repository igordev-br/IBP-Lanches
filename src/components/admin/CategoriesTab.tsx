import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Category, OptionGroup, OptionItem } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import { Plus, Edit2, Trash2, Check, X, Layers, Sliders } from 'lucide-react';

interface CategoriesTabProps {
  categories: Category[];
  optionGroups: OptionGroup[];
  onRefresh: () => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  optionGroups,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'options'>('categories');

  // Category modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍔');
  const [catOrder, setCatOrder] = useState(1);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Option Group modal states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMin, setGroupMin] = useState(0);
  const [groupMax, setGroupMax] = useState(1);
  const [groupOptions, setGroupOptions] = useState<Array<{ name: string; price: number; available: boolean }>>([
    { name: 'Opção 1', price: 0, available: true },
  ]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const handleOpenCatCreate = () => {
    setEditingCatId(null);
    setCatName('');
    setCatIcon('🍔');
    setCatOrder(categories.length + 1);
    setIsCatModalOpen(true);
  };

  const handleOpenCatEdit = (c: Category) => {
    setEditingCatId(c.id);
    setCatName(c.name);
    setCatIcon(c.icon || '🍴');
    setCatOrder(c.order);
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (editingCatId) {
        await api.updateCategory(editingCatId, { name: catName, icon: catIcon, order: Number(catOrder) });
      } else {
        await api.createCategory({ name: catName, icon: catIcon, order: Number(catOrder), active: true });
      }
      setIsCatModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar categoria');
    }
  };

  const handleOpenGroupCreate = () => {
    setEditingGroupId(null);
    setGroupName('');
    setGroupRequired(false);
    setGroupMin(0);
    setGroupMax(1);
    setGroupOptions([{ name: 'Opção Padrão', price: 0, available: true }]);
    setIsGroupModalOpen(true);
  };

  const handleOpenGroupEdit = (g: OptionGroup) => {
    setEditingGroupId(g.id);
    setGroupName(g.name);
    setGroupRequired(g.required);
    setGroupMin(g.minChoices);
    setGroupMax(g.maxChoices);
    setGroupOptions(g.options.map((o) => ({ name: o.name, price: o.price, available: o.available })));
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      if (editingGroupId) {
        await api.updateOptionGroup(editingGroupId, {
          name: groupName,
          required: groupRequired,
          minChoices: Number(groupMin),
          maxChoices: Number(groupMax),
          options: groupOptions as any,
        });
      } else {
        await api.createOptionGroup({
          name: groupName,
          required: groupRequired,
          minChoices: Number(groupMin),
          maxChoices: Number(groupMax),
          options: groupOptions as any,
        });
      }
      setIsGroupModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar grupo de adicionais');
    }
  };

  const handleDeleteCat = async (c: Category) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${c.name}"?`)) {
      return;
    }
    try {
      await api.deleteCategory(c.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir categoria');
    }
  };

  const handleDeleteGroup = async (g: OptionGroup) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo de adicionais "${g.name}"?`)) {
      return;
    }
    try {
      await api.deleteOptionGroup(g.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir grupo');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Categorias & Adicionais
          </h2>
          <p className="text-xs text-stone-500">
            Organize a estrutura do cardápio e os grupos de adicionais (bacon, queijo, ponto, molhos)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'categories' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categorias ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                activeTab === 'options' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Grupos de Adicionais ({optionGroups.length})</span>
            </button>
          </div>

          <button
            onClick={activeTab === 'categories' ? handleOpenCatCreate : handleOpenGroupCreate}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'categories' ? 'Nova Categoria' : 'Novo Grupo'}</span>
          </button>
        </div>
      </div>

      {/* Content depending on active sub-tab */}
      {activeTab === 'categories' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 bg-stone-100 rounded-xl">{cat.icon || '🍴'}</span>
                <div>
                  <h4 className="font-extrabold text-sm text-stone-900">{cat.name}</h4>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    Ordem de Exibição: #{cat.order}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenCatEdit(cat)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                  title="Editar categoria"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCat(cat)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                  title="Excluir categoria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optionGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-stone-900">{group.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        group.required
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {group.required ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Mínimo: {group.minChoices} • Máximo: {group.maxChoices} escolhas
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenGroupEdit(group)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                    title="Editar grupo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                    title="Excluir grupo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options list inside group */}
              <div className="space-y-1.5 pt-1 border-t border-stone-100">
                {group.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-50 text-xs font-semibold"
                  >
                    <span className="text-stone-800">{opt.name}</span>
                    <span className="text-orange-700 font-bold">
                      {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Grátis'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">
                {editingCatId ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCat} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Hambúrgueres Artesanais"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Emoji / Ícone</label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="🍔"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Ordem</label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 text-center font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Salvar Categoria
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-stone-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">
                {editingGroupId ? 'Editar Grupo de Adicionais' : 'Novo Grupo de Adicionais'}
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Grupo *</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Adicionais Saborosos"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Mín. Escolhas</label>
                  <input
                    type="number"
                    value={groupMin}
                    onChange={(e) => setGroupMin(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Máx. Escolhas</label>
                  <input
                    type="number"
                    value={groupMax}
                    onChange={(e) => setGroupMax(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-xl border border-stone-200 text-center"
                  />
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupRequired}
                      onChange={(e) => setGroupRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600"
                    />
                    <span>Obrigatório</span>
                  </label>
                </div>
              </div>

              {/* Items in this group */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">Opções do Grupo:</span>
                  <button
                    type="button"
                    onClick={() => setGroupOptions([...groupOptions, { name: '', price: 0, available: true }])}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Opção</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {groupOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nome (ex: Bacon Extra)"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...groupOptions];
                          updated[idx].name = e.target.value;
                          setGroupOptions(updated);
                        }}
                        className="flex-1 text-xs p-2 rounded-xl border border-stone-200"
                      />
                      <div className="w-24 relative">
                        <span className="absolute left-2 top-2 text-[10px] text-stone-400 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          placeholder="0.00"
                          value={opt.price}
                          onChange={(e) => {
                            const updated = [...groupOptions];
                            updated[idx].price = Number(e.target.value);
                            setGroupOptions(updated);
                          }}
                          className="w-full pl-6 pr-2 py-2 text-xs rounded-xl border border-stone-200 text-right font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setGroupOptions(groupOptions.filter((_, i) => i !== idx))}
                        className="p-2 text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                >
                  Salvar Grupo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
