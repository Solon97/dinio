"use client";

import posthog from "posthog-js";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { posthogEvents } from "@/libs/posthog";
import { DiagnosisStep1 } from "./steps/step1";
import { DiagnosisStep2 } from "./steps/step2";

const DIAGNOSTICO_STORAGE_KEY = "dinio:diagnostico:last-input";

interface DiagnosisWizardPayload {
  income: number;
  fixedExpenses: number;
  createdAt: string;
}

interface DiagnosisWizardProps {
  onComplete?: (payload: DiagnosisWizardPayload) => void;
}

export function DiagnosisWizard({ onComplete }: DiagnosisWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [income, setIncome] = useState<number>(0);
  const [fixedExpensesPercent, setFixedExpensesPercent] = useState<number>(50);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lastStep, setLastStep] = useState<1 | 2>(1);

  const fixedExpensesValue = Math.round(income * (fixedExpensesPercent / 100));

  useEffect(() => {
    if (currentStep === 1 && lastStep === 1) {
      posthog.capture(posthogEvents.DIAGNOSIS_INCOME_STEP);
    } else if (currentStep === 2) {
      setLastStep(2);
      posthog.capture(posthogEvents.DIAGNOSIS_FIXED_EXPENSES_STEP);
    }
  }, [currentStep, lastStep]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (income <= 0) {
      toast.error("Por favor, informe uma renda válida.");
      return;
    }

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(2);
      setIsTransitioning(false);
    }, 200);
  };

  const handlePreviousStep = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(1);
      setIsTransitioning(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: DiagnosisWizardPayload = {
      income,
      fixedExpenses: fixedExpensesValue,
      createdAt: new Date().toISOString(),
    };

    if (onComplete) {
      onComplete(payload);
      return;
    }

    sessionStorage.setItem(DIAGNOSTICO_STORAGE_KEY, JSON.stringify(payload));
    router.push("/diagnostico/resultado");
  };

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-100 overflow-hidden relative min-h-[350px]">
      {/* PROGRESS */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
          Passo {currentStep} de 2
        </span>
        {currentStep === 2 && (
          <button
            onClick={handlePreviousStep}
            type="button"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </button>
        )}
      </div>

      <div
        className={`transition-all duration-200 transform ${
          isTransitioning
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
      >
        {currentStep === 1 ? (
          <DiagnosisStep1
            income={income}
            setIncome={setIncome}
            onSubmit={handleNextStep}
          />
        ) : (
          <DiagnosisStep2
            income={income}
            fixedExpensesPercent={fixedExpensesPercent}
            setFixedExpensesPercent={setFixedExpensesPercent}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
