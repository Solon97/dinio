"use client";

import { CheckCircle2, LucideIcon, PlusCircle, Settings2 } from "lucide-react";
import React from "react";

interface BudgetChecklistStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  actionId?: string;
  icon?: LucideIcon;
}

interface BudgetNotConfiguredProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionId?: string;
  icon?: LucideIcon;
  checklistTitle?: string;
  checklistSteps?: BudgetChecklistStep[];
}

const BudgetNotConfigured: React.FC<BudgetNotConfiguredProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionId,
  icon: Icon = Settings2,
  checklistTitle = "Passo a passo",
  checklistSteps = [],
}) => {
  const hasAction = actionLabel && onAction;
  const hasChecklist = checklistSteps.length > 0;

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 animate-in fade-in zoom-in duration-300">
      <div className="bg-teal-50 p-5 md:p-6 rounded-full mb-5 md:mb-6">
        <Icon className="w-12 h-12 md:w-16 md:h-16 text-teal-500" />
      </div>
      <h2 className="text-lg md:text-2xl font-bold text-slate-700 mb-2 text-center px-4">
        {title}
      </h2>
      <p className="text-slate-400 text-sm md:text-base max-w-md text-center mb-6 md:mb-8 px-4">
        {description}
      </p>
      {hasChecklist && (
        <div className="w-full max-w-2xl mb-6 md:mb-8 px-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
            <h3 className="text-sm md:text-base font-semibold text-slate-700 mb-3 md:mb-4">
              {checklistTitle}
            </h3>

            <ol className="space-y-3 md:space-y-4">
              {checklistSteps.map((step, index) => {
                const StepIcon = step.icon;

                return (
                  <li
                    key={step.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 md:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shrink-0 text-slate-500">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {StepIcon && (
                            <StepIcon className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <p className="text-sm md:text-base font-semibold text-slate-700">
                            {step.title}
                          </p>
                          {step.isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} />
                              Concluído
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              Pendente
                            </span>
                          )}
                        </div>

                        <p className="text-xs md:text-sm text-slate-500 mb-3">
                          {step.description}
                        </p>

                        {!step.isCompleted && step.actionLabel && step.actionHref && (
                          <a
                            id={step.actionId}
                            href={step.actionHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                          >
                            {step.actionLabel}
                          </a>
                        )}

                        {!step.isCompleted && step.actionLabel && step.onAction && (
                          <button
                            id={step.actionId}
                            onClick={step.onAction}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                          >
                            {step.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
      {hasAction && (
        <button
          id={actionId}
          onClick={onAction}
          className="px-5 md:px-8 py-3 md:py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl md:rounded-2xl font-bold shadow-xl shadow-teal-200 transition-all flex items-center gap-2 md:gap-3 text-sm md:text-lg"
        >
          <PlusCircle size={20} className="md:w-6 md:h-6" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default BudgetNotConfigured;
