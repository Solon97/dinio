import FinalCTA from "@/components/marketing/FinalCTA";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Objections from "@/components/marketing/Objections";
import TrialSection from "@/components/marketing/TrialSection";
import { getSEOTags, renderSchemaTags } from "@/libs/seo";

export const metadata = getSEOTags({
  canonicalUrlRelative: "/",
  title: "App de finanças pessoais | Dinio",
  description:
    "Dinio é um aplicativo de controle financeiro que calcula quanto você pode gastar hoje sem comprometer o fim do mês. Simples, no WhatsApp, sem planilha.",
  keywords: [
    "app de finanças pessoais",
    "orçamento diário",
    "controle financeiro",
    "aplicativo de controle financeiro",
    "organizar gastos mensais",
  ],
});

export default function Home() {
  return (
    <>
      {renderSchemaTags()}
      <Hero />
      <HowItWorks />
      <Objections />
      <TrialSection />
      <FinalCTA />
    </>
  );
}
