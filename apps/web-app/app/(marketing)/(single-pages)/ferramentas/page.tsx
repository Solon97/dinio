import Link from "next/link";
import { seoTools } from "@/libs/seoTools";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Ferramentas de controle financeiro pessoal e orçamento diário | Dinio",
  description:
    "Acesse ferramentas de controle de gastos para saber quanto deve gastar por dia, definir limite de gastos diários e organizar as finanças.",
  canonicalUrlRelative: "/ferramentas",
});

export default function FerramentasHubPage() {
  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-base-100">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-base-content">
            Ferramentas de Planejamento Financeiro
          </h1>
          <p className="text-xl text-base-content/80 leading-relaxed max-w-2xl mx-auto">
            Utilize nossas calculadoras e simuladores gratuitos para organizar
            seu orçamento de forma clara, prática e sem depender de planilhas
            complexas.
          </p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2">
          {seoTools.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/ferramentas/${tool.slug}`}
                className="block h-full bg-base-200 border border-base-300 rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all duration-200 group"
              >
                <h2 className="text-2xl font-bold text-base-content group-hover:text-primary transition-colors mb-3">
                  {tool.h1}
                </h2>
                <p className="text-base-content/70">{tool.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
