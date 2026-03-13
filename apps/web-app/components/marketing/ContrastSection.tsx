import React from "react";

interface ContrastSectionProps {
  variant?: "light" | "dark";
  title?: string;
  subtitle?: string;
}

const TRADITIONAL_POINTS = [
  "Não define um limite diário claro para gastar",
  "Distribui a renda sem separar o que é fixo do que é variável",
  "Só revela o erro depois que o dinheiro já foi gasto",
  "Transforma cada compra em dúvida ou culpa",
];

const DINIO_POINTS = [
  "Mostra quanto você pode gastar hoje e recalcula automaticamente",
  "Organiza sua renda separando gastos fixos e variáveis",
  "Ajuda você a decidir antes de gastar",
  "Dá segurança para aproveitar sem comprometer o mês",
];

const ContrastSection = ({
  variant = "light",
  title = "Registrar não evita erros",
  subtitle = "Decidir antes é que muda o resultado",
}: ContrastSectionProps) => {
  const isDark = variant === "dark";

  return (
    <section
      className={
        isDark ? "bg-slate-900 py-16 lg:py-24" : "bg-base-100 py-16 lg:py-24"
      }
    >
      <div className="container px-8 mx-auto xl:px-5 max-w-screen-lg">
        <div className="text-center mb-16">
          <h2
            className={`font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6 ${
              isDark ? "text-white" : "text-base-content"
            }`}
          >
            {title}
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Coluna Controle Financeiro Tradicional */}
          <div className="bg-base-200/50 rounded-3xl p-8 border border-base-200">
            <div className="flex items-center gap-3 mb-6 opacity-70">
              <span className="text-2xl">📉</span>
              <h3 className="font-bold text-xl text-base-content/80">
                Controle Financeiro Tradicional
              </h3>
            </div>
            <ul className="space-y-4">
              {TRADITIONAL_POINTS.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-base-content/70"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 mt-0.5 shrink-0 text-error/60"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna Dinio */}
          <div className="bg-teal-50 rounded-3xl p-8 border border-teal-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
                  D
                </div>
                <h3 className="font-bold text-xl text-teal-900">Dinio</h3>
              </div>
              <ul className="space-y-4">
                {DINIO_POINTS.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-teal-800 font-medium"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5 mt-0.5 shrink-0 text-teal-600"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContrastSection;
