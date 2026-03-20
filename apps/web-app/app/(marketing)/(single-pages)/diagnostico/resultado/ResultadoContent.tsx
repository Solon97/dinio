"use client";

import FAQ from "@/components/marketing/FAQ";
import FeaturesAccordion from "@/components/marketing/FeaturesAccordion";
import WhatsAppMockup from "@/components/marketing/WhatsAppMockup";
import ButtonCheckout from "@/components/shared/ButtonCheckout";
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
import { type ReactNode, useEffect, useRef, useState } from "react";

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
        icon: <AlertCircle className="w-10 h-10 text-red-500" />,
        title: "Situação crítica",
        description:
          "Sua margem para o dia a dia está muito apertada.\nAumentar a renda ou renegociar dívidas são os caminhos mais indicados — mas mesmo essas ações só funcionam com controle diário. Sem saber para onde o dinheiro vai, qualquer melhora some antes de fazer diferença.",
        bridgeHeadline: "Controle diário é o pré-requisito para qualquer melhora durar",
        bridgeDescription:
          "Renegociar uma dívida ou aumentar a renda libera espaço — mas se os gastos do dia a dia continuarem sem referência, esse espaço some em semanas. Com o teto diário recalibrado automaticamente, você sabe exatamente o que fazer com cada centavo que sobrar.",
        ctaHeadline: "Comece pelo controle. O resto fica mais fácil.",
        ctaSubtitle: "Descubra em 5 minutos.",
      };
    case "warning":
      return {
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100",
        icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
        title: "Atenção",
        description:
          "Os gastos fixos estão começando a pressionar seu orçamento.\nCada novo gasto sem referência pode levar a surpresas no fim do mês.",
        bridgeHeadline: "Você está perto do limite. Monitorar cada dia faz diferença.",
        bridgeDescription:
          "Com o teto diário atualizado automaticamente, você sabe exatamente quando pode gastar e quando precisa segurar.",
        ctaHeadline: "Evite ultrapassar o teto sem perceber",
        ctaSubtitle: "Descubra em 5 minutos.",
      };
    default:
      return {
        textColor: "text-teal-700",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-100",
        icon: <CheckCircle className="w-10 h-10 text-teal-500" />,
        title: "Equilíbrio saudável",
        description:
          "Seus gastos fixos estão equilibrados.\nO Dinio garante que continue assim.",
        bridgeHeadline: "Equilíbrio não é sorte, é consistência",
        bridgeDescription:
          "Com o teto diário atualizado automaticamente, sua margem vai para reserva, não para gastos impulsivos no final do mês.",
        ctaHeadline: "Transforme sua margem em reserva de verdade",
        ctaSubtitle: "Descubra em 5 minutos.",
      };
  }
};

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary-600 mb-4">
    <span className="w-4 h-px bg-primary-600" />
    {children}
    <span className="w-4 h-px bg-primary-600" />
  </span>
);

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="loading loading-spinner loading-lg text-primary-600"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(result.status);
  const plan = config.stripe.plans.find((p) => p.id === "default_yearly");
  const planFeatures = plan?.features.map((f) => f.name) ?? [];

  const handleCtaTracking = () =>
    posthog.capture(posthogEvents.DIAGNOSIS_CTA_CLICKED, {
      status: result.status,
    });

  return (
    <main>
      {/* Zone A — Diagnóstico: status + teto diário + distribuição */}
      <section className="bg-white section-spacing">
        <div className="container-base">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <SectionLabel>Diagnóstico financeiro</SectionLabel>
            </div>

            {/* Status card */}
            <div
              className={`flex flex-col items-center text-center gap-4 p-6 sm:p-8 rounded-2xl border ${statusInfo.bgColor
                } ${statusInfo.borderColor}`}
            >
              <div className="shrink-0">{statusInfo.icon}</div>
              <div>
                <h1
                  className={`font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight ${statusInfo.textColor
                    } mb-2`}
                >
                  {statusInfo.title}
                </h1>
                <p className="text-base text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {statusInfo.description}
                </p>
              </div>
            </div>

            {/* Teto diário */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden text-center">
              <div className="h-0.5 bg-primary-600 w-full" />
              <div className="p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
                  Seu teto diário ideal
                </p>
                <div className="font-display text-6xl font-black tracking-tight text-primary-600 mb-3">
                  {formatBRL(result.dailyLimit)}
                </div>
                <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                  {formatBRL(result.variableBudget)} divididos pela quantidade
                  de dias do mês
                </p>
              </div>
            </div>

            {/* Distribuição */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm text-center">
                <Wallet className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
                <div className="text-xs text-neutral-500 mb-1">Gastos Fixos</div>
                <div className="text-xl font-bold text-neutral-800">
                  {result.fixedPercent.toFixed(0)}%
                </div>
                <div className="text-xs text-neutral-400 mt-1">Comprometido</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm text-center">
                <TrendingUp className="w-5 h-5 text-primary-400 mx-auto mb-2" />
                <div className="text-xs text-neutral-500 mb-1">Dia a Dia</div>
                <div className="text-xl font-bold text-neutral-800">
                  {formatBRL(result.variableBudget)}
                </div>
                <div className="text-xs text-neutral-400 mt-1">80% do livre</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm text-center">
                <PiggyBank className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <div className="text-xs text-neutral-500 mb-1">Reserva</div>
                <div className="text-xl font-bold text-neutral-800">
                  {formatBRL(result.reserve)}
                </div>
                <div className="text-xs text-neutral-400 mt-1">20% do livre</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone B — WhatsApp bridge: conecta resultado ao uso diário */}
      <section className="bg-neutral-50 border-y border-neutral-100 section-spacing">
        <div className="container-base">
          <div className="flex flex-col lg:grid lg:grid-cols-2 items-center gap-12 lg:gap-16 max-w-5xl mx-auto">
            {/* Copy */}
            <div className="flex flex-col gap-6">
              <div>
                <SectionLabel>No WhatsApp</SectionLabel>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-neutral-900">
                  {statusInfo.bridgeHeadline}
                </h2>
                <p className="mt-4 text-base text-neutral-500 leading-relaxed">
                  {statusInfo.bridgeDescription}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Teto atualizado diariamente</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Baseado nos seus gastos reais, não em estimativas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Controle dos Gastos Fixos</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Saiba quanto os fixos consomem do seu orçamento</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">Agenda Financeira</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Todos os pagamentos do mês organizados por vencimento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp mockup */}
            <div className="w-full flex justify-center lg:justify-end">
              <WhatsAppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Zone C — Como funciona */}
      <FeaturesAccordion
        badge="Como funciona"
        title="O Dinio garante que você se mantenha no equilíbrio"
        subtitle="Você calculou seu limite diário. O Dinio garante que você se mantenha dentro dele, atualizando-o diariamente."
      />

      {/* Zone D — CTA no padrão da landing */}
      <section className="bg-neutral-50 border-y border-neutral-100 section-spacing">
        <div className="container-base">
          <div className="text-center mb-10">
            <SectionLabel>Comece agora</SectionLabel>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              Seu orçamento já está calculado.{" "}
              <div></div>
              <span className="text-primary-600">
                Deixe o Dinio fazer o controle diário.
              </span>
            </h2>
          </div>

          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="h-0.5 bg-primary-600 w-full" />
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
                    {plan?.badge}
                  </h3>
                  <p className="text-sm font-normal text-neutral-500">
                    Sem compromisso. Cancele antes do trial acabar e não paga
                    nada.
                  </p>
                </div>

                <div className="text-center mb-6 pb-6 border-b border-neutral-100">
                  <div className="flex items-baseline justify-center gap-1.5 mb-1">
                    <span className="font-display text-5xl font-black text-neutral-900 tracking-tight">
                      {formatBRL(plan?.equivalentMonthlyPrice)}
                    </span>
                    <span className="text-base text-neutral-400 font-medium">
                      /mês*
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    *Depois do trial, cobrado {formatBRL(plan?.price)}/ano — o
                    que equivale a {formatBRL(plan?.equivalentMonthlyPrice)}/mês
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {planFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm font-normal text-neutral-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-primary-600 shrink-0 mt-0.5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <ButtonCheckout
                  recurrency="yearly"
                  text="Quero começar agora"
                  onClickTracking={handleCtaTracking}
                />

                <p className="text-xs text-neutral-400 text-center mt-4">
                  Garantia de 7 dias após a cobrança. Pediu reembolso,
                  devolvemos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone E — Fechamento no padrão FinalCTA */}
      <section className="bg-primary-600 section-spacing-sm">
        <div className="container-base text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {statusInfo.ctaHeadline}
          </h2>
          <p className="text-primary-100 mb-8 text-lg font-normal">
            {statusInfo.ctaSubtitle}
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <ButtonCheckout
                recurrency="yearly"
                text="Começar trial gratuito"
                variant="outline-white"
                onClickTracking={handleCtaTracking}
              />
            </div>
            <p className="text-sm text-primary-200">14 dias grátis · sem risco</p>
          </div>
        </div>
      </section>

      {/* Zone F — FAQ */}
      <FAQ className="bg-neutral-50" />
    </main>
  );
}
