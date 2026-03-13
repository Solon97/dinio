import config from "@/config";
import ButtonLeadModal from "./ButtonLeadModal";
import { CompactPlanCard } from "@/components/shared/PlanCard";

const defaultYearlyPlan = config.stripe.plans.find(
  (p) => p.id === "default_yearly",
);

const earlyAccessBenefits = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path
          fillRule="evenodd"
          d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
          clipRule="evenodd"
        />
      </svg>
    ),
    title: "Acesso prioritário",
    description: "Use o Dinio antes do lançamento oficial.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.193c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6a2.25 2.25 0 002.25-2.25v-6.75h-8.25z" />
      </svg>
    ),
    title: "Desconto exclusivo",
    description: "Garanta até 50% de desconto no plano anual.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
      >
        <path
          fillRule="evenodd"
          d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52a1.5 1.5 0 011.348 1.226V21.75a.75.75 0 01-1.135.644L12 18.195l-7.365 4.199a.75.75 0 01-1.135-.644V4.495a1.5 1.5 0 011.348-1.724z"
          clipRule="evenodd"
        />
      </svg>
    ),
    title: "Influencie o produto",
    description:
      "Sua opinião vai moldar as funcionalidades que você mais precisa.",
  },
];

const EarlyAccessSection = () => (
  <section
    className="bg-gradient-to-br from-[#f0fdfa] to-[#f8fafc] overflow-hidden"
    id="pricing"
  >
    <div className="container-base section-spacing">
      <div className="flex flex-col text-center w-full mb-10 md:mb-12">
        <span className="inline-block px-4 py-2 rounded-full bg-[#ccfbf1] text-[#0f766e] text-sm font-semibold mb-4 mx-auto">
          Acesso Antecipado
        </span>
        <h2 className="font-bold text-2xl sm:text-3xl lg:text-5xl tracking-tight text-[#0f172a]">
          Seja um dos primeiros a usar o Dinio
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#64748b] container-narrow mx-auto">
          Entre agora e desbloqueie benefícios exclusivos antes do lançamento
          oficial.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-10 md:mb-12 max-w-4xl mx-auto">
        {earlyAccessBenefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-white p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ccfbf1] rounded-lg sm:rounded-xl flex items-center justify-center text-[#0d9488] mb-3 sm:mb-4">
              {benefit.icon}
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#0f172a] mb-2">
              {benefit.title}
            </h3>
            <p className="text-[#64748b] text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* CTA Card */}
      <div className="relative max-w-md mx-auto">
        <div className="absolute -inset-[1px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e]"></div>
        <div className="relative bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl">
          <div className="text-center mb-6">
            <p className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-2">
              Junte-se a +20 pessoas
            </p>
            <p className="text-sm sm:text-base text-[#64748b]">
              que já garantiram acesso antecipado
            </p>
          </div>

          <ButtonLeadModal
            extraStyle="w-full text-sm sm:text-base"
            buttonText="Quero acesso antecipado"
          />

          <p className="text-center text-xs text-[#94a3b8] mt-4">
            Sem spam. Apenas novidades importantes sobre o lançamento.
          </p>
        </div>
      </div>

      {/* Social Proof */}
      {/* <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-[#e2e8f0] shadow-sm">
          <div className="flex -space-x-2">
            {[
              { initials: "MF", gradient: "from-violet-400 to-violet-600" },
              { initials: "RS", gradient: "from-teal-400 to-teal-600" },
              { initials: "LC", gradient: "from-amber-400 to-amber-600" },
              { initials: "JP", gradient: "from-rose-400 to-rose-600" },
              { initials: "AC", gradient: "from-blue-400 to-blue-600" },
            ].map((user, i) => (
              <div 
                key={i} 
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.gradient} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}
              >
                {user.initials}
              </div>
            ))}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-[#0f172a]">
              +50 pessoas na fila
            </span>
            <span className="text-xs text-[#64748b]">
              Últimos 7 dias
            </span>
          </div>
        </div>
      </div> */}
    </div>
  </section>
);

const PricingSection = () => (
  <section className="bg-[#f8fafc] overflow-hidden" id="pricing">
    <div className="container-base section-spacing">
      <div className="flex flex-col text-center w-full mb-10 md:mb-14">
        <span className="inline-block px-4 py-2 rounded-full bg-[#ccfbf1] text-[#0f766e] text-sm font-semibold mb-4 mx-auto">
          Preços
        </span>
        <h2 className="font-bold text-2xl sm:text-3xl lg:text-5xl tracking-tight text-[#0f172a]">
          Menos que um café por dia
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#64748b] container-narrow mx-auto font-medium">
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

      {/* Garantia */}
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
        <h3 className="font-bold text-lg text-slate-800 mb-2">
          Garantia de 30 dias
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Use o Dinio por 30 dias.
          <br />
          Se você não perceber mais clareza nas suas decisões, pode solicitar
          reembolso. Sem burocracia.
        </p>
      </div>
    </div>
  </section>
);

const Pricing = () => {
  return config.leadMode ? <EarlyAccessSection /> : <PricingSection />;
};

export default Pricing;
