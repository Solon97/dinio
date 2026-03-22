import type { DriveStep } from "driver.js";

const SHARED_POPOVER = {
  showButtons: ["next", "previous", "close"] as (
    | "next"
    | "previous"
    | "close"
  )[],
  nextBtnText: "Próximo →",
  prevBtnText: "← Voltar",
  doneBtnText: "Concluir",
};

export const DAILY_STEPS: DriveStep[] = [
  {
    element: "#onboarding-daily-limit",
    popover: {
      ...SHARED_POPOVER,
      title: "Sua referência para hoje",
      description:
        "Esta é a média de gastos ideal para hoje. Ela nasce do seu planejamento do mês e mostra quanto você pode gastar no dia para manter a estratégia equilibrada.",
    },
  },
  {
    element: "#onboarding-daily-spent",
    popover: {
      ...SHARED_POPOVER,
      title: "Seu ritmo real de gastos",
      description:
        "Aqui você compara sua média atual com a média ideal do dia. Se estiver acima, vale desacelerar nos próximos dias. Se estiver abaixo, você ganhou folga no mês.",
    },
  },
  {
    element: "#onboarding-daily-balance",
    popover: {
      ...SHARED_POPOVER,
      title: "O que ainda resta no mês",
      description:
        "Este saldo mostra quanto ainda resta do orçamento de gastos diários no mês. Ele cai conforme você gasta e deixa claro quanto ainda há para distribuir até o fim do período.",
    },
  },
  {
    element: "#onboarding-daily-chart",
    popover: {
      ...SHARED_POPOVER,
      title: "A projeção do seu mês",
      description:
        "Este gráfico mostra como o saldo evolui ao longo dos dias. Quando você gasta menos que a média ideal, sobra espaço para frente. Quando gasta mais, os próximos dias ficam mais apertados.",
    },
  },
  {
    element: "#view-toggle-month",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Agora veja o planejamento",
      description:
        "Clique em 'Mensal' para ver como a renda foi distribuída, acompanhar os insights do período e revisar seus compromissos do mês.",
    },
  },
];

export const MONTHLY_STEPS: DriveStep[] = [
  {
    element: "#onboarding-monthly-distribution",
    popover: {
      ...SHARED_POPOVER,
      title: "Visão estratégica do mês",
      description:
        "Aqui você vê como a renda do mês foi dividida entre gastos fixos, dia a dia e reserva. É o resumo visual da estratégia que sustenta o restante da operação.",
    },
  },
  {
    element: "#onboarding-monthly-insights",
    popover: {
      ...SHARED_POPOVER,
      title: "Leitura automática do mês",
      description:
        "O Dinio Insights interpreta seu ritmo, aponta projeções e sinaliza quando algo foge do planejamento. É uma leitura rápida para você agir antes do mês apertar.",
    },
  },
  {
    element: "#onboarding-monthly-expenses",
    popover: {
      ...SHARED_POPOVER,
      title: "Seus compromissos fixos",
      description:
        "Aqui ficam os gastos fixos do mês, separados entre obrigatórios e dispensáveis. Essa divisão ajuda você a enxergar o que é compromisso inegociável e onde ainda existe margem de ajuste.",
    },
  },
  {
    element: "#onboarding-monthly-agenda",
    popover: {
      ...SHARED_POPOVER,
      title: "Agenda financeira",
      description:
        "A agenda organiza os pagamentos do mês por vencimento. Ela concentra o que precisa ser pago e ajuda você a não perder prazo nem deixar compromisso escapar.",
    },
  },
  {
    element: "#view-toggle-year",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Veja sua evolução anual",
      description:
        "Clique em 'Anual' para comparar os meses entre si e entender a evolução da sua vida financeira ao longo do ano.",
    },
  },
];

export const YEARLY_STEPS: DriveStep[] = [
  {
    element: "#onboarding-yearly-chart",
    popover: {
      ...SHARED_POPOVER,
      title: "Sua evolução ao longo do ano",
      description:
        "Este gráfico coloca lado a lado a renda, os fixos, os gastos do dia a dia e a reserva de cada mês. Assim fica mais fácil enxergar padrões, comparar períodos e entender como o ano está evoluindo.",
    },
  },
  {
    element: "#onboarding-yearly-summary",
    popover: {
      ...SHARED_POPOVER,
      title: "Resultados consolidados do ano",
      description:
        "Aqui estão os totais do ano: renda acumulada, gastos totais e saldo acumulado. É o resumo para entender quanto entrou, quanto saiu e quanto sobrou no período.",
    },
  },
  {
    popover: {
      showButtons: ["next", "close"] as ("next" | "close")[],
      nextBtnText: "Concluir 🎉",
      title: "Você já viu o essencial do Dinio 🎉",
      description:
        "No diário você acompanha o ritmo. No mensal você ajusta a estratégia. No anual você enxerga a evolução. Use as três visões em conjunto para manter clareza sobre o seu dinheiro.",
    },
  },
];
