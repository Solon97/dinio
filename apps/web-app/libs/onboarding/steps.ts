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

/** Number of pre-wizard steps in the setup flow (welcome + configure-btn). */
export const WIZARD_STEPS_OFFSET = 2;

export const SETUP_STEPS: DriveStep[] = [
  // Step 0 — Welcome overlay (no element anchor)
  {
    popover: {
      showButtons: ["next", "close"] as ("next" | "close")[],
      nextBtnText: "Vamos começar →",
      title: "Bem-vindo ao Dinio 👋",
      description:
        "O Dinio usa um método simples para que você nunca fique no escuro sobre seu dinheiro: com base na sua renda e despesas fixas, ele calcula um teto diário de gastos. Você decide com clareza. Vamos configurar o seu primeiro mês.",
    },
  },
  // Step 1 — Configure button (overlay blocks everything else)
  {
    element: "#onboarding-configure-btn",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Configure o mês",
      description:
        "Clique neste botão para iniciar a configuração. Você vai informar sua renda, organizar seus gastos fixos e definir a estratégia para o mês.",
    },
  },
  // Steps 2-5 — Inside the wizard (driver.js nav is disabled; wizard footer controls navigation)
  // Element anchors to the full modal so footer buttons remain clickable through the overlay.
  {
    element: "#onboarding-wizard-modal",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Tudo começa pelo que entra",
      description:
        "Antes de qualquer decisão, você precisa saber com o que pode contar. Registre sua renda mensal — a base de todo o planejamento. Use os botões abaixo para avançar.",
    },
  },
  {
    element: "#onboarding-wizard-modal",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Seus cartões, sem surpresas",
      description:
        "Cartões de crédito criam compromissos futuros. Ao cadastrá-los, o Dinio garante que as faturas sejam consideradas no cálculo — sem surpresas no fim do mês.",
    },
  },
  {
    element: "#onboarding-wizard-modal",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Proteja os compromissos fixos",
      description:
        "Aluguel, internet, assinaturas. São gastos certos que saem antes de tudo. O Dinio separa essas despesas do orçamento livre para que nunca comprometam o seu dia a dia.",
    },
  },
  {
    element: "#onboarding-wizard-modal",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Defina onde vai cada real disponível",
      description:
        "O que sobra após os fixos pode virar reserva ou orçamento diário. Essa proporção é a sua estratégia do mês. Clique em Concluir quando estiver pronto.",
    },
  },
];

export const DAILY_STEPS: DriveStep[] = [
  {
    element: "#onboarding-daily-limit",
    popover: {
      ...SHARED_POPOVER,
      title: "O número que guia o seu dia",
      description:
        "Este é o teto de hoje. Um único número que resume tudo: sua renda, seus fixos, sua reserva e os dias restantes. Se você ficar dentro dele, está no caminho certo.",
    },
  },
  {
    element: "#onboarding-daily-spent",
    popover: {
      ...SHARED_POPOVER,
      title: "Cada registro tem impacto real",
      description:
        "O que você registra aqui não é só controle — é a entrada de dados que recalcula o mês inteiro. Registrar um gasto redireciona o saldo dos dias seguintes automaticamente.",
    },
  },
  {
    element: "#onboarding-daily-balance",
    popover: {
      ...SHARED_POPOVER,
      title: "Quanto ainda cabe na estratégia",
      description:
        "Este saldo é o que resta do orçamento total de gastos diários para o mês. Ele diminui conforme você gasta — independente do dia. Ter esse número claro evita surpresas na última semana do mês.",
    },
  },
  {
    element: "#onboarding-daily-chart",
    popover: {
      ...SHARED_POPOVER,
      title: "O teto se adapta ao ritmo do mês",
      description:
        "Quando você gasta abaixo do teto, o sistema redistribui o saldo para os dias seguintes elevando o teto. Quando gasta acima, ele compensa. O gráfico mostra essa evolução em tempo real.",
    },
  },
  {
    element: "#view-toggle-month",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Agora veja o mês inteiro",
      description:
        "Clique em 'Mensal' para explorar a visão estratégica: como sua renda está distribuída, alertas automáticos e a saúde financeira do mês.",
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
        "Este gráfico mostra como sua renda está distribuída: quanto vai para fixos, quanto para o dia a dia e quanto para reserva. É a fotografia da sua estratégia financeira do mês.",
    },
  },
  {
    element: "#onboarding-monthly-insights",
    popover: {
      ...SHARED_POPOVER,
      title: "Análise automática para manter o equilíbrio",
      description:
        "O Dinio analisa seu padrão de gastos e gera alertas quando algo foge do planejado. Não é julgamento — é informação para que você possa agir antes que o mês desande.",
    },
  },
  {
    element: "#onboarding-monthly-expenses",
    popover: {
      ...SHARED_POPOVER,
      title: "Fixos obrigatórios e dispensáveis",
      description:
        "Seus gastos fixos são classificados em duas categorias: obrigatórios (compromissos inegociáveis como aluguel e internet) e dispensáveis (assinaturas e serviços que podem ser cortados). Essa distinção deixa claro onde há margem de manobra se o mês apertar.",
    },
  },
  {
    element: "#onboarding-monthly-agenda",
    popover: {
      ...SHARED_POPOVER,
      title: "Agenda financeira",
      description:
        "A agenda organiza todos os pagamentos do mês por data de vencimento. Use-a para nunca perder um prazo e manter suas contas em dia.",
    },
  },
  {
    element: "#view-toggle-year",
    popover: {
      showButtons: ["close"] as "close"[],
      title: "Veja sua evolução anual",
      description:
        "Clique em 'Anual' para acompanhar como suas finanças evoluem mês a mês ao longo do ano.",
    },
  },
];

export const YEARLY_STEPS: DriveStep[] = [
  {
    element: "#onboarding-yearly-chart",
    popover: {
      ...SHARED_POPOVER,
      title: "Sua evolução mês a mês",
      description:
        "Este gráfico compara renda, gastos fixos, gastos diários e reserva para cada mês do ano. Ele revela padrões que só ficam visíveis com o tempo — meses de alta, períodos de contenção e a tendência geral das suas finanças.",
    },
  },
  {
    element: "#onboarding-yearly-summary",
    popover: {
      ...SHARED_POPOVER,
      title: "Resultados consolidados do ano",
      description:
        "Renda total, gastos totais e saldo acumulado — os três números que resumem o desempenho financeiro do ano. O saldo acumulado é quanto sobrou de verdade após todos os meses.",
    },
  },
  {
    popover: {
      showButtons: ["next", "close"] as ("next" | "close")[],
      nextBtnText: "Concluir 🎉",
      title: "Parabéns! Você completou o tour 🎉",
      description:
        "Agora você conhece todas as visões do Dinio: o rastreio diário para decisões do dia a dia, o planejamento mensal para manter a estratégia e a visão anual para acompanhar sua evolução. Use cada uma delas para manter suas finanças sempre no azul.",
    },
  },
];
