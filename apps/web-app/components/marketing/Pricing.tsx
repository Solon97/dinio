import config from "@/config";
import { CompactPlanCard } from "@/components/shared/PlanCard";

const defaultYearlyPlan = config.stripe.plans.find(
  (p) => p.id === "default_yearly",
);

const Pricing = () => (
  <section className="bg-[#f8fafc] overflow-hidden" id="pricing">
    <div className="container-base section-spacing">
      <div className="flex flex-col text-center w-full mb-10 md:mb-14">
        <span className="inline-block px-4 py-2 rounded-full bg-[#ccfbf1] text-[#0f766e] text-sm font-semibold mb-4 mx-auto">
          Preços
        </span>
        <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-5xl tracking-tight text-neutral-900">
          Menos que um café por dia
        </h2>
        <p className="mt-4 text-base sm:text-lg font-normal text-neutral-500 container-narrow mx-auto">
          Uma única decisão errada em um fim de semana pode custar mais do que o
          Dinio no mês inteiro.
        </p>
      </div>

      <div className="max-w-md mx-auto w-full">
        <CompactPlanCard
          plan={defaultYearlyPlan}
          ctaText={"Quero ter um ano diferente"}
        />
      </div>

      <div className="mt-12 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
        <div className="flex justify-center mb-3">
          <div className="bg-emerald-100 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-emerald-600"
            >
              <path
                fillRule="evenodd"
                d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h3 className="font-semibold text-lg text-slate-800 mb-2">
          Garantia de 30 dias
        </h3>
        <p className="text-slate-600 text-sm font-normal leading-relaxed">
          Use o Dinio por 30 dias. Se você não perceber mais clareza nas suas
          decisões, pode solicitar reembolso. Sem burocracia.
        </p>
      </div>
    </div>
  </section>
);

export default Pricing;
