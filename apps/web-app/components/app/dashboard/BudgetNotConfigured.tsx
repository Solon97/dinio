"use client";

import React from "react";
import { Settings2, PlusCircle, Calendar, LucideIcon } from "lucide-react";

interface BudgetNotConfiguredProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionId?: string;
  icon?: LucideIcon;
}

const BudgetNotConfigured: React.FC<BudgetNotConfiguredProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actionId,
  icon: Icon = Settings2,
}) => {
  const hasAction = actionLabel && onAction;

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
