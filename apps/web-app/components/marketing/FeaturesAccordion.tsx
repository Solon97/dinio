"use client";

import { useState } from "react";
import type { JSX, ReactNode } from "react";

interface Feature {
  title: string;
  description: string;
  svg?: JSX.Element;
}

// Features do Dinio baseados nos benefícios do business_definition.md
const features = [
  {
    title: "Informe o essencial",
    description:
      "Apenas sua renda, gastos fixos e porcentagem de reserva mensais. O trabalho pesado o Dinio resolve.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
    ),
  },
  {
    title: "Receba seu teto diário",
    description:
      "O app calcula quanto você pode gastar por dia para chegar no fim do mês no azul.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Decida com segurança",
    description:
      "Antes de comprar, olhe o app. Se tiver saldo no dia, pode gastar sem culpa.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Ajuste automático",
    description:
      "Gastou demais hoje? O teto de amanhã se ajusta sozinho para você não estourar.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    ),
  },
] as Feature[];

const Item = ({
  feature,
  isOpen,
  setFeatureSelected,
}: {
  index: number;
  feature: Feature;
  isOpen: boolean;
  setFeatureSelected: () => void;
}) => {
  const { title, svg } = feature;

  return (
    <li>
      <button
        className={`relative flex gap-3 items-center w-full py-4 px-4 text-base font-medium text-left md:text-lg rounded-xl transition-all duration-200 ${
          isOpen
            ? "bg-[#f0fdfa] border border-[#99f6e4]"
            : "hover:bg-[#f8fafc] border border-transparent"
        }`}
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 ${
            isOpen ? "bg-[#0d9488] text-white" : "bg-[#f1f5f9] text-[#64748b]"
          }`}
        >
          {svg}
        </span>
        <span
          className={`flex-1 ${
            isOpen ? "text-[#0d9488] font-semibold" : "text-[#334155]"
          }`}
        >
          <h3 className="inline">{title}</h3>
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? "rotate-0 text-[#0d9488]" : "-rotate-90 text-[#94a3b8]"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </li>
  );
};

interface FeaturesAccordionProps {
  badge?: string;
  title?: ReactNode;
  subtitle?: string;
  className?: string;
}

const FeaturesAccordion = ({
  badge = "Como funciona",
  title = "O Dinio te ajuda a manter o equilíbrio",
  subtitle = "Organize suas finanças em poucos minutos e receba um teto de gastos diário para manter seu mês sob controle.",
  className,
}: FeaturesAccordionProps = {}) => {
  const [featureSelected, setFeatureSelected] = useState<number>(0);

  return (
    <section
      className={`section-spacing ${className ?? "bg-base-100"}`}
      id="features"
    >
      <div className="container-base">
        <div className="text-center mb-10 md:mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[#ccfbf1] text-[#0f766e] text-sm font-semibold mb-4">
            {badge}
          </span>
          <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#0f172a]">
            {title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#64748b] container-narrow mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* Lista de features */}
          <ul className="w-full lg:w-1/2 space-y-2">
            {features.map((feature, i) => (
              <Item
                key={feature.title}
                index={i}
                feature={feature}
                isOpen={featureSelected === i}
                setFeatureSelected={() => setFeatureSelected(i)}
              />
            ))}
          </ul>

          {/* Card visual do feature selecionado */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-8">
            <div className="bg-gradient-to-br from-[#f0fdfa] to-[#ccfbf1] rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#99f6e4] min-h-[380px] sm:min-h-[400px] flex flex-col">
              <div className="text-center flex flex-col flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-4">
                  {features[featureSelected].title}
                </h3>
                <p className="text-sm sm:text-base text-[#475569] leading-relaxed mb-6">
                  {features[featureSelected].description}
                </p>

                {/* Container de ilustração com altura fixa */}
                <div className="flex-1 flex items-center justify-center">
                  {/* Ilustração 1: Informe o essencial */}
                  {featureSelected === 0 && (
                    <div className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#475569]">
                            💰 Renda Mensal
                          </span>
                          <span className="text-sm font-semibold text-[#0f172a]">
                            R$ 5.000
                          </span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#475569]">
                            🏠 Aluguel
                          </span>
                          <span className="text-sm font-semibold text-[#0f172a]">
                            R$ 1.200
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#475569]">
                            ⚡ Contas Fixas
                          </span>
                          <span className="text-sm font-semibold text-[#0f172a]">
                            R$ 800
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ilustração 2: Receba seu teto diário */}
                  {featureSelected === 1 && (
                    <div className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
                      <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-2">
                        Hoje você pode gastar
                      </p>
                      <p className="text-3xl sm:text-4xl font-extrabold text-[#0d9488]">
                        R$ 87,50
                      </p>
                      <p className="text-xs text-[#64748b] mt-2">
                        Considerando meta de economizar 10%
                      </p>
                    </div>
                  )}

                  {/* Ilustração 3: Decida com segurança */}
                  {featureSelected === 2 && (
                    <div className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
                      <p className="text-sm text-[#475569] mb-3">
                        &quot;Posso pedir delivery?&quot;
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#d1fae5] rounded-full">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-semibold text-[#065f46] text-sm sm:text-base">
                          Pode sim! Sobram R$ 52
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ilustração 4: Ajuste automático */}
                  {featureSelected === 3 && (
                    <div className="w-full bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        <div className="text-center">
                          <p className="text-xs text-[#94a3b8]">Ontem gastou</p>
                          <p className="text-lg sm:text-xl font-bold text-[#f43f5e]">
                            R$ 150
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-[#94a3b8]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        <div className="text-center">
                          <p className="text-xs text-[#94a3b8]">
                            Teto para Hoje
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-[#0d9488]">
                            R$ 65
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-[#64748b] mt-3">
                        Recalculado para fechar o mês no azul
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesAccordion;
