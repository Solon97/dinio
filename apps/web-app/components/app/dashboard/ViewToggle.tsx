"use client";

import React from "react";
import { CalendarClock, PieChart, BarChart3 } from "lucide-react";

type ViewMode = "week" | "month" | "year";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (_mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewChange }) => {
  const views = [
    { id: "week" as ViewMode, label: "Diário", icon: CalendarClock },
    { id: "month" as ViewMode, label: "Mensal", icon: PieChart },
    { id: "year" as ViewMode, label: "Anual", icon: BarChart3 },
  ];

  return (
    <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-medium shrink-0">
      {views.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          id={`view-toggle-${id}`}
          onClick={() => onViewChange(id)}
          title={label}
          className={`px-2.5 sm:px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm ${
            viewMode === id
              ? "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Icon size={16} className="shrink-0" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewToggle;
