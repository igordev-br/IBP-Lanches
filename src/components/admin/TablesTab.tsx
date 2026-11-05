import React, { useState } from 'react';
import { api } from '../../services/api.ts';
import { Table, AppSettings } from '../../types/index.ts';
import {
  QrCode,
  Plus,
  Printer,
  Download,
  RotateCw,
  ExternalLink,
  Check,
  MapPin,
  X,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react';

interface TablesTabProps {
  tables: Table[];
  settings: AppSettings | null;
  onRefresh: () => void;
}

export const TablesTab: React.FC<TablesTabProps> = ({ tables, settings, onRefresh }) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copiedLinkTableId, setCopiedLinkTableId] = useState<string | null>(null);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    setLoading(true);
    try {
      await api.createTable({
        number: newNumber.trim(),
        name: newName.trim() || `Mesa ${newNumber.trim().padStart(2, '0')}`,
      });
      setIsAddModalOpen(false);
      setNewNumber('');
      setNewName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditTable = (t: Table) => {
    setEditingTable(t);
    setEditNumber(t.number);
    setEditName(t.name);
    setEditActive(t.active);
    setIsEditModalOpen(true);
  };

  const handleSaveEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editNumber.trim()) return;
    setLoading(true);
    try {
      await api.updateTable(editingTable.id, {
        number: editNumber.trim().padStart(2, '0'),
        name: editName.trim() || `Mesa ${editNumber.trim().padStart(2, '0')}`,
        active: editActive,
      });
      setIsEditModalOpen(false);
      setEditingTable(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (t: Table) => {
    if (!confirm(`Tem certeza que deseja excluir a Mesa ${t.number} (${t.name})? Esta ação removerá o QR Code e o acesso à mesa.`)) {
      return;
    }
    try {
      await api.deleteTable(t.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir mesa');
    }
  };

  const handleRegenerateQr = async (tableId: string) => {
    try {
      const updated = await api.regenerateTableQr(tableId);
      if (selectedTable?.id === tableId) {
        setSelectedTable(updated);
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao regenerar QR Code');
    }
  };

  const handleToggleTable = async (table: Table) => {
    try {
      await api.updateTable(table.id, { active: !table.active });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status da mesa');
    }
  };

  const getTableUrl = (t: Table) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?mesa=${t.number}&token=${t.token}`;
  };

  const handleCopyLink = (t: Table) => {
    navigator.clipboard.writeText(getTableUrl(t));
    setCopiedLinkTableId(t.id);
    setTimeout(() => setCopiedLinkTableId(null), 2000);
  };

  const handleDownloadQr = (t: Table) => {
    if (!t.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = t.qrCodeDataUrl;
    link.download = `qrcode_mesa_${t.number}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Mesas & QR Codes Exclusivos</span>
          </h2>
          <p className="text-xs text-stone-500">
            Cada mesa possui um QR Code único e seguro para autoatendimento pelo celular
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Printable Sheet Button */}
          <button
            onClick={() => setIsPrintSheetOpen(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-orange-400" />
            <span>Folha de Impressão Geral</span>
          </button>

          {/* Add Table Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Mesa</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((tbl) => (
          <div
            key={tbl.id}
            className={`bg-white rounded-3xl border-2 p-4 flex flex-col justify-between shadow-xs transition hover:shadow-md ${
              tbl.active ? 'border-stone-200' : 'border-stone-200 opacity-60 bg-stone-50'
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {tbl.number}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-stone-900 leading-tight">
                    {tbl.name}
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    ID: {tbl.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleTable(tbl)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tbl.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}
                  title="Ativar/Desativar mesa"
                >
                  {tbl.active ? 'Ativa' : 'Inativa'}
                </button>
                <button
                  onClick={() => handleOpenEditTable(tbl)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
                  title="Editar mesa"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteTable(tbl)}
                  className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                  title="Excluir mesa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* QR Code Preview */}
            <div
              onClick={() => setSelectedTable(tbl)}
              className="py-4 flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="p-2 rounded-2xl bg-white border border-stone-200 shadow-xs group-hover:scale-105 transition duration-200">
                {tbl.qrCodeDataUrl ? (
                  <img
                    src={tbl.qrCodeDataUrl}
                    alt={`QR Code Mesa ${tbl.number}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-stone-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-orange-600 mt-2 flex items-center gap-1 group-hover:underline">
                <QrCode className="w-3.5 h-3.5" />
                <span>Clique para ampliar / imprimir</span>
              </span>
            </div>

            {/* Link & Quick Actions */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <button
                  onClick={() => handleCopyLink(tbl)}
                  className="flex-1 text-left truncate text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 p-1.5 rounded-lg border border-stone-200 transition flex items-center gap-1 font-mono text-[10px]"
                >
                  {copiedLinkTableId === tbl.id ? <Check className="w-3 h-3 text-emerald-600" /> : <ExternalLink className="w-3 h-3 text-stone-400" />}
                  <span className="truncate">{copiedLinkTableId === tbl.id ? 'Link copiado!' : getTableUrl(tbl)}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDownloadQr(tbl)}
                  className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 rounded-xl transition"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar PNG</span>
                </button>

                <button
                  onClick={() => handleRegenerateQr(tbl.id)}
                  className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                  title="Regenerar Token e QR Code"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-600" />
                Cadastrar Nova Mesa
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Número da Mesa (ex: 09) *
                </label>
                <input
                  type="text"
                  required
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="09"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Identificação / Local (opcional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Mesa 09 — Mezanino"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  {loading ? 'Gerando QR...' : 'Criar Mesa com QR Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {isEditModalOpen && editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 border border-stone-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-orange-600" />
                Editar Mesa {editingTable.number}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTable} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Número da Mesa *
                </label>
                <input
                  type="text"
                  required
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  placeholder="01"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nome / Localização da Mesa *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Mesa 01"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editTableActive"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="editTableActive" className="text-xs font-bold text-stone-700 cursor-pointer">
                  Mesa Ativa (disponível para pedidos)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Table QR Code Modal (for printing single stand) */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-stone-200 text-center space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Display da Mesa
              </span>
              <button onClick={() => setSelectedTable(null)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stand preview */}
            <div className="p-6 rounded-3xl bg-linear-to-b from-stone-900 to-stone-800 text-white space-y-3 shadow-xl">
              <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                {settings?.lanchoneteName || 'IBPLANCHES'}
              </div>
              <div className="text-xs font-bold text-stone-300">
                {settings?.churchName || 'Igreja Batista Pioneira'}
              </div>

              <div className="w-20 h-20 rounded-2xl bg-orange-600 text-white font-black text-3xl mx-auto flex items-center justify-center shadow-lg border-2 border-white/20 my-2">
                {selectedTable.number}
              </div>

              <div className="bg-white p-3 rounded-2xl mx-auto inline-block shadow-md">
                <img
                  src={selectedTable.qrCodeDataUrl}
                  alt={`QR Mesa ${selectedTable.number}`}
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="text-xs font-bold text-stone-200 pt-1">
                Aponte a câmera do seu celular para fazer seu pedido!
              </div>
              <div className="text-[10px] text-stone-400">
                Sem filas • Direto na sua mesa
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Display</span>
              </button>
              <button
                onClick={() => handleDownloadQr(selectedTable)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold px-3 py-2.5 rounded-xl text-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Table Printable Sheet Modal (A4 Folha de Impressão de Mesas) */}
      {isPrintSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 border border-stone-200 space-y-4 max-h-[95vh] flex flex-col">
            
            {/* Header controls (hidden in print) */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 print:hidden">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                  <Printer className="w-5 h-5 text-orange-600" />
                  Folha de QR Codes para Impressão de Mesas
                </h3>
                <p className="text-xs text-stone-500">
                  Pronto para imprimir em folha A4 e recortar para colocar nas mesas da lanchonete
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Folha A4</span>
                </button>
                <button
                  onClick={() => setIsPrintSheetOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-50 rounded-2xl print:bg-white print:p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables.filter((t) => t.active).map((tbl) => (
                  <div
                    key={tbl.id}
                    className="bg-white p-4 rounded-2xl border-2 border-stone-800 text-center space-y-2 flex flex-col items-center justify-between"
                  >
                    <div>
                      <div className="font-black text-sm uppercase text-orange-600 leading-tight">
                        {settings?.lanchoneteName || 'IBPLANCHES'}
                      </div>
                      <div className="text-[10px] text-stone-600 font-medium">
                        {settings?.churchName || 'Igreja Batista Pioneira'}
                      </div>
                    </div>

                    <div className="w-14 h-14 rounded-xl bg-stone-900 text-white font-black text-2xl flex items-center justify-center my-1">
                      {tbl.number}
                    </div>

                    <div className="p-1 bg-white border border-stone-200 rounded-xl">
                      <img
                        src={tbl.qrCodeDataUrl}
                        alt={`QR Mesa ${tbl.number}`}
                        className="w-32 h-32 object-contain"
                      />
                    </div>

                    <div className="text-[10px] font-bold text-stone-800 leading-tight pt-1">
                      Aponte a câmera do celular para pedir nesta mesa!
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
