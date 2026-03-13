"use client";

import FAQ from "@/components/marketing/FAQ";
import FeaturesAccordion from "@/components/marketing/FeaturesAccordion";
import { CompactPlanCard } from "@/components/shared/PlanCard";
import config from "@/config";
import { formatBRL } from "@/libs/currency";
import {
  calculateDiagnostico,
  DiagnosticoResult,
} from "@/libs/diagnosticoService";
import { trackCompleteRegistration } from "@/libs/pixel";
import { posthogEvents } from "@/libs/posthog";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  DollarSign,
  PiggyBank,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";

const DIAGNOSTICO_STORAGE_KEY = "dinio:diagnostico:last-input";
const DIAGNOSTICO_STORAGE_MAX_AGE_IN_MINUTES = 30;

interface DiagnosticoStoredInput {
  income: number;
  fixedExpenses: number;
  createdAt: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "critical":
      return {
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-100",
        icon: <AlertCircle className="w-12 h-12 text-red-500 mb-4" />,
        title: "Situação crítica",
        description:
          "A maior parte da sua renda está comprometida.\nVocê tem pouca margem para gastos do dia a dia, o que pode levar a estresse e surpresas no fim do mês.",
        bridgeHeadline:
          "Acompanhar diariamente é essencial para evitar surpresas",
        bridgeDescription:
          "Com o teto diário atualizado automaticamente, você tem um guia claro do quanto pode gastar em cada dia",
        ctaHeadline: "Retome o controle do seu dinheiro",
        ctaSubtitle:
          "Seu orçamento já está calculado.\nDeixe o Dinio administrar o controle diário pra você.",
      };
    case "warning":
      return {
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100",
        icon: <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />,
        title: "Atenção",
        description:
          "Os gastos fixos estão começando a pressionar seu orçamento.\nCada novo gasto sem referência pode levar a surpresas no fim do mês.",
        bridgeHeadline:
          "Você está perto do limite.\nMonitorar cada dia faz diferença.",
        bridgeDescription:
          "Com o teto diário atualizado automaticamente, você sabe exatamente quando pode gastar e quando precisa segurar.",
        ctaHeadline: "Evite ultrapassar o teto sem perceber",
        ctaSubtitle:
          "Seu orçamento já está calculado.\nDeixe o Dinio administrar o controle diário pra você.",
      };
    default:
      return {
        textColor: "text-teal-700",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-100",
        icon: <CheckCircle className="w-12 h-12 text-teal-500 mb-4" />,
        title: "Equilíbrio saudável",
        description:
          "Seus gastos fixos estão equilibrados\nO Dinio garante que continue assim",
        bridgeHeadline: "Equilíbrio não é sorte, é consistência",
        bridgeDescription:
          "Com o teto diário atualizado automaticamente, sua margem vai para reserva, não para gastos impulsivos no final do mês.",
        ctaHeadline: "Transforme sua margem em reserva de verdade",
        ctaSubtitle:
          "Seu orçamento já está calculado.\nDeixe o Dinio administrar o controle diário pra você.",
      };
  }
};

