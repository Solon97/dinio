export type SeoTool = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  howItWorks: string;
  whyItsImportant: string;
  contentParagraphs?: {
    problem: string;
    traditionalLimit: string;
    practicalCalculation: string;
    behaviorChange: string;
    faq: string;
  };
};

export const seoTools: SeoTool[] = [
  {
    slug: "quanto-posso-gastar-por-dia",
    title: "Quanto posso gastar por dia? Calculadora de orçamento diário | Dinio",
    description:
      "Descubra quanto posso gastar por dia com um cálculo simples de orçamento diário, sem planilha, para evitar que o dinheiro acabe antes do fim do mês.",
    h1: "Quanto posso gastar por dia?",
    intro:
      "Quer saber quanto pode gastar por dia sem correr o risco de ficar sem dinheiro antes do fim do mês? Use a calculadora abaixo para informar sua renda e seus gastos fixos. Em poucos segundos você verá um diagnóstico financeiro com seu limite diário de gastos.",
    howItWorks:
      "O cálculo é simples. Pegamos sua renda mensal e subtraímos os seus gastos fixos (como aluguel, contas e assinaturas). O valor restante é dividido pelos dias do mês. Assim você descobre qual é o valor máximo que pode gastar por dia sem comprometer o restante do orçamento.",
    whyItsImportant:
      "Quando você olha apenas para o saldo da conta, parece que sempre tem dinheiro disponível. Mas esse valor precisa durar o mês inteiro. Saber quanto pode gastar por dia ajuda a manter o controle do orçamento e evita surpresas no final do mês. Ao preencher os dados acima, você também verá um diagnóstico financeiro completo da sua situação atual.",
    contentParagraphs: {
      problem:
        "A dúvida sobre quanto posso gastar por dia aparece nos momentos mais comuns: mercado, transporte, farmácia e delivery. Sem uma referência clara, a decisão vira chute, e o dinheiro parece suficiente no começo do mês, mas desaparece na semana final.",
      traditionalLimit:
        "As soluções tradicionais pedem disciplina alta com planilha, categorias e revisão constante. Na rotina real, isso quebra rápido. O resultado é o mesmo ciclo: alguns dias de controle, depois abandono, e finalmente a sensação de que o dinheiro acabou sem explicação.",
      practicalCalculation:
        "O cálculo correto parte do que entra no mês, subtrai os compromissos fixos e separa uma reserva mínima. O valor que sobra é distribuído pelos dias restantes. Assim, você chega a um limite de gastos diários que cabe na sua realidade, não em uma regra genérica.",
      behaviorChange:
        "Quando esse número fica visível todos os dias, o comportamento muda sem drama. Você passa a decidir com calma, ajusta pequenas escolhas ao longo da semana e evita cortes bruscos no fim do mês. Controle de gastos deixa de ser peso e vira previsibilidade.",
      faq:
        "Perguntas comuns: o valor muda se eu gastar acima em um dia? Sim, o orçamento diário precisa recalibrar com o que já saiu. Posso usar com salário fixo? Sim, esse é o melhor cenário. Preciso de planilha? Não. O foco é simplicidade para decidir com segurança.",
    },
  },
  {
    slug: "controle-financeiro-pessoal",
    title: "Controle financeiro pessoal simples para salário fixo | Dinio",
    description:
      "Organize seu controle financeiro pessoal com um método direto: renda, fixos e orçamento diário para evitar excessos e saber quanto sobra do salário por dia.",
    h1: "Controle Financeiro Pessoal",
    intro:
      "Se você quer organizar suas finanças, o primeiro passo é entender sua situação atual. Informe sua renda mensal e seus gastos fixos para ver um diagnóstico financeiro simples e direto.",
    howItWorks:
      "A ferramenta calcula a base do seu controle financeiro: quanto entra por mês e quanto já está comprometido com contas fixas. A partir desses números, você descobre quanto realmente sobra para os gastos do dia a dia.",
    whyItsImportant:
      "Muitas pessoas tentam controlar os gastos sem ter clareza dos números. É como tentar melhorar a saúde sem saber seu peso ou pressão. O diagnóstico financeiro mostra exatamente onde você está hoje e qual é o espaço que ainda existe no seu orçamento.",
    contentParagraphs: {
      problem:
        "Controle financeiro pessoal costuma falhar porque a pessoa tenta resolver tudo de uma vez. Ela quer cortar gastos, guardar dinheiro e organizar contas ao mesmo tempo, sem saber o número base do mês. Sem esse ponto de partida, qualquer esforço vira frustração.",
      traditionalLimit:
        "Modelos antigos de controle focam em registrar cada detalhe, mas pouca gente sustenta isso por meses. Quando a ferramenta exige tempo demais, ela concorre com trabalho, casa e imprevistos. O método até parece completo, mas não funciona na vida corrida.",
      practicalCalculation:
        "Na prática, o caminho enxuto funciona melhor: listar salário fixo, descontar custos fixos e dividir o saldo útil pelos dias do período. Esse passo cria um orçamento diário acionável. Com ele, cada compra recebe contexto real antes de acontecer.",
      behaviorChange:
        "Com esse número em mãos, você para de reagir ao extrato e começa a agir com antecedência. Fica mais fácil dizer sim para o que importa e não para o que aperta o mês. O planejamento financeiro pessoal deixa de ser teoria e vira rotina objetiva.",
      faq:
        "Dúvidas frequentes: funciona para quem não gosta de planilha? Sim, porque o foco é decisão simples. Preciso anotar tudo no mesmo dia? O ideal é registrar o principal para manter o limite atualizado. E se minha renda variar? Ajuste a base sempre que ela mudar.",
    },
  },
  {
    slug: "planilha-controle-financeiro",
    title: "Planilha de controle financeiro ou app simples de finanças? | Dinio",
    description:
      "Veja uma alternativa à planilha de controle financeiro com app simples de finanças para calcular limite diário, organizar gastos mensais e reduzir surpresas.",
    h1: "Uma Alternativa Simples à Planilha de Controle Financeiro",
    intro:
      "Planilhas de controle financeiro funcionam, mas muitas pessoas acabam desistindo porque elas exigem tempo e atualização constante. Com a ferramenta abaixo, você pode descobrir sua situação financeira em poucos segundos.",
    howItWorks:
      "Em vez de criar tabelas e fórmulas, basta informar sua renda mensal e seus gastos fixos. A calculadora mostra quanto do seu dinheiro já está comprometido e quanto ainda está disponível para gastar.",
    whyItsImportant:
      "A maioria das pessoas abandona o controle financeiro porque ele parece complicado demais. Começar com uma visão simples do orçamento já ajuda a entender sua realidade financeira. Ao preencher os dados, você também verá um diagnóstico financeiro que mostra o equilíbrio do seu orçamento.",
    contentParagraphs: {
      problem:
        "Quem busca planilha de controle financeiro geralmente está cansado de terminar o mês sem entender para onde o salário foi. A intenção é boa, mas o dia a dia atropela. Sem um formato prático, o controle vira mais uma tarefa pendente na lista.",
      traditionalLimit:
        "Planilha funciona para quem gosta de montar fórmula, revisar abas e corrigir erros manuais. Para a maioria, isso cria atrito. Basta perder dois dias de anotação para o sistema inteiro ficar desatualizado, e a confiança no número cai junto.",
      practicalCalculation:
        "Uma alternativa simples de finanças usa a mesma lógica essencial sem complexidade: entrada mensal, despesas fixas e distribuição do saldo pelo período. O cálculo mostra rapidamente quanto ainda cabe no dia e evita decisões baseadas apenas no saldo bancário.",
      behaviorChange:
        "Quando o acompanhamento fica leve, você passa a manter consistência. Em vez de abrir a planilha só quando já estourou, você consulta o valor certo antes de gastar. Isso reduz ansiedade, melhora escolhas e protege o que precisa sobrar no fim do mês.",
      faq:
        "Perguntas comuns: preciso abandonar a planilha de vez? Não, você pode usar as duas por um tempo. Essa abordagem serve para iniciantes? Sim, porque simplifica o essencial. Ajuda quem tem salário fixo? Muito, pois transforma previsibilidade em controle diário.",
    },
  },
];
