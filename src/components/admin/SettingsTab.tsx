import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { AppSettings } from '../../types/index.ts';
import QRCode from 'qrcode';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCw,
  Building2,
  Clock,
  QrCode,
  ShieldCheck,
  Check,
  AlertCircle,
  Database,
  Copy,
  Printer,
  Trash2,
} from 'lucide-react';

interface SettingsTabProps {
  settings: AppSettings | null;
  onRefresh: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onRefresh }) => {
  const [formData, setFormData] = useState<Partial<AppSettings>>(() => settings || {});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [appQrCodeUrl, setAppQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const appUrl = window.location.origin;
      QRCode.toDataURL(appUrl, {
        margin: 2,
        width: 320,
        color: {
          dark: '#ea580c',
          light: '#ffffff',
        },
      })
        .then(setAppQrCodeUrl)
        .catch(console.error);
    }
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await api.updateSettings(formData);
      setSuccessMsg('Configurações salvas com sucesso!');
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/backup', '_blank');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: A restauração substituirá os dados atuais do cardápio e estoque pelos dados do backup. Deseja continuar?')) {
      return;
    }

    setRestoreLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        await api.restoreBackup(json);
        alert('Banco de dados restaurado com sucesso!');
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Falha ao processar arquivo de backup.');
      } finally {
        setRestoreLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <span>Configurações Gerais & Backup</span>
        </h2>
        <p className="text-xs text-stone-500">
          Personalize nome da igreja, dados do Pix, horários e rotinas de backup
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Status Aberto / Fechado */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>Disponibilidade para Pedidos</span>
          </h3>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <div className="font-bold text-xs text-stone-900">
                Lanchonete aberta para novos pedidos
              </div>
              <div className="text-[11px] text-stone-500">
                Se desativado, o cardápio continuará visível, mas clientes não poderão concluir novos pedidos
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleChange('isOpen', !formData.isOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                formData.isOpen
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-rose-600 text-white shadow-sm'
              }`}
            >
              {formData.isOpen ? 'ABERTA' : 'FECHADA'}
            </button>
          </div>
        </div>

        {/* Church & Branding */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Identidade Visual & Contato</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nome da Lanchonete</label>
              <input
                type="text"
                value={formData.lanchoneteName || ''}
                onChange={(e) => handleChange('lanchoneteName', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nome da Igreja</label>
              <input
                type="text"
                value={formData.churchName || ''}
                onChange={(e) => handleChange('churchName', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Mensagem de Boas-Vindas aos Irmãos</label>
            <input
              type="text"
              value={formData.welcomeMessage || ''}
              onChange={(e) => handleChange('welcomeMessage', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                value={formData.openingHours || ''}
                onChange={(e) => handleChange('openingHours', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.contactPhone || ''}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pix Configuration */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-teal-600" />
            <span>Dados Oficiais do Pix para Pagamentos</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Chave Pix</label>
              <input
                type="text"
                value={formData.pixKey || ''}
                onChange={(e) => handleChange('pixKey', e.target.value)}
                placeholder="financeiro@ibplanches.org.br"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-teal-500 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tipo de Chave Pix</label>
              <input
                type="text"
                value={formData.pixKeyType || 'E-mail'}
                onChange={(e) => handleChange('pixKeyType', e.target.value)}
                placeholder="E-mail, CNPJ, Celular ou Aleatória"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Favorecido / Titular</label>
              <input
                type="text"
                value={formData.pixReceiverName || ''}
                onChange={(e) => handleChange('pixReceiverName', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Instituição Financeira / Banco</label>
              <input
                type="text"
                value={formData.pixBankName || ''}
                onChange={(e) => handleChange('pixBankName', e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Gravando...' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </form>

      {/* App Sharing QR Code Section */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-orange-600" />
          <span>QR Code para Compartilhar o App com Clientes</span>
        </h3>
        <p className="text-xs text-stone-500">
          Exiba ou imprima este QR code para que os clientes acessem o cardápio e façam pedidos diretamente pelo celular.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-stone-50 rounded-2xl border border-stone-200">
          {appQrCodeUrl ? (
            <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm shrink-0">
              <img src={appQrCodeUrl} alt="QR Code do App" className="w-36 h-36 object-contain" />
            </div>
          ) : (
            <div className="w-36 h-36 bg-stone-200 rounded-2xl flex items-center justify-center text-xs text-stone-500 shrink-0">
              Gerando QR...
            </div>
          )}

          <div className="space-y-3 flex-1 text-center sm:text-left w-full">
            <div>
              <div className="text-xs font-bold text-stone-700">Link de Acesso do Aplicativo:</div>
              <div className="font-mono text-xs text-orange-600 bg-white p-2.5 rounded-xl border border-stone-200 mt-1 select-all break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.origin);
                    alert('Link copiado para a área de transferência!');
                  }
                }}
                className="bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link do App</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore Central */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4 pt-6">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-600" />
          <span>Backup & Restauração do Banco de Dados</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="font-bold text-xs text-stone-900">Exportar Backup Completo</h4>
            <p className="text-[11px] text-stone-500">
              Gera um arquivo JSON contendo todos os produtos, categorias, mesas, histórico de pedidos, insumos e configurações.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              <span>Baixar Arquivo JSON</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <h4 className="font-bold text-xs text-stone-900">Restaurar de um Backup</h4>
            <p className="text-[11px] text-stone-500">
              Recupera o banco de dados a partir de um arquivo JSON salvo anteriormente.
            </p>
            <label className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{restoreLoading ? 'Processando...' : 'Restaurar Arquivo'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
                disabled={restoreLoading}
              />
            </label>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
            <h4 className="font-bold text-xs text-rose-900">Zerar Base de Dados</h4>
            <p className="text-[11px] text-rose-700">
              Apaga todos os pedidos, caixas e despesas guardados no dispositivo para iniciar novos atendimentos.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (!confirm('ATENÇÃO: Deseja zerar toda a base de dados guardada no dispositivo? Todos os pedidos e caixas serão apagados permanentemente.')) return;
                try {
                  await api.resetDatabase();
                  alert('Base de dados zerada com sucesso!');
                  onRefresh();
                  window.location.reload();
                } catch (err: any) {
                  alert(err.message || 'Erro ao zerar base de dados.');
                }
              }}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar Dados do Dispositivo</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
