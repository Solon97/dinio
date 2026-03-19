import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Termos de Uso | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <h1 className="text-3xl font-extrabold pb-6">
          Termos de Uso | {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Última atualização: 26 de fevereiro de 2026

Estes Termos de Uso regulam o acesso e uso do website, do Diagnóstico Dinio e do aplicativo Dinio ("Serviço"). Ao utilizar o Serviço, você declara que leu e concorda com estes Termos.

1. Quem somos

O Dinio é um serviço digital de organização financeira pessoal que calcula um teto diário de gastos e oferece recursos para acompanhamento de orçamento mensal.

2. Elegibilidade e conta

Para usar recursos protegidos do app, você deve possuir conta válida e fornecer informações verdadeiras e atualizadas.
Você é responsável por manter a confidencialidade do seu acesso e por toda atividade realizada em sua conta.

3. Escopo do Serviço

O Dinio fornece ferramentas de apoio à organização financeira pessoal, incluindo o cálculo de teto diário e projeções baseadas nos dados inseridos por você.
O Serviço não constitui consultoria financeira, contábil, tributária, jurídica ou recomendação de investimento.

4. Planos, cobrança e cancelamento

As assinaturas são processadas por provedor de pagamento terceirizado (Stripe).
As condições comerciais vigentes (preço, periodicidade, renovação e benefícios) são exibidas na página de contratação no momento da compra.
Você pode cancelar a renovação automática a qualquer momento para evitar novas cobranças no próximo ciclo.

5. Garantia de 7 dias

Oferecemos garantia de 7 dias sem risco após a primeira cobrança, conforme a oferta vigente no momento da contratação.
Solicitações de reembolso dentro desse período podem ser feitas pelo contato oficial de suporte.

6. Regras de uso

Você concorda em:
- usar o Serviço apenas para fins lícitos e pessoais;
- não tentar acessar áreas, dados ou funcionalidades não autorizadas;
- não interferir na estabilidade, segurança ou disponibilidade do Serviço;
- não reproduzir, distribuir ou explorar comercialmente elementos do Serviço sem autorização.

7. Propriedade intelectual

Todo conteúdo, marca, interface, código e demais ativos do Dinio são protegidos por legislação aplicável e pertencem ao Dinio ou a seus licenciantes.
Este Termo não transfere titularidade de propriedade intelectual ao usuário.

8. Privacidade e dados

O tratamento de dados pessoais segue a legislação aplicável no Brasil, incluindo a LGPD (Lei nº 13.709/2018), e está detalhado na Política de Privacidade e na Política de Cookies.

9. Limitação de responsabilidade

Na máxima extensão permitida por lei, o Dinio não se responsabiliza por:
- decisões tomadas com base exclusiva em informações inseridas no Serviço;
- danos decorrentes de dados incorretos, incompletos ou desatualizados fornecidos pelo usuário;
- indisponibilidades temporárias, falhas de terceiros, manutenção ou eventos fora de seu controle razoável.

Nada nestes Termos limita direitos garantidos por lei ao consumidor.

10. Suspensão e encerramento

Podemos suspender ou encerrar o acesso em caso de violação destes Termos, uso indevido, fraude, risco de segurança ou exigência legal.

11. Alterações dos Termos

Podemos atualizar estes Termos periodicamente. A versão mais recente ficará disponível nesta página com a data de atualização.

12. Lei aplicável e foro

Estes Termos são regidos pelas leis da República Federativa do Brasil.

13. Contato

Para dúvidas sobre estes Termos, fale com:
contato@dinio.com.br`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
