import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';
import { ShieldCheck, Lock, Mail, ArrowRight, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-stone-200 animate-in fade-in duration-150 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                Painel IBPLanches Admin
              </h3>
              <p className="text-xs text-stone-500">
                Acesso exclusivo para pastores e equipe da lanchonete
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">E-mail Administrativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ibplanches.org.br"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>{loading ? 'Entrando...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Buttons for Instant Testing */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 text-center">
            Acesso Rápido de Teste por Função:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-bold hover:bg-purple-100 transition text-left"
            >
              👑 Admin Geral
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('gerente')}
              className="p-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-bold hover:bg-blue-100 transition text-left"
            >
              📋 Gerente
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('caixa')}
              className="p-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold hover:bg-emerald-100 transition text-left"
            >
              💵 Caixa / Pix
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cozinha')}
              className="p-2 rounded-xl bg-orange-50 text-orange-900 border border-orange-200 font-bold hover:bg-orange-100 transition text-left"
            >
              🍳 Cozinha KDS
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