export default function ResultadoContent() {
  const router = useRouter();
  const [result, setResult] = useState<DiagnosticoResult | null>(null);
  const hasTrackedCompleteRegistration = useRef(false);

  useEffect(() => {
    const rawInput = sessionStorage.getItem(DIAGNOSTICO_STORAGE_KEY);

    if (!rawInput) {
      router.replace("/diagnostico");
      return;
    }

    let parsedInput: DiagnosticoStoredInput;

    try {
      parsedInput = JSON.parse(rawInput) as DiagnosticoStoredInput;
    } catch {
      router.replace("/diagnostico");
      return;
    }

    const createdAt = new Date(parsedInput.createdAt).getTime();
    const now = Date.now();
    const maxAge = DIAGNOSTICO_STORAGE_MAX_AGE_IN_MINUTES * 60 * 1000;

    if (!createdAt || now - createdAt > maxAge) {
      sessionStorage.removeItem(DIAGNOSTICO_STORAGE_KEY);
      router.replace("/diagnostico");
      return;
    }

    const income = Number(parsedInput.income);
    const fixedExpenses = Number(parsedInput.fixedExpenses);

    if (isNaN(income) || income <= 0) {
      router.replace("/diagnostico");
      return;
    }

    setResult(calculateDiagnostico(income, fixedExpenses));
  }, [router]);

  useEffect(() => {
    if (!result || hasTrackedCompleteRegistration.current) {
      return;
    }

    posthog.capture(posthogEvents.DIAGNOSIS_COMPLETED, {
      status: result.status,
    });

    if (result.dailyLimit >= 40) {
      trackCompleteRegistration();
      posthog.capture(posthogEvents.QUALIFIED_LEAD, {
        dailyLimit: result.dailyLimit,
        status: result.status,
      });
    }

    hasTrackedCompleteRegistration.current = true;
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="loading loading-spinner loading-lg text-teal-600"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(result.status);

  const stripePlan = config.stripe.plans.find((p) => p.id === "diagnosis");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Zone A — status + teto diário + distribuição */}
      <div className="py-12 px-4">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Status */}
          <div
            className={`text-center p-8 rounded-3xl ${statusInfo.bgColor} border ${statusInfo.borderColor}`}
          >
            <div className="flex justify-center">{statusInfo.icon}</div>
            <h1
              className={`text-3xl sm:text-4xl font-extrabold ${statusInfo.textColor} mb-2`}
            >
              {statusInfo.title}
            </h1>
            <p className="text-lg text-slate-700 font-medium whitespace-pre-wrap">
              {statusInfo.description}
            </p>
          </div>

          {/* Teto diário */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-teal-600"></div>

            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Seu teto diário ideal
            </p>

            <div className="text-5xl md:text-6xl font-black tracking-tight mb-4 text-[#0d9488]">
              {formatBRL(result.dailyLimit)}
            </div>

            <p className="text-sm text-slate-500 mb-1 max-w-sm mx-auto">
              {formatBRL(result.variableBudget)} divididos pela quantidade de
              dias do mês
            </p>
          </div>

          {/* Distribuição */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="flex justify-center mb-2">
                <Wallet className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm text-slate-500 mb-1">Gastos Fixos</div>
              <div className="text-xl font-bold text-slate-800">
                {result.fixedPercent.toFixed(0)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Comprometido</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-teal-400" />
              </div>
              <div className="text-sm text-slate-500 mb-1">Dia a Dia</div>
              <div className="text-xl font-bold text-slate-800">
                {formatBRL(result.variableBudget)}
              </div>
              <div className="text-xs text-slate-400 mt-1">80% do livre</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="flex justify-center mb-2">
                <PiggyBank className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-sm text-slate-500 mb-1">Reserva</div>
              <div className="text-xl font-bold text-slate-800">
                {formatBRL(result.reserve)}
              </div>
              <div className="text-xs text-slate-400 mt-1">20% do livre</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone B.5 — Bridge: connect diagnosis to product */}
      <div className="py-14 px-4 bg-white border-t border-b border-slate-100">
        <div className="max-w-xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug mb-3 whitespace-pre-wrap">
              {statusInfo.bridgeHeadline}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {statusInfo.bridgeDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center gap-2 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <RefreshCw className="w-6 h-6 text-teal-600" />
              <p className="text-sm font-semibold text-slate-800">
                Teto atualizado
              </p>
              <p className="text-xs text-slate-500">
                Baseado nos seus gastos reais, não em estimativas
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <DollarSign className="w-6 h-6 text-teal-600" />
              <p className="text-sm font-semibold text-slate-800">
                Controle dos Gastos Fixos
              </p>
              <p className="text-xs text-slate-500">
                Saiba o quanto os gastos fixos estão consumindo do seu orçamento
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-2 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <CalendarDays className="w-6 h-6 text-teal-600" />
              <p className="text-sm font-semibold text-slate-800">
                Agenda Financeira
              </p>
              <p className="text-xs text-slate-500">
                Todos os pagamentos do mês organizados por vencimento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone B — como funciona */}
      <FeaturesAccordion
        className="bg-slate-50"
        title="O Dinio pode te ajudar a manter o equilíbrio"
        subtitle="Você calculou seu limite diário. O Dinio garante que você se mantenha dentro dele, atualizando-o diariamente."
      />

      {/* Zone C — CTA + garantia */}
      <div className="py-12 px-4 bg-white border-t border-slate-100">
        <div className="max-w-md mx-auto w-full">
          <CompactPlanCard
            plan={stripePlan}
            ctaText="Quero começar agora"
            buttonOnClickTracking={() =>
              posthog.capture(posthogEvents.DIAGNOSIS_CTA_CLICKED, {
                status: result.status,
              })
            }
          />

          <div className="mt-12 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
            <div className="flex justify-center mb-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-emerald-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              Garantia de 30 dias
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Use o Dinio por 30 dias.
              <br />
              Se você não perceber mais clareza nas suas decisões, pode
              solicitar reembolso. Sem burocracia.
            </p>
          </div>
        </div>
      </div>

      {/* Zone D — FAQ (server-rendered, passed as prop) */}
      <FAQ className="bg-slate-50" />
    </main>
  );
}
