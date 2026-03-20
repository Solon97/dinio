import { getSEOTags } from "@/libs/seo";
import { ReactNode } from "react";

export const metadata = getSEOTags({
  title: "Controle financeiro pessoal: quanto posso gastar por dia | Diagnóstico Dinio",
  description:
    "Faça um diagnóstico rápido de controle financeiro pessoal e descubra quanto pode gastar por dia sem comprometer o mês.",
  canonicalUrlRelative: "/diagnostico",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
