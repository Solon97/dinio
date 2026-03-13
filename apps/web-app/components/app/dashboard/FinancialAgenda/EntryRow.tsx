import { CheckCircle2, Circle } from "lucide-react";
import { statusConfig } from "./utils";
import React from "react";

interface EntryRowProps {
  isPaid: boolean;
  leading: React.ReactNode;
  name: string;
  subtitle?: string;
  status: "paid" | "pending" | "overdue";
  amount: React.ReactNode;
  onToggle: () => void;
  /** The verb used in the toggle aria-label. Defaults to "pago" */
  toggleVerb?: string;
  /** Disable toggle button when state should not be changed */
  isToggleDisabled?: boolean;
  /** Optional message rendered when the toggle is disabled */
  disabledMessage?: string;
  /** Optional content rendered below the main row (e.g. expense list) */
  footer?: React.ReactNode;
}

export function EntryRow({
  isPaid,
  leading,
  name,
  subtitle,
  status,
  amount,
  onToggle,
  toggleVerb = "pago",
  isToggleDisabled = false,
  disabledMessage,
  footer,
}: EntryRowProps) {
  const config = statusConfig[status];

  return (
    <div className="py-3 first:pt-0">
      <div
        className={`flex items-center gap-3 transition-opacity ${
          isPaid ? "opacity-50" : ""
        }`}
      >
        {leading}

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold text-slate-700 truncate ${
              isPaid ? "line-through" : ""
            }`}
          >
            {name}
          </p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.bgColor} ${config.textColor}`}
        >
          {config.text}
        </span>

        {amount}

        <span className="relative group flex-shrink-0">
          <button
            type="button"
            onClick={onToggle}
            disabled={isToggleDisabled}
            className={`text-slate-400 transition-colors ${
              isToggleDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:text-teal-500"
            }`}
            aria-label={
              isPaid
                ? `Desmarcar como ${toggleVerb}`
                : `Marcar como ${toggleVerb}`
            }
          >
            {isPaid ? (
              <CheckCircle2 size={18} className="text-teal-500" />
            ) : (
              <Circle size={18} />
            )}
          </button>

          {isToggleDisabled && disabledMessage ? (
            <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 w-56 rounded-md bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {disabledMessage}
            </span>
          ) : null}
        </span>
      </div>

      {footer}
    </div>
  );
}
