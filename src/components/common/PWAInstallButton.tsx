import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Download, Smartphone, X, Share } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'navbar' | 'banner' }> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center justify-between gap-3 bg-amber-500 text-stone-900 px-4 py-2.5 rounded-xl shadow-md border border-amber-400">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-stone-950 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Instale o App IBPLanches!</span> Peça mais rápido direto da sua tela inicial.
            </div>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-1.5 bg-stone-900 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-stone-800 transition active:scale-95 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Instalar
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 text-amber-900 hover:bg-amber-500/30 dark:text-amber-300 px-2.5 py-1 text-xs font-semibold transition border border-amber-500/40"
        title="Instalar aplicativo na tela inicial"
      >
        <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 text-xs font-semibold transition border border-stone-300"
          title="Instalar no iPhone ou iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-orange-600" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                  Instalar no iPhone / Safari
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    Toque no botão <strong className="text-stone-900 inline-flex items-center gap-1">Compartilhar <Share className="w-3.5 h-3.5 inline text-blue-600" /></strong> na barra inferior do Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Role as opções e toque em <strong className="text-stone-900">"Adicionar à Tela de Início"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    Toque em <strong className="text-stone-900">"Adicionar"</strong> no canto superior direito para concluir.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700 shadow-sm transition active:scale-98"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
