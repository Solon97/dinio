import { notFound } from "next/navigation";
import { seoTools } from "@/libs/seoTools";
import { SeoToolLayout } from "@/components/seo/SeoToolLayout";
import { getSEOTags } from "@/libs/seo";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return seoTools.map((tool) => ({
    slug: tool.slug,
  }));
}

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tool = seoTools.find((t) => t.slug === slug);

  if (!tool) {
    return getSEOTags({
      title: "Ferramenta não encontrada | Dinio",
    });
  }

  return getSEOTags({
    title: tool.title,
    description: tool.description,
    canonicalUrlRelative: `/ferramentas/${tool.slug}`,
  });
}

export default async function FerramentaPage({ params }: Props) {
  const { slug } = await params;
  const tool = seoTools.find((t) => t.slug === slug);

  if (!tool) {
    notFound();
  }

  return <SeoToolLayout tool={tool} />;
}
