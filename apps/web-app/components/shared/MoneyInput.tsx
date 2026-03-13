import React, {
  InputHTMLAttributes,
  forwardRef,
  useState,
  useEffect,
} from "react";

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "onChange" | "value"
> {
  value: number;
  onChange: (value: number) => void;
  showCurrencySymbol?: boolean;
}

const formatCurrency = (value: number): string => {
  if (!value) return "";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(
    value,
  );
};

const parseInput = (input: string): number => {
  const numeric = input.replace(/\D/g, "");
  if (!numeric) return 0;
  return parseFloat(numeric) / 100;
};

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    { value, onChange, showCurrencySymbol = true, className = "", ...props },
    ref,
  ) => {
    const [displayValue, setDisplayValue] = useState<string>(
      formatCurrency(value),
    );

    useEffect(() => {
      setDisplayValue(formatCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setDisplayValue(input);
      onChange(parseInput(input));
    };

    const baseClasses =
      "bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-medium text-slate-800";
    const paddingClasses = showCurrencySymbol ? "pl-12 pr-4 py-3" : "px-4 py-3";
    const combinedClasses = `w-full ${paddingClasses} ${baseClasses} ${className}`;

    return (
      <div className="relative">
        {showCurrencySymbol && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
            R$
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={combinedClasses}
          {...props}
        />
      </div>
    );
  },
);

MoneyInput.displayName = "MoneyInput";
