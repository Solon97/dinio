import type { SeoTool } from "@/libs/seoTools";
import { DiagnosisWizard } from "@/components/marketing/DiagnosisWizard";

interface SeoToolLayoutProps {
  tool: SeoTool;
}

export function SeoToolLayout({ tool }: SeoToolLayoutProps) {
  return (
    <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-base-100">
      <article className="max-w-3xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-base-content">
            {tool.h1}
          </h1>
          <p className="text-xl text-base-content/80 leading-relaxed max-w-2xl mx-auto">
            {tool.intro}
          </p>
        </header>

        {/* Interactive Tool Section */}
        <section className="bg-white rounded-3xl shadow-xl border border-base-300">
          <DiagnosisWizard />
        </section>

        {/* Explanatory Content Section */}
        <section className="prose prose-lg md:prose-xl prose-base max-w-none prose-headings:font-bold prose-headings:tracking-tight space-y-10">
          <div>
            <h2 className="text-3xl text-base-content mb-4">Como funciona ?</h2>
            <p className="text-base-content/80 leading-relaxed">
              {tool.howItWorks}
            </p>
          </div>

          <div>
            <h2 className="text-3xl text-base-content mb-4">
              Por que é importante ?
            </h2>
            <p className="text-base-content/80 leading-relaxed">
              {tool.whyItsImportant}
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
