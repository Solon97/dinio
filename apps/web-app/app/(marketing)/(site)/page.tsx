import DiagnosisCTA from "@/components/marketing/DiagnosisCTA";
import FAQ from "@/components/marketing/FAQ";
import FeaturesAccordion from "@/components/marketing/FeaturesAccordion";
import Hero from "@/components/marketing/Hero";
import Pricing from "@/components/marketing/Pricing";
import Problem from "@/components/marketing/Problem";
import { getSEOTags, renderSchemaTags } from "@/libs/seo";

export const metadata = getSEOTags({
  canonicalUrlRelative: "/",
  title: "Dinio - Controle financeiro simples",
  keywords: [
    "controle financeiro",
    "orçamento pessoal",
    "teto de gastos",
    "finanças pessoais",
    "app de finanças",
    "organização financeira",
    "gastos fixos",
    "planejamento financeiro",
  ],
});

export default function Home() {
  return (
    <>
      {renderSchemaTags()}
      <Hero />
      <Problem />
      <FeaturesAccordion />
      <Pricing />
      <FAQ />
      <DiagnosisCTA />
    </>
  );
}
