"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type LinkState = "loading" | "success" | "error";

function buildSignInUrl(nextPath: string): string {
  return `/signin?next=${encodeURIComponent(nextPath)}`;
}

function WhatsAppLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<LinkState>("loading");
  const [message, setMessage] = useState("Validando vinculacao...");

  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  useEffect(() => {
    const consumeToken = async () => {
      if (!token) {
        setState("error");
        setMessage("Token invalido ou ausente.");
        return;
      }

      const response = await fetch("/api/bot/whatsapp-link/consume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        router.replace(
          buildSignInUrl(`/whatsapp-link?token=${encodeURIComponent(token)}`),
        );
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch((): null => null)) as {
          error?: string;
        } | null;
        setState("error");
        setMessage(body?.error ?? "Nao foi possivel concluir a vinculacao.");
        return;
      }

      setState("success");
      setMessage("WhatsApp conectado com sucesso ao seu Dinio.");
    };

    consumeToken().catch(() => {
      setState("error");
      setMessage("Nao foi possivel concluir a vinculacao.");
    });
  }, [router, token]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-slate-100 p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3 text-center">
          Vincular WhatsApp
        </h1>

        {state === "loading" && (
          <div className="flex flex-col items-center py-6 text-center">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">{message}</p>
            <p className="text-sm text-slate-500 mt-2">Aguarde alguns segundos...</p>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center pt-2 pb-2 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
            <p className="text-slate-800 font-medium mb-6">{message}</p>

            <div className="w-full text-left space-y-3 text-sm text-slate-700 bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6">
              <p className="font-semibold text-slate-900">O que você pode fazer agora:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-medium text-slate-800">Registrar gastos</span> enviando uma mensagem natural (ex: &ldquo;gastei 20 no ifood&rdquo;)</li>
                <li><span className="font-medium text-slate-800">Consultar seu orçamento</span> perguntando quanto você ainda pode gastar</li>
                <li><span className="font-medium text-slate-800">Simular compras</span> questionando se dá pra parcelar ou comprar algo</li>
              </ul>
            </div>
            
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center justify-center w-full rounded-lg bg-emerald-600 text-white px-4 py-3 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Ir para o dashboard
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
            <p className="text-rose-600 font-medium mb-6">{message}</p>
            
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center justify-center w-full rounded-lg bg-slate-900 text-white px-4 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Voltar ao dashboard
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function WhatsAppLinkFallback() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-slate-100 p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3 text-center">
          Vincular WhatsApp
        </h1>
        <div className="flex flex-col items-center py-6 text-center">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Validando vinculacao...</p>
          <p className="text-sm text-slate-500 mt-2">Aguarde alguns segundos...</p>
        </div>
      </section>
    </main>
  );
}

export default function WhatsAppLinkPage() {
  return (
    <Suspense fallback={<WhatsAppLinkFallback />}>
      <WhatsAppLinkContent />
    </Suspense>
  );
}
