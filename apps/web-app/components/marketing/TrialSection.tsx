import ButtonCheckout from "@/components/shared/ButtonCheckout";
import config from "@/config";

const plan = config.stripe.plans.find((p) => p.id === "default_yearly");

const features = config.stripe.plans.find((p) => p.id === "default_yearly")?.features.map((f) => f.name) ?? [];

const TrialSection = () => {
  return (
    <section className="bg-neutral-50 border-y border-neutral-100 section-spacing" id="trial">
      <div className="container-base">
        <div className="max-w-sm mx-auto">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-0.5 bg-primary-600 w-full" />

            <div className="p-8">
              {/* Heading */}
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
                {plan?.badge}
              </h2>
              <p className="text-sm font-normal text-neutral-500 mb-6">
                Sem compromisso. Cancele antes do trial acabar e não paga nada.
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-display text-4xl font-black text-neutral-900">
                  R$&nbsp;{plan?.price}
                </span>
                <span className="text-sm text-neutral-400">/ano depois do trial</span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-normal text-neutral-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-primary-600 shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <ButtonCheckout recurrency="yearly" text="Começar trial gratuito" />

              {/* Guarantee */}
              <p className="text-xs text-neutral-400 text-center mt-4">
                Garantia de 30 dias após a cobrança. Pediu reembolso, devolvemos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrialSection;
