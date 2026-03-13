import { DiagnosisWizard } from "@/components/marketing/DiagnosisWizard";

export default function DiagnosticoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 flex items-start justify-center pt-12">
      <div className="max-w-xl w-full space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            Descubra quanto você pode gastar por dia para sobrar dinheiro no fim
            do mês
          </h1>
          <p className="text-lg text-slate-600">
            Leva menos de 30 segundos. Sem cadastro.
          </p>
        </div>

        <DiagnosisWizard />
      </div>
    </main>
  );
}
