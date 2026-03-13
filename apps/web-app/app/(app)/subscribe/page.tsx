"use client";

import PlanCard from "@/components/shared/PlanCard";
import config from "@/config";
import { Lock, Shield, Sparkles, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const benefits = [
  {
    icon: TrendingUp,
    title: "Teto diário automático",
    description:
      "Saiba exatamente quanto pode gastar por dia sem comprometer seu orçamento.",
  },
  {
    icon: Shield,
    title: "Controle de gastos fixos",
    description: "Cadastre suas contas e nunca mais seja pego de surpresa.",
  },
  {
    icon: Zap,
    title: "Ajuste inteligente",
    description: "O orçamento se adapta automaticamente conforme você gasta.",
  },
  {
    icon: Sparkles,
    title: "Visão clara das finanças",
    description:
      "Dashboards simples que mostram sua saúde financeira de verdade.",
  },
];

export default function NoAccessPage() {
  const router = useRouter();

  const featuredPlan =
    config.stripe.plans.find((p) => p.id === "default_yearly") ||
    config.stripe.plans[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 font-sans flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-2xl mb-6">
              <Lock className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Acesso exclusivo para assinantes
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Assine o {config.appName} e tenha controle total das suas finanças
              de forma simples e prática.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <PlanCard plan={featuredPlan} />
          </div>

          {/* Footer Link */}
          <p className="text-center text-sm text-slate-500 mt-8">
            Quer conhecer todos os planos?{" "}
            <Link
              href="/#pricing"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Ver opções de planos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
