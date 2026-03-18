"use client";

import { useState } from "react";

const objections = [
  {
    question: "Já tentei app financeiro e abandonei",
    answer:
      "O uso diário do Dinio acontece no WhatsApp, em segundos. Sem tela complexa pra abrir, sem categorizar tudo. Você manda o gasto como manda uma mensagem para qualquer pessoa.",
  },
  {
    question: "Não quero ficar preso a um limite rígido",
    answer:
      "Não é limite rígido. É uma média recomendada que se ajusta ao seu gasto real ao longo do mês. Gastou mais hoje? O sistema recalibra amanhã, sem drama.",
  },
  {
    question: "Tenho medo de virar mais uma tarefa",
    answer:
      "Registrar o gasto e receber a orientação acontecem no mesmo retorno. São segundos — menos tempo do que você gasta decidindo se pode ou não fazer uma compra.",
  },
  {
    question: "E se eu gastar acima da média em alguns dias?",
    answer:
      "Tudo bem. O Dinio recalibra automaticamente os próximos dias para manter o mês sustentável. Nenhum dia é tratado como falha — é só um ajuste.",
  },
  {
    question: "Por que usar isso se já tenho extrato do banco?",
    answer:
      "Extrato mostra o que já aconteceu. O Dinio responde a decisão que você precisa tomar agora: quanto pode gastar hoje sem comprometer o resto do mês.",
  },
];

const Item = ({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <li className="border-b border-neutral-100 last:border-0">
    <button
      className="flex items-center gap-4 w-full py-4 text-left group"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span
        className={`shrink-0 w-0.5 h-6 rounded-full transition-colors duration-200 ${
          isOpen ? "bg-primary-600" : "bg-transparent group-hover:bg-neutral-200"
        }`}
        aria-hidden="true"
      />
      <span
        className={`flex-1 text-base font-semibold transition-colors ${
          isOpen ? "text-neutral-900" : "text-neutral-600 group-hover:text-neutral-800"
        }`}
      >
        {question}
      </span>
      <svg
        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
          isOpen ? "rotate-180 text-primary-600" : "text-neutral-300"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {isOpen && (
      <p className="pl-5 pb-4 text-sm font-normal text-neutral-500 leading-relaxed">
        {answer}
      </p>
    )}
  </li>
);

const Objections = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white section-spacing" id="perguntas">
      <div className="container-base">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary-600 mb-4">
              <span className="w-4 h-px bg-primary-600" />
              Perguntas comuns
              <span className="w-4 h-px bg-primary-600" />
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              Respostas diretas
            </h2>
          </div>

          <ul>
            {objections.map((item, i) => (
              <Item
                key={item.question}
                question={item.question}
                answer={item.answer}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Objections;
