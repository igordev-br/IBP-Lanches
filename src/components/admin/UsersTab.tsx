import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { User, UserRole } from '../../types/index.ts';
import { formatDateTime } from '../../utils/formatters.ts';
import {
  Users,
  Plus,
  ShieldCheck,
  Edit2,
  Trash2,
  Lock,
  X,
  Check,
  RotateCw,
} from 'lucide-react';

export const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('atendente');
  const [formPassword, setFormPassword] = useState('');
  const [formActive, setFormActive] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('atendente');
    setFormPassword('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPassword('');
    setFormActive(u.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    try {
      if (editingUser?.id) {
        await api.updateUser(editingUser.id, {
          name: formName.trim(),
          role: formRole,
          active: formActive,
          password: formPassword.trim() || undefined,
        });
      } else {
        if (!formPassword.trim()) {
          alert('A senha é obrigatória para novos usuários.');
          return;
        }
        await api.createUser({
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          password: formPassword.trim(),
          active: formActive,
        });
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${u.name}" (${u.email})? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir usuário');
    }
  };

  const roleLabels: Record<UserRole, { label: string; color: string; desc: string }> = {
    admin: { label: 'Administrador Geral', color: 'bg-purple-100 text-purple-800', desc: 'Acesso completo a todas as funções e configurações' },
    gerente: { label: 'Gerente da Lanchonete', color: 'bg-blue-100 text-blue-800', desc: 'Cardápio, pedidos, estoque e relatórios' },
    caixa: { label: 'Operador de Caixa', color: 'bg-emerald-100 text-emerald-800', desc: 'Conferência de pagamentos, Pix e fechamento de caixa' },
    cozinha: { label: 'Equipe da Cozinha', color: 'bg-orange-100 text-orange-800', desc: 'Visualização de comandas e avanço do preparo' },
    atendente: { label: 'Atendente Voluntário', color: 'bg-amber-100 text-amber-800', desc: 'Registro e acompanhamento de pedidos de mesa' },
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Usuários & Controle de Permissões (RBAC)</span>
          </h2>
          <p className="text-xs text-stone-500">
            Cadastre membros da equipe com permissões restritas no servidor conforme sua função
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Nome</th>
                <th className="p-3.5">E-mail de Acesso</th>
                <th className="p-3.5">Função / Perfil</th>
                <th className="p-3.5">Descrição de Permissões</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {users.map((u) => {
                const roleInfo = roleLabels[u.role] || roleLabels.atendente;
                return (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition">
                    <td className="p-3.5 font-bold text-stone-900">{u.name}</td>
                    <td className="p-3.5 text-stone-600 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500 text-[11px] max-w-xs">{roleInfo.desc}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {u.active ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                        title="Editar usuário"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                        title="Excluir usuário"
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

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário da Equipe'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Irmão João Silva"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser?.id}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="joao@ibplanches.org.br"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Função / Perfil *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="admin">Administrador Geral</option>
                  <option value="gerente">Gerente da Lanchonete</option>
                  <option value="caixa">Operador de Caixa</option>
                  <option value="cozinha">Equipe da Cozinha</option>
                  <option value="atendente">Atendente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="userActive" className="text-xs font-bold text-stone-700 cursor-pointer">
                  Usuário Ativo (habilitado para fazer login)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Salvar Usuário
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
