const steps = [
  {
    num: "01",
    title: "Recebe o salário",
    body: "Promete que esse mês vai ser diferente.",
  },
  {
    num: "02",
    title: "Perde o controle",
    body: "Gastos pequenos que viram uma bola de neve.",
  },
  {
    num: "03",
    title: "Culpa e frustração",
    body: "O mês acaba e a conta não fecha.",
  },
];

const Problem = () => {
  return (
    <section className="bg-neutral-50 border-y border-neutral-100">
      <div className="container-base section-spacing">
        {/* Heading */}
        <div className="container-narrow mx-auto text-center mb-16 md:mb-20">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-neutral-900 mb-4">
            O dinheiro acaba antes do mês terminar?
          </h2>
          <p className="text-base sm:text-lg font-normal text-neutral-500 leading-relaxed">
            Você organiza tudo, mas o mês continua imprevisível.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Connecting line — desktop only */}
          <div
            className="hidden md:block absolute top-7 left-[calc(16.66%+1px)] right-[calc(16.66%+1px)] h-px border-t border-dashed border-neutral-300"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex flex-col items-center md:items-start text-center md:text-left gap-3"
                style={{ animation: `fadeInUp 0.5s ${i * 0.1}s ease-out both` }}
              >
                {/* Number bubble */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                  <span className="font-display text-lg font-semibold text-neutral-300">
                    {step.num}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-1">
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

        {/* Pull-quote transition */}
        <div className="mt-16 md:mt-20 container-narrow mx-auto text-center">
          <p className="font-display text-xl sm:text-2xl md:text-3xl italic text-neutral-600 leading-snug">
            E se você soubesse{" "}
            <span className="not-italic font-semibold text-primary-600">
              exatamente quanto pode gastar
            </span>{" "}
            todo dia, sem culpa?
          </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;
