import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Política de Privacidade | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <h1 className="text-3xl font-extrabold pb-6">
          Política de Privacidade | {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Última atualização: 26 de fevereiro de 2026

Esta Política de Privacidade descreve como o Dinio trata dados pessoais no website, no Diagnóstico Dinio e no aplicativo.

1. Quem controla os dados

O Dinio atua como controlador dos dados pessoais tratados para operação do Serviço, nos termos da LGPD (Lei nº 13.709/2018).

2. Quais dados tratamos

2.1 Dados de conta e autenticação
- nome e e-mail informados pelo provedor de login;
- identificadores técnicos de sessão/autenticação.

2.2 Dados de assinatura e cobrança
- informações necessárias para cobrança e gestão da assinatura;
- status da assinatura e histórico de eventos de pagamento.

Observação: dados completos de cartão são processados pelo Stripe e não ficam armazenados diretamente pelo Dinio.

2.3 Dados financeiros inseridos por você no app
- renda, gastos, despesas, lançamentos e demais informações usadas para cálculos e projeções do produto.

2.4 Dados do Diagnóstico Dinio
- renda mensal e gastos fixos informados para cálculo do diagnóstico.

No fluxo atual do Diagnóstico, esses dados são usados para cálculo imediato e armazenados temporariamente no navegador para exibição do resultado, sem cadastro obrigatório.

2.5 Dados técnicos e de navegação
- endereço IP, tipo de dispositivo, navegador, páginas visitadas e dados de interação, conforme as preferências de cookies e tecnologias similares.

3. Para que usamos os dados

Tratamos dados para:
- autenticar usuários e proteger contas;
- operar funcionalidades do app e do Diagnóstico;
- processar assinaturas, pagamentos e prevenção a fraude;
- prestar suporte;
- melhorar usabilidade, desempenho e comunicação do produto;
- cumprir obrigações legais e regulatórias.

4. Bases legais (LGPD)

As principais bases legais utilizadas incluem:
- execução de contrato e procedimentos preliminares;
- cumprimento de obrigação legal/regulatória;
- exercício regular de direitos;
- legítimo interesse, quando aplicável e com avaliação de impacto;
- consentimento, quando exigido (por exemplo, para determinadas tecnologias não essenciais).

5. Compartilhamento com terceiros (operadores e parceiros)

Podemos compartilhar dados estritamente necessários com parceiros que viabilizam o Serviço, como:
- infraestrutura e banco de dados (ex.: Supabase);
- autenticação (ex.: Google OAuth e Supabase, quando utilizado);
- pagamentos e assinatura (Stripe);
- métricas e comportamento de uso (ex.: PostHog, quando habilitado);
- atendimento ao cliente (ex.: Crisp, quando habilitado).

Esses parceiros tratam dados conforme instruções contratuais e finalidades compatíveis com esta Política.

6. Cookies e tecnologias similares

Utilizamos cookies essenciais e, quando permitido por você, cookies/tecnologias de analytics e suporte.
Para detalhes sobre categorias, finalidades e gestão de preferências, consulte a Política de Cookies.

7. Retenção e eliminação

Mantemos dados pelo tempo necessário para cumprir as finalidades desta Política, obrigações legais, auditoria, prevenção a fraudes e defesa em processos.
Quando possível e aplicável, dados são eliminados ou anonimizados após o término da necessidade de tratamento.

8. Segurança da informação

Adotamos medidas técnicas e organizacionais razoáveis para proteger dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida.

9. Direitos do titular

Nos termos da LGPD, você pode solicitar, entre outros:
- confirmação da existência de tratamento;
- acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação, quando cabível;
- portabilidade, quando aplicável;
- informação sobre compartilhamento;
- revogação de consentimento, quando o tratamento se basear em consentimento.

10. Crianças e adolescentes

O Serviço não é direcionado a crianças e adolescentes sem supervisão dos responsáveis legais. Caso identifiquemos tratamento indevido, adotaremos medidas cabíveis.

11. Alterações desta Política

Podemos atualizar esta Política periodicamente. A versão vigente ficará sempre disponível nesta página com a data de atualização.

12. Contato

Para dúvidas ou solicitações relacionadas a dados pessoais:
contato@dinio.com.br`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
