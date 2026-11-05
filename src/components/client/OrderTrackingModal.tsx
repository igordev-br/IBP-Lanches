import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { api } from '../../services/api.ts';
import { Order, PrepStatus, PaymentStatus, AppSettings } from '../../types/index.ts';
import { formatCurrency, formatDateTime } from '../../utils/formatters.ts';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Copy,
  Check,
  RotateCw,
  ChefHat,
  BellRing,
  ShoppingBag,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

interface OrderTrackingModalProps {
  settings: AppSettings | null;
  onClose: () => void;
  onNewOrder: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  settings,
  onClose,
  onNewOrder,
}) => {
  const { activeOrderId, activeOrderToken, isTrackingOpen } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll order every 4 seconds for live updates
  const fetchOrder = async (showLoadingState = false) => {
    if (!activeOrderId || !activeOrderToken) return;
    if (showLoadingState) setIsRefreshing(true);

    try {
      const data = await api.getOrder(activeOrderId, activeOrderToken);
      setOrder(data);
    } catch (err) {
      console.warn('Error fetching order update:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);
    const interval = setInterval(() => {
      fetchOrder(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeOrderId, activeOrderToken]);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProofError('Por favor, selecione uma imagem válida (JPG, PNG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setProofError('A imagem deve ter no máximo 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload payment proof
  const handleUploadProof = async () => {
    if (!activeOrderId || !activeOrderToken || !proofPreview) return;
    setUploadingProof(true);
    setProofError(null);

    try {
      const updated = await api.uploadPaymentProof(activeOrderId, activeOrderToken, proofPreview);
      setOrder(updated);
      setProofPreview(null);
    } catch (err: any) {
      setProofError(err.message || 'Erro ao enviar comprovante.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCopyPix = () => {
    if (settings?.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!activeOrderId || !isTrackingOpen) return null;

  // Prep Status steps
  const prepSteps: { status: PrepStatus; label: string; desc: string }[] = [
    { status: 'aguardando_confirmacao', label: 'Recebido', desc: 'Aguardando confirmação' },
    { status: 'confirmado', label: 'Confirmado', desc: 'Pedido aceito pela equipe' },
    { status: 'em_preparacao', label: 'Na Cozinha', desc: 'Sendo preparado com carinho' },
    { status: 'pronto', label: 'Pronto', desc: 'Pronto para entrega' },
    { status: 'entregue', label: 'Entregue', desc: 'Bom apetite!' },
  ];

  const getPrepStepIndex = (status: PrepStatus) => {
    if (status === 'cancelado') return -1;
    return prepSteps.findIndex((s) => s.status === status);
  };

  const currentPrepIndex = order ? getPrepStepIndex(order.prepStatus) : 0;

  // Payment Status details
  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pagamento_aprovado':
      case 'pago_no_caixa':
        return {
          label: 'Pagamento Confirmado',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
        };
      case 'comprovante_em_analise':
        return {
          label: 'Comprovante em Análise',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
        };
      case 'pagamento_recusado':
        return {
          label: 'Pagamento Não Reconhecido',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'Aguardando Pagamento',
          color: 'bg-stone-100 text-stone-700 border-stone-300',
          icon: Clock,
        };
    }
  };

  const paymentBadge = order ? getPaymentBadge(order.paymentStatus) : null;
  const PaymentIcon = paymentBadge?.icon || Clock;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto touch-manipulation cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Acompanhamento em Tempo Real
              </span>
              <button
                type="button"
                onClick={() => fetchOrder(true)}
                disabled={isRefreshing}
                className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
                title="Atualizar agora"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <h2 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <span>Pedido #{order ? order.orderNumber : activeOrderId.replace('PED-', '')}</span>
              {order && (
                <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full border border-orange-200">
                  Mesa {order.tableNumber}
                </span>
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-stone-200 text-stone-600 transition active:scale-90 cursor-pointer"
            aria-label="Fechar e voltar ao cardápio"
            title="Fechar e voltar ao cardápio"
          >
            <X className="w-5 h-5 text-stone-800" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400">
              <RotateCw className="w-8 h-8 animate-spin text-orange-500 mb-2" />
              <p className="text-xs font-semibold">Carregando status do seu pedido...</p>
            </div>
          ) : !order ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Não foi possível carregar os dados deste pedido.
            </div>
          ) : (
            <>
              {/* Order Cancellation alert if canceled */}
              {order.prepStatus === 'cancelado' && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Pedido Cancelado</h4>
                    <p className="text-xs mt-0.5 text-rose-700">
                      Este pedido foi cancelado pela administração da lanchonete. Se tiver dúvidas, consulte os atendentes no balcão.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Section 1: Preparo da Cozinha */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-orange-600" />
                    Status do Preparo
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>

                {order.prepStatus !== 'cancelado' ? (
                  <div className="space-y-3 pt-2">
                    {/* Visual Progress Steps */}
                    <div className="relative flex justify-between items-center px-1">
                      {/* Line */}
                      <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-stone-200 z-0">
                        <div
                          className="h-full bg-orange-600 transition-all duration-500"
                          style={{
                            width: `${(Math.max(0, currentPrepIndex) / (prepSteps.length - 1)) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Dots */}
                      {prepSteps.map((step, idx) => {
                        const isDone = idx <= currentPrepIndex;
                        const isCurrent = idx === currentPrepIndex;
                        return (
                          <div key={step.status} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                isCurrent
                                  ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-sm'
                                  : isDone
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-white border-2 border-stone-300 text-stone-400'
                              }`}
                            >
                              {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-bold ${
                                isCurrent
                                  ? 'text-orange-700'
                                  : isDone
                                  ? 'text-stone-800'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Active Step Description */}
                    <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-orange-500 animate-pulse" />
                        <div>
                          <div className="text-xs font-bold text-stone-900">
                            {prepSteps[currentPrepIndex]?.desc || 'Acompanhando preparo'}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Avisaremos assim que estiver pronto para saborear!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Status Section 2: Pagamento & Comprovante */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                    Status do Pagamento
                  </h3>
                  {paymentBadge && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${paymentBadge.color}`}
                    >
                      <PaymentIcon className="w-3 h-3" />
                      {paymentBadge.label}
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600">Forma escolhida:</span>
                    <span className="font-bold text-stone-900 uppercase">
                      {order.paymentMethod === 'pix' ? 'Pix Instantâneo' : order.paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Cartão na Maquininha'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-600">Valor total:</span>
                    <span className="font-extrabold text-sm text-orange-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  {order.cashChangeFor && (
                    <div className="flex justify-between items-center text-xs text-stone-500 pt-1 border-t border-stone-100">
                      <span>Troco solicitado para:</span>
                      <span className="font-semibold">{formatCurrency(order.cashChangeFor)}</span>
                    </div>
                  )}
                </div>

                {/* Pix Key and Receipt Upload if PIX */}
                {order.paymentMethod === 'pix' && (
                  <div className="space-y-3 pt-1">
                    
                    {/* Copy Pix Key Box */}
                    <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-900">Chave Pix:</span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold">
                          {settings?.pixKeyType || 'E-mail'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-teal-200">
                        <span className="font-mono text-xs text-stone-800 truncate select-all">
                          {settings?.pixKey || 'financeiro@ibplanches.org.br'}
                        </span>
                        <button
                          onClick={handleCopyPix}
                          className="flex items-center gap-1 text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded-md transition shrink-0 active:scale-95"
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedPix ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>

                    {/* Receipt Section */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800">
                          Comprovante de Pagamento
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {order.paymentProof
                            ? order.paymentProof.status === 'aprovado'
                              ? 'Aprovado pelo Caixa'
                              : order.paymentProof.status === 'rejeitado'
                              ? 'Rejeitado — Reenvie'
                              : 'Recebido / Em análise'
                            : 'Não enviado'}
                        </span>
                      </div>

                      {/* If proof was rejected, show admin explanation */}
                      {order.paymentProof?.status === 'rejeitado' && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
                          <div className="font-bold">Motivo informado pela equipe:</div>
                          <div>{order.paymentProof.rejectionReason || 'Comprovante ilegível ou valor divergente.'}</div>
                        </div>
                      )}

                      {/* If proof exists and is approved */}
                      {order.paymentProof?.status === 'aprovado' && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Comprovante conferido e aprovado com sucesso!</span>
                        </div>
                      )}

                      {/* If proof is in analysis */}
                      {order.paymentProof?.status === 'em_analise' && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Comprovante enviado! A equipe do caixa está conferindo.</span>
                        </div>
                      )}

                      {/* Upload / Re-upload form */}
                      {(!order.paymentProof || order.paymentProof.status === 'rejeitado') && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />

                          {proofPreview ? (
                            <div className="space-y-2">
                              <div className="relative rounded-lg overflow-hidden border border-stone-200 max-h-40 bg-stone-100 flex items-center justify-center">
                                <img
                                  src={proofPreview}
                                  alt="Pré-visualização do comprovante"
                                  className="max-h-40 object-contain"
                                />
                                <button
                                  onClick={() => setProofPreview(null)}
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                onClick={handleUploadProof}
                                disabled={uploadingProof}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2"
                              >
                                {uploadingProof ? (
                                  <>
                                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Enviando comprovante...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Confirmar e Enviar Comprovante</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full border-2 border-dashed border-stone-300 hover:border-teal-500 rounded-xl p-3 flex flex-col items-center justify-center text-stone-600 hover:text-teal-700 transition bg-stone-50 hover:bg-teal-50/50"
                            >
                              <Upload className="w-5 h-5 text-stone-400 mb-1" />
                              <span className="text-xs font-bold">
                                {order.paymentProof?.status === 'rejeitado'
                                  ? 'Tirar nova foto ou anexar comprovante'
                                  : 'Anexar comprovante do Pix (Foto ou Arquivo)'}
                              </span>
                              <span className="text-[10px] text-stone-400 mt-0.5">
                                JPG, PNG até 8MB
                              </span>
                            </button>
                          )}

                          {proofError && (
                            <div className="text-xs text-rose-600 font-semibold">{proofError}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Items in this order */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-orange-600" />
                  Itens do Pedido ({order.items.length})
                </h4>

                <div className="divide-y divide-stone-100 bg-stone-50 rounded-2xl border border-stone-200/80 p-3">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 text-xs">
                      <div className="flex justify-between font-bold text-stone-900">
                        <span>
                          {it.quantity}x {it.productName}
                        </span>
                        <span>{formatCurrency(it.totalItemPrice)}</span>
                      </div>
                      {it.selectedOptions && it.selectedOptions.length > 0 && (
                        <div className="text-[11px] text-stone-500 pl-3 mt-0.5">
                          {it.selectedOptions.map((o, oIdx) => (
                            <span key={oIdx} className="mr-2">
                              • {o.optionName} {o.price > 0 && `(+${formatCurrency(o.price)})`}
                            </span>
                          ))}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-[10px] text-amber-800 italic pl-3 mt-0.5">
                          Obs: {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order History Log */}
              {order.history && order.history.length > 0 && (
                <div className="space-y-1.5 text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <div className="font-bold text-stone-700 uppercase tracking-wider text-[10px] mb-1">
                    Histórico do Pedido
                  </div>
                  {order.history.map((h, i) => (
                    <div key={i} className="flex justify-between">
                      <span>• {h.action} ({h.actor})</span>
                      <span className="text-stone-400">{formatDateTime(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNewOrder();
            }}
            className="flex-1 bg-stone-900 hover:bg-stone-800 active:scale-98 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            Fazer Novo Pedido
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Voltar ao Cardápio"
          >
            <ArrowLeft className="w-4 h-4 text-stone-700" />
            <span>Voltar ao Cardápio</span>
          </button>
        </div>

      </div>
    </div>
  );
};
