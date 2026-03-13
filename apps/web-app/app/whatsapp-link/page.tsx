"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          Vincular WhatsApp
        </h1>
        <p className="text-slate-600 mb-6">{message}</p>

        {state === "loading" && (
          <p className="text-sm text-slate-500">Aguarde alguns segundos...</p>
        )}

        {state === "success" && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>Agora voce pode:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>registrar gastos</li>
              <li>consultar seu orcamento</li>
              <li>simular compras</li>
            </ul>
          </div>
        )}

        {state === "error" && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center rounded-lg bg-slate-900 text-white px-4 py-2 text-sm"
          >
            Voltar ao dashboard
          </button>
        )}
      </section>
    </main>
  );
}

function WhatsAppLinkFallback() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-slate-100 p-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          Vincular WhatsApp
        </h1>
        <p className="text-slate-600 mb-6">Validando vinculacao...</p>
        <p className="text-sm text-slate-500">Aguarde alguns segundos...</p>
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
