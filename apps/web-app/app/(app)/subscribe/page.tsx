"use client";

import ButtonCheckout from "@/components/shared/ButtonCheckout";
import WhatsAppMockup from "@/components/marketing/WhatsAppMockup";
import config from "@/config";
import { formatBRL } from "@/libs/currency";
import { Shield, TrendingUp, Zap } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Teto diário na mão",
    description:
      "Você já sabe: perguntou, o Dinio responde na hora quanto você ainda pode gastar hoje.",
  },
  {
    icon: Zap,
    title: "Foque no hoje",
    description:
      "Seu foco é só no limite do dia, o Dinio cuida do cálculo do mês inteiro.",
  },
  {
    icon: Shield,
    title: "Sem surpresas na fatura",
    description:
      "Mantenha seus gastos sob controle e evite chateações ao abrir o app do banco.",
  },
];

export default function SubscribePage() {
  const plan =
    config.stripe.plans.find((p) => p.id === "default_yearly") ||
    config.stripe.plans[0];
  
  const features =
    plan?.features
      .map((f) => f.name)
      .filter((f) => !f.toLowerCase().includes("teste grátis")) ?? [];

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col font-normal text-neutral-900">
      {/* Hero Section */}
      <section className="bg-white section-spacing overflow-hidden">
        <div className="container-base">
          <div className="flex flex-col lg:grid lg:grid-cols-[55%_45%] gap-14 lg:gap-12 items-center">
            {/* Left — copy */}
            <div
              className="flex flex-col gap-7"
              style={{ animation: "fadeInUp 0.5s ease-out both" }}
            >
              {/* Label */}
              <div className="flex items-center gap-3">
                <span className="block w-5 h-px bg-primary-600" />
                <span className="text-xs font-semibold tracking-widest uppercase text-primary-600">
                  Sua assinatura acabou
                </span>
              </div>

              {/* H1 */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-neutral-900">
                Sente falta de saber se pode gastar?{" "}
                <em className="not-italic text-primary-600">Reative o Dinio.</em>
              </h1>

              {/* Body */}
              <p className="text-lg text-neutral-500 leading-relaxed max-w-md">
                Volte a ter o controle do seu orçamento diário direto no
                WhatsApp. Sem planilhas, sem stress.
              </p>

              {/* CTA */}
              <div className="flex flex-col items-start gap-3">
                <div className="w-full sm:w-auto sm:min-w-64">
                  <ButtonCheckout recurrency="yearly" text="Reativar assinatura" />
                </div>
                <p className="text-sm text-neutral-400">
                  Acesso imediato · Cancele quando quiser
                </p>
              </div>
            </div>

            {/* Right — WhatsApp mockup */}
            <div
              className="w-full flex justify-center lg:justify-end"
              style={{ animation: "fadeInUp 0.6s 0.15s ease-out both" }}
            >
              <WhatsAppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-neutral-50 border-y border-neutral-100 section-spacing">
        <div className="container-base">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              Continue de onde parou
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5 text-primary-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-neutral-500 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white section-spacing" id="trial">
        <div className="container-base">
          <div className="max-w-sm mx-auto">
            {/* Card */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="h-0.5 bg-primary-600 w-full" />

              <div className="p-8">
                {/* Heading */}
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
                    Reative seu plano
                  </h2>
                </div>

                {/* Price */}
                <div className="text-center mb-6 pb-6 border-b border-neutral-100">
                  <div className="flex items-baseline justify-center gap-1.5 mb-1">
                    <span className="font-display text-5xl font-black text-neutral-900 tracking-tight">
                      {formatBRL(plan?.equivalentMonthlyPrice || 0)}
                    </span>
                    <span className="text-base text-neutral-400 font-medium">
                      /mês*
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    *Assinatura anual de {formatBRL(plan?.price || 0)}, equivalente
                    a {formatBRL(plan?.equivalentMonthlyPrice || 0)}/mês.
                  </p>
                </div>

                {/* Feature list */}
                <ul className="space-y-2.5 mb-6">
                  {features.map((f) => (
                    <li
                      key={f}
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
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <ButtonCheckout recurrency="yearly" text="Reativar assinatura" />

                {/* Guarantee */}
                <p className="text-xs text-neutral-400 text-center mt-4">
                  Garantia de 7 dias após a cobrança. Não curtiu a volta?
                  Devolvemos seu dinheiro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary-600 section-spacing-sm">
        <div className="container-base text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Volte a ter paz financeira
          </h2>
          <p className="text-primary-100 mb-8 text-lg font-normal">
            Reative agora e continue de onde parou.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <ButtonCheckout
                recurrency="yearly"
                text="Reativar assinatura"
                variant="outline-white"
              />
            </div>
            <p className="text-sm text-primary-200">
              Acesso imediato · sem risco
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
