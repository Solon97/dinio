import { useBudgetSetupWizard } from "../../Context";
import { MoneyInput } from "@/components/shared/MoneyInput";

export function Step4() {
  const {
    allocation,
    dailyProportionOfAvailable,
    handleAllocationChange,
    totalFixed,
    totalIncome,
    availableCents,
    isPartialMonth,
    isEditing,
    partialMonthInfo,
    targetRemaining,
    setTargetRemaining,
  } = useBudgetSetupWizard();

  const { currentDay, remainingDays } = partialMonthInfo;

  // Calculate daily allocation in cents first (integer math), then convert to reais
  // This prevents floating-point precision issues, similar to normalizeAllocation
  const dailyAllocationCents = Math.round(
    (dailyProportionOfAvailable * availableCents) / 100,
  );
  const dailyAllocationAmount = dailyAllocationCents / 100;

  // Calculate reserve amount in cents for precision
  const reserveAllocationCents = availableCents - dailyAllocationCents;
  const reserveAllocationAmount = reserveAllocationCents / 100;

  // Calculate daily amount from target remaining (in cents for precision)
  const dailyFromTargetCents =
    targetRemaining !== null && remainingDays > 0
      ? Math.round((targetRemaining * 100) / remainingDays)
      : 0;
  const dailyFromTarget = dailyFromTargetCents / 100;

  return (
    <div
      id="onboarding-wizard-step-4"
      className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300"
    >
      <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 mb-4">
        <h3 className="font-bold text-teal-800 text-lg mb-1">
          4. Distribuição
        </h3>
        <p className="text-teal-600 text-sm">
          Defina quanto sobrará para gastar por dia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Fixed (Locked) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 opacity-70 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="font-bold text-slate-700">Gastos Fixos</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                Automático
              </span>
            </div>
            <span className="font-bold text-slate-700">
              {allocation.fixedPercent}%
            </span>
          </div>
          <p className="text-sm text-slate-500">
            R$ {totalFixed.toLocaleString("pt-BR")}
          </p>
        </div>

        {/* Adjustable Slider Area */}
        <div className="bg-white p-4 md:p-6 rounded-xl border border-teal-100 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4 md:mb-6">
            Ajuste o equilíbrio:
          </h4>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={dailyProportionOfAvailable}
            onChange={(e) => handleAllocationChange(parseFloat(e.target.value))}
            disabled={availableCents === 0}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500 mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {availableCents === 0 && (
            <p className="text-xs text-amber-600 text-center mb-4 italic">
              Sem saldo disponível para distribuir. Ajuste suas receitas ou
              gastos fixos.
            </p>
          )}

          {availableCents > 0 && (
            <p className="text-xs text-slate-500 text-center mb-4 md:mb-6">
              Mova o controle para ajustar a distribuição do valor disponível
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Daily */}
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span className="font-bold text-teal-800 text-xs md:text-sm">
                  Dia a dia
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-teal-700">
                {dailyProportionOfAvailable.toFixed(0)}%
              </p>
              <p className="text-xs md:text-sm text-teal-600">
                R${" "}
                {dailyAllocationAmount.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-teal-500 italic mt-1">
                {allocation.dailyPercent.toFixed(1)}% da renda total
              </p>
            </div>

            {/* Reserve */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="font-bold text-amber-800 text-xs md:text-sm">
                  Reserva
                </span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-amber-600">
                {(100 - dailyProportionOfAvailable).toFixed(0)}%
              </p>
              <p className="text-xs md:text-sm text-amber-600">
                R${" "}
                {reserveAllocationAmount.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-amber-500 italic mt-1">
                {allocation.reservePercent.toFixed(1)}% da renda total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Partial Month Adjustment (only if current month and day > 10) */}
      {isPartialMonth && !isEditing && (
        <div className="mt-6 p-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl border-2 border-teal-200 shadow-md">
          <h4 className="font-bold text-teal-800 text-lg mb-2">
            Agora, vamos para a realidade deste mês
          </h4>
          <p className="text-sm text-slate-600 mb-4">
            Pelo planejamento, você poderia gastar{" "}
            <span className="font-bold text-teal-700">
              R${" "}
              {dailyAllocationAmount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            até o fim do mês. Mas como estamos no meio do mês (dia {currentDay}
            ), você pode ajustar quanto quer gastar daqui pra frente.
          </p>

          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 mb-1 block">
                Quanto você quer gastar até o fim do mês?
              </span>
              <MoneyInput
                value={targetRemaining || 0}
                onChange={(value) =>
                  setTargetRemaining(value > 0 ? value : null)
                }
                placeholder={dailyAllocationAmount.toFixed(2)}
                className="pl-10 pr-4 py-3 bg-white rounded-xl border-2 border-teal-200 focus:border-transparent font-bold text-slate-700"
              />
            </label>

            {targetRemaining !== null && targetRemaining > 0 && (
              <div className="p-4 bg-white/80 rounded-lg border border-teal-100">
                <p className="text-sm text-slate-600">
                  Isso dá{" "}
                  <span className="font-bold text-teal-700 text-lg">
                    R${" "}
                    {dailyFromTarget.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>{" "}
                  por dia até o fim do mês ({remainingDays} dias)
                </p>
              </div>
            )}

            {targetRemaining === null && (
              <p className="text-xs text-slate-500 italic">
                Deixe vazio para usar o valor planejado (
                {dailyAllocationAmount.toFixed(2)})
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
