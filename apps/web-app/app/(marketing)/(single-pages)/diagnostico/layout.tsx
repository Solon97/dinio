import { getSEOTags } from "@/libs/seo";
import { ReactNode } from "react";

export const metadata = getSEOTags({
  title: "Ferramenta de Planejamento Financeiro Pessoal | Diagnóstico Dinio",
  description: `Descubra quanto você pode gastar por dia sem comprometer o mês. 
Faça um diagnóstico financeiro gratuito e organize seu planejamento financeiro pessoal em menos de 2 minutos.`,
  canonicalUrlRelative: "/diagnostico",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
