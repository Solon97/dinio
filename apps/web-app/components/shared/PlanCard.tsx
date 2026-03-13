import { formatBRL } from "@/libs/currency";
import ButtonCheckout from "./ButtonCheckout";
import config from "@/config";

type Plan = (typeof config.stripe.plans)[0];

interface PlanCardProps {
  plan: Plan;
  ctaText?: string;
  buttonOnClickTracking?: () => void;
}

const PlanCard = ({ plan, ctaText, buttonOnClickTracking }: PlanCardProps) => (
  <div className="relative">
    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600"></div>
    <div className="relative bg-white p-5 md:p-6 lg:p-8 rounded-2xl">
      {plan.badge && (
        <div className="absolute -top-2.5 md:-top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-0.5 md:px-4 md:py-1 bg-teal-500 text-white text-xs md:text-sm font-bold rounded-full whitespace-nowrap">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="text-center mb-4 md:mb-6">
        <p className="text-lg md:text-xl font-bold text-slate-900 mb-1">
          {plan.name}
        </p>
        {plan.description && (
          <p className="text-xs md:text-sm text-slate-600 whitespace-pre-line">
            {plan.description}
          </p>
        )}
      </div>

      <div className="mb-3 md:mb-4">
        <div
          className={`flex items-baseline gap-2 mb-2 ${!plan.priceAnchor ? "justify-center" : ""}`}
        >
          {plan.priceAnchor && (
            <span className="text-base md:text-lg text-slate-400 line-through">
              {formatBRL(plan.priceAnchor)}
            </span>
          )}
          <span className="text-4xl md:text-5xl font-extrabold text-slate-900">
            {formatBRL(plan.equivalentMonthlyPrice) || formatBRL(plan.price)}
          </span>
          <span className="text-slate-500 text-xs md:text-sm whitespace-pre-line">
            {plan.recurrency === "monthly" || plan.equivalentMonthlyPrice
              ? `/mês${plan.equivalentMonthlyPrice ? "*" : ""}`
              : "/ano"}
          </span>
        </div>
      </div>

      <ul className="space-y-2.5 md:space-y-3 mb-5 md:mb-6">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-slate-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 md:w-5 md:h-5 text-teal-500 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs md:text-sm">{feature.name}</span>
          </li>
        ))}
      </ul>

      <ButtonCheckout
        recurrency={plan.recurrency}
        mode="subscription"
        text={ctaText}
        onClickTracking={buttonOnClickTracking}
      />

      <p className="text-center text-[10px] md:text-xs text-slate-500 mt-3 md:mt-4 whitespace-pre-line">
        {plan.renewalNote || "Cancele quando quiser. Sem compromisso."}
      </p>
    </div>
  </div>
);

export default PlanCard;
export { PlanCard as CompactPlanCard };
