"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readCookiePreferences,
  saveCookiePreferences,
} from "@/libs/cookiePreferences";

const CookieConsent = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [support, setSupport] = useState(false);

  useEffect(() => {
    const currentPreferences = readCookiePreferences();

    if (currentPreferences) {
      setAnalytics(currentPreferences.analytics);
      setSupport(currentPreferences.support);
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }

    setIsLoaded(true);
  }, []);

  const handleAcceptAll = () => {
    saveCookiePreferences({ analytics: true, support: true });
    setAnalytics(true);
    setSupport(true);
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    saveCookiePreferences({ analytics: false, support: false });
    setAnalytics(false);
    setSupport(false);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    saveCookiePreferences({ analytics, support });
    setIsVisible(false);
  };

  if (!isLoaded || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] md:left-6 md:right-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-lg md:p-5">
        <p className="text-sm text-slate-700">
          Usamos cookies essenciais para o funcionamento do Dinio e, com sua
          permissão, cookies de análise e suporte. Saiba mais em nossa{" "}
          <Link
            href="/cookies-policy"
            className="font-semibold text-teal-700 hover:underline"
          >
            Política de Cookies
          </Link>
          .
        </p>

        {showPreferences && (
          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Essenciais
                </p>
                <p className="text-xs text-slate-500">
                  Necessários para login, segurança e funcionamento básico.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                Sempre ativo
              </span>
            </div>

            <label className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Analytics
                </p>
                <p className="text-xs text-slate-500">
                  Ajuda a entender uso e melhorar o produto.
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary mt-1"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
              />
            </label>

            <label className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Suporte</p>
                <p className="text-xs text-slate-500">
                  Habilita chat e funcionalidades de atendimento.
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary mt-1"
                checked={support}
                onChange={(event) => setSupport(event.target.checked)}
              />
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white border-none"
          >
            Aceitar tudo
          </button>
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="btn btn-sm btn-ghost text-slate-700"
          >
            Recusar não essenciais
          </button>
          <button
            type="button"
            onClick={() => setShowPreferences((current) => !current)}
            className="btn btn-sm btn-ghost text-slate-700"
          >
            {showPreferences ? "Ocultar preferências" : "Personalizar"}
          </button>
          {showPreferences && (
            <button
              type="button"
              onClick={handleSavePreferences}
              className="btn btn-sm btn-outline border-slate-300 text-slate-700"
            >
              Salvar preferências
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
