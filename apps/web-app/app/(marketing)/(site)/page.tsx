import FinalCTA from "@/components/marketing/FinalCTA";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Objections from "@/components/marketing/Objections";
import TrialSection from "@/components/marketing/TrialSection";
import { getSEOTags, renderSchemaTags } from "@/libs/seo";

export const metadata = getSEOTags({
  canonicalUrlRelative: "/",
  title: "Quanto posso gastar hoje? | Dinio",
  description:
    "O Dinio calcula quanto você pode gastar hoje sem comprometer o fim do mês. Simples, no WhatsApp, sem planilha.",
  keywords: [
    "quanto posso gastar hoje",
    "assistente financeiro whatsapp",
    "controle financeiro pessoal simples",
    "app financeiro sem planilha",
    "controle financeiro",
    "finanças pessoais",
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
