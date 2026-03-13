"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isCurrentMonth: boolean;
  isYearView?: boolean;
  isWeeklyView?: boolean;
}

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  currentDate,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isCurrentMonth,
  isWeeklyView = false,
  isYearView = false,
}) => {
  return (
    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 shrink-0">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="p-1.5 md:p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-teal-500 transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
      >
        {!isWeeklyView && <ChevronLeft size={18} className="md:w-5 md:h-5" />}
      </button>

      <div className="px-1 md:px-2 min-w-[100px] md:min-w-[140px] text-center flex flex-col items-center justify-center">
        <p className="text-xs md:text-sm font-bold text-slate-700 flex items-center gap-1 md:gap-2 whitespace-nowrap">
          {isYearView
            ? currentDate.getFullYear()
            : `${monthNames[currentDate.getMonth()].substring(0, 3)} ${currentDate.getFullYear()}`}
        </p>
        {isCurrentMonth && (
          <span className="text-[9px] md:text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide mt-0.5">
            Atual
          </span>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="p-1.5 md:p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-teal-500 transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
      >
        {!isWeeklyView && <ChevronRight size={18} className="md:w-5 md:h-5" />}
      </button>
    </div>
  );
};

export default MonthNavigator;
