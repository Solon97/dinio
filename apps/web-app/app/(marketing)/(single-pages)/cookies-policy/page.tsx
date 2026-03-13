import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Política de Cookies | ${config.appName}`,
  canonicalUrlRelative: "/cookies-policy",
});

const CookiesPolicy = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <h1 className="text-3xl font-extrabold pb-6">
          Política de Cookies | {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Última atualização: 26 de fevereiro de 2026

Esta Política de Cookies explica como o Dinio utiliza cookies e tecnologias similares no website, no Diagnóstico Dinio e no aplicativo web.

1. O que são cookies

Cookies são pequenos arquivos armazenados no seu dispositivo para permitir funcionalidades, melhorar desempenho, lembrar preferências e medir uso do Serviço.

2. Categorias de cookies e tecnologias similares

2.1 Estritamente necessários
- Essenciais para segurança, autenticação, navegação e funcionamento básico do Serviço.
- Não podem ser desativados sem impactar funcionalidades essenciais.

2.2 Analytics (medição)
- Ajudam a entender uso de páginas, performance e comportamento agregado.
- Podem incluir ferramentas como PostHog, quando habilitadas.
- Dependem do seu consentimento quando exigido.

2.3 Suporte
- Permitem recursos de atendimento e suporte em tempo real.
- Podem incluir ferramentas como Crisp, quando habilitadas.
- Dependem do seu consentimento quando exigido.

3. Finalidades de uso

Usamos cookies para:
- manter sessão e segurança;
- lembrar preferências;
- melhorar experiência e usabilidade;
- analisar navegação para evolução do produto;
- oferecer suporte ao usuário.

4. Como gerenciar suas preferências

Você pode aceitar ou recusar categorias não essenciais pelo gerenciador de cookies do Dinio.
Também pode revisar ou alterar preferências posteriormente.

5. Base legal

No contexto da LGPD, cookies essenciais são tratados com base em execução do serviço e legítimo interesse, conforme aplicável.
Cookies não essenciais que dependam de escolha do usuário são tratados com base em consentimento.

6. Terceiros

Quando habilitadas, ferramentas de terceiros podem definir identificadores/cookies próprios conforme suas políticas.
Essas integrações são usadas para finalidades compatíveis com o Serviço e com esta Política.

7. Atualizações desta Política

Podemos atualizar esta Política de Cookies periodicamente. A versão vigente ficará disponível nesta página com data de atualização.

8. Contato

Para dúvidas sobre cookies e privacidade:
contato@dinio.com.br`}
        </pre>
      </div>
    </main>
  );
};

export default CookiesPolicy;
