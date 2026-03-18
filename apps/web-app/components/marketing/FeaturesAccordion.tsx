"use client";

import { useState } from "react";
import type { JSX, ReactNode } from "react";

interface Feature {
  title: string;
  description: string;
  svg?: JSX.Element;
}

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
        className="w-5 h-5"
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
        className="w-5 h-5"
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
        className="w-5 h-5"
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
        className="w-5 h-5"
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
  index,
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
    <li className="border-b border-neutral-100 last:border-0">
      <button
        className={`flex items-center gap-4 w-full py-4 text-left transition-colors group ${
          isOpen ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
        }`}
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        {/* Left teal bar */}
        <span
          className={`shrink-0 w-0.5 h-8 rounded-full transition-colors duration-200 ${
            isOpen ? "bg-primary-600" : "bg-transparent group-hover:bg-neutral-200"
          }`}
          aria-hidden="true"
        />

        {/* Icon */}
        <span
          className={`shrink-0 transition-colors duration-200 ${
            isOpen ? "text-primary-600" : "text-neutral-400"
          }`}
        >
          {svg}
        </span>

        {/* Title */}
        <span className={`flex-1 text-base font-semibold ${isOpen ? "text-neutral-900" : ""}`}>
          <h3 className="inline">{title}</h3>
        </span>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-0 text-primary-600" : "-rotate-90 text-neutral-300"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded description */}
      {isOpen && (
        <p className="pl-10 pb-4 text-sm font-normal text-neutral-500 leading-relaxed">
          {feature.description}
        </p>
      )}
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
    <section className={`section-spacing ${className ?? "bg-white"}`} id="features">
      <div className="container-base">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary-600 mb-4">
            <span className="w-4 h-px bg-primary-600" />
            {badge}
            <span className="w-4 h-px bg-primary-600" />
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900">
            {title}
          </h2>
          <p className="mt-4 text-base sm:text-lg font-normal text-neutral-500 container-narrow mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start max-w-5xl mx-auto">
          {/* Accordion list */}
          <ul className="w-full lg:w-1/2">
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

          {/* Preview card */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Teal accent top bar */}
              <div className="h-0.5 bg-primary-600 w-full" />

              <div className="p-7 sm:p-8 min-h-80 flex flex-col">
                <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-6">
                  {features[featureSelected].title}
                </p>

                <div className="flex-1 flex items-center justify-center">
                  {/* Illustration 1 */}
                  {featureSelected === 0 && (
                    <div className="w-full space-y-3">
                      {[
                        { label: "💰 Renda Mensal", value: "R$ 5.000" },
                        { label: "🏠 Aluguel", value: "R$ 1.200" },
                        { label: "⚡ Contas Fixas", value: "R$ 800" },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between items-center py-2.5 border-b border-neutral-50 last:border-0"
                        >
                          <span className="text-sm text-neutral-500">{row.label}</span>
                          <span className="text-sm font-semibold text-neutral-800 tabular-nums">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Illustration 2 */}
                  {featureSelected === 1 && (
                    <div className="text-center">
                      <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-3">
                        Hoje você pode gastar
                      </p>
                      <p className="font-display text-5xl font-semibold text-primary-600 tabular-nums">
                        R$&nbsp;87,50
                      </p>
                      <p className="text-xs text-neutral-400 mt-3">
                        Considerando meta de economizar 10%
                      </p>
                    </div>
                  )}

                  {/* Illustration 3 */}
                  {featureSelected === 2 && (
                    <div className="text-center space-y-4">
                      <p className="text-sm text-neutral-500 italic">
                        &ldquo;Posso pedir delivery?&rdquo;
                      </p>
                      <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-full">
                        <svg
                          className="w-4 h-4 text-emerald-500 shrink-0"
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
                        <span className="text-sm font-semibold text-emerald-700">
                          Pode sim! Sobram R$&nbsp;52
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Illustration 4 */}
                  {featureSelected === 3 && (
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                          <p className="text-xs text-neutral-400 mb-1">Ontem gastou</p>
                          <p className="font-display text-2xl font-semibold text-rose-500 tabular-nums">
                            R$&nbsp;150
                          </p>
                        </div>
                        <svg
                          className="w-5 h-5 text-neutral-300 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        <div className="flex-1 p-4 rounded-xl bg-primary-50 border border-primary-100 text-center">
                          <p className="text-xs text-neutral-400 mb-1">Teto hoje</p>
                          <p className="font-display text-2xl font-semibold text-primary-600 tabular-nums">
                            R$&nbsp;65
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-center text-neutral-400">
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
