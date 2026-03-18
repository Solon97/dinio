const steps = [
  {
    num: "01",
    title: "Configure em 5 minutos",
    body: "Informe renda, gastos fixos e quanto quer guardar por mês. Só isso.",
  },
  {
    num: "02",
    title: "Use no WhatsApp todo dia",
    body: "Mande o gasto e receba, no mesmo retorno, quanto ainda pode gastar hoje.",
  },
  {
    num: "03",
    title: "O sistema cuida do resto",
    body: "Gastou acima da média? O Dinio recalibra automaticamente os próximos dias. Sem planilha, sem punição.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-neutral-50 border-y border-neutral-100 section-spacing" id="como-funciona">
      <div className="container-base">
        {/* Heading */}
        <div className="container-narrow mx-auto text-center mb-16 md:mb-20">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary-600 mb-4">
            <span className="w-4 h-px bg-primary-600" />
            Como funciona
            <span className="w-4 h-px bg-primary-600" />
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-neutral-900">
            Três passos. Sem complicação.
          </h2>
        </div>

        {/* Steps */}
        <div className="relative max-w-3xl mx-auto">
          {/* Connecting line — desktop */}
          <div
            className="hidden md:block absolute top-7 left-[calc(16.66%+1px)] right-[calc(16.66%+1px)] h-px border-t border-dashed border-neutral-300"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex flex-col items-center md:items-start text-center md:text-left gap-4"
                style={{ animation: `fadeInUp 0.5s ${i * 0.1}s ease-out both` }}
              >
                <div className="relative z-10 w-14 h-14 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                  <span className="font-display text-lg font-semibold text-neutral-300">
                    {step.num}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm font-normal text-neutral-500 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
