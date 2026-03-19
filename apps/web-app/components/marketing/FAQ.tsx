"use client";

import config from "@/config";
import { useRef, useState } from "react";
import type { JSX } from "react";

interface FAQItemProps {
  question: string;
  answer: JSX.Element;
}

// FAQ baseado nas objeções do business_definition.md
const faqList: FAQItemProps[] = [
  {
    question:
      "Já tentei outros apps e nenhum funcionou. Por que o Dinio seria diferente?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        O Dinio não exige planilhas nem configurações complexas. Ele calcula
        automaticamente quanto você pode gastar por dia e se ajusta conforme
        seus gastos mudam. É simples assim: você só precisa olhar o número e
        seguir.
      </div>
    ),
  },
  {
    question: "Não tenho tempo pra ficar anotando cada gasto.",
    answer: (
      <p>
        Perfeito! O Dinio foi feito pra quem vive correndo. Você só precisa
        registrar o essencial — leva menos de 2 minutos por dia. O app faz todo
        o resto: calcula, ajusta e te avisa quando precisa.
      </p>
    ),
  },
  {
    question: "Eu não entendo nada de finanças.",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Melhor ainda! O Dinio fala com você de um jeito simples, sem jargões
        financeiros. Você não precisa aprender finanças. Só precisa saber quanto
        pode gastar hoje — e isso o Dinio responde.
      </div>
    ),
  },
  {
    question: "E se meus gastos variarem muito?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        O Dinio se adapta com você. Gastou mais num dia? Ele recalcula o teto
        diário automaticamente pra manter o equilíbrio até o fim do mês. Sem
        julgamentos, só ajustes inteligentes.
      </div>
    ),
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: (
      <p>
        Sim! Você pode cancelar a qualquer momento, sem burocracia. E se mudar de ideia nos primeiros 7 dias após a cobrança, devolvemos 100% do seu dinheiro.
      </p>
    ),
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-[#e2e8f0]"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 ${isOpen ? "text-[#0d9488]" : "text-[#1e293b]"}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto ${
            isOpen ? "text-[#0d9488]" : "text-[#94a3b8]"
          }`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed text-[#64748b]">
          {item?.answer}
        </div>
      </div>
    </li>
  );
};

const FAQ = ({ className }: { className?: string } = {}) => {
  return (
    <section className={className ?? "bg-white"} id="faq">
      <div className="container-base section-spacing">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-5xl mx-auto">
          <div className="flex flex-col text-center lg:text-left lg:basis-2/5 lg:shrink-0">
            <span className="inline-block px-4 py-2 rounded-full bg-[#ccfbf1] text-[#0f766e] text-sm font-semibold mb-4 w-fit mx-auto lg:mx-0">
              Dúvidas
            </span>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a]">
              Perguntas Frequentes
            </p>
            <p className="mt-4 text-sm sm:text-base text-[#64748b]">
              Tem outra dúvida?{" "}
              <a
                href={`mailto:${config.resend.supportEmail}`}
                className="text-[#0d9488] font-medium hover:underline"
              >
                Entre em contato
              </a>
            </p>
          </div>

          <ul className="lg:basis-3/5">
            {faqList.map((item, i) => (
              <FaqItem key={i} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
