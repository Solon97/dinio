"use client";

import {
  BudgetNotConfigured,
  BudgetSetupWizard,
  CaptureMenu,
  DailyView,
  MonthlyView,
  MonthNavigator,
  ViewToggle,
  YearlyView,
} from "@/components/app/dashboard";
import { getCategoryColor } from "@/constants/categories";
import { useBudget } from "@/contexts/BudgetContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useUser } from "@/contexts";
import { calculateStatus } from "@/libs/financeService";
import { computeMonthId } from "@/libs/monthId";
import { getWhatsappBindLink } from "@/libs/whatsappLink";
import {
  completeActiveTour,
  destroyActiveTour,
  getActivePhase,
} from "@/libs/onboarding/onboarding";
import { BudgetConfigPayload } from "@/types/budget";
import { BudgetConfig, FinancialStatus } from "@/types/finance";
import "driver.js/dist/driver.css";
import { Calendar, MessageCircle, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ViewMode = "week" | "month" | "year";

const getDaysInMonth = (month: number, year: number): number =>
  new Date(year, month + 1, 0).getDate();

export default function Dashboard() {
  const { user } = useUser();

  const {
    currentConfig,
    isLoading,
    fetchBudget,
    saveBudget,
    yearlyData,
    fetchYearlySummary,
  } = useBudget();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showWizard, setShowWizard] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const {
    state: onboardingState,
    isLoading: onboardingLoading,
    startDailyTour,
    startMonthlyTour,
    startYearlyTour,
    completeSetupTour,
    completeDailyTour,
    completeMonthlyTour,
  } = useOnboarding();

  // Destroy any active tour when leaving the page
  useEffect(
    () => () => {
      destroyActiveTour();
    },
    [],
  );

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

  // Fetch budget or yearly data on viewMode or date change
  useEffect(() => {
    if (viewMode === "year") {
      fetchYearlySummary(currentDate.getFullYear());
    } else {
      fetchBudget(currentDate.getMonth(), currentDate.getFullYear());
    }
  }, [viewMode, currentDate, fetchBudget, fetchYearlySummary]);

  // Check if current month view is configured
  const isConfigured = currentConfig?.isConfigured ?? false;
  const whatsappBindLink = getWhatsappBindLink();
  const isNewUser = !isConfigured && !onboardingState.setupCompleted;

  // Phase 1 — Daily tour: fires when budget is configured
  useEffect(() => {
    if (onboardingLoading) return;
    if (onboardingState.dailyCompleted) return;
    if (viewMode !== "week" || !isConfigured || isLoading) return;
    const timer = setTimeout(
      () => startDailyTour(() => setViewMode("month")),
      1000,
    );
    return () => clearTimeout(timer);
  }, [
    viewMode,
    isConfigured,
    isLoading,
    onboardingState.dailyCompleted,
    onboardingLoading,
    startDailyTour,
  ]);

  // Phase 2 — Monthly tour: fires when user switches to monthly view after daily tour
  useEffect(() => {
    if (onboardingLoading) return;
    if (!onboardingState.dailyCompleted || onboardingState.monthlyCompleted)
      return;
    if (viewMode !== "month" || !isConfigured || isLoading) return;
    const timer = setTimeout(
      () => startMonthlyTour(() => setViewMode("year")),
      500,
    );
    return () => clearTimeout(timer);
  }, [
    viewMode,
    isConfigured,
    isLoading,
    onboardingState.dailyCompleted,
    onboardingState.monthlyCompleted,
    onboardingLoading,
    startMonthlyTour,
  ]);

  // Phase 3 — Yearly tour: fires when user switches to yearly view after monthly tour
  useEffect(() => {
    if (onboardingLoading) return;
    if (!onboardingState.monthlyCompleted || onboardingState.yearlyCompleted)
      return;
    if (viewMode !== "year" || isLoading) return;
    const timer = setTimeout(() => startYearlyTour(), 500);
    return () => clearTimeout(timer);
  }, [
    viewMode,
    isLoading,
    onboardingState.monthlyCompleted,
    onboardingState.yearlyCompleted,
    onboardingLoading,
    startYearlyTour,
  ]);

  // Derive summary from API response (dailyHistory is now calculated on backend)
  const summary = useMemo(() => {
    if (!isConfigured || !currentConfig) return null;

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);

    // Calculate categories from dailyHistory breakdown
    const categoryTotals: Record<string, number> = {};

    currentConfig.dailyHistory.forEach((day) => {
      Object.entries(day.breakdown).forEach(([cat, amount]) => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
      });
    });

    const categories = Object.entries(categoryTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      }));

    return {
      month,
      year,
      income: currentConfig.totalIncome,
      totalFixed: currentConfig.totalFixed,
      reserveGoal: currentConfig.reserveAmount,
      currentDay: currentConfig.currentDay,
      daysInMonth,
      expenses: currentConfig.expenses,
      dailyHistory: currentConfig.dailyHistory,
      categories,
      creditCards: currentConfig.creditCards,
      payments: currentConfig.payments ?? [],
    };
  }, [currentDate, currentConfig, isConfigured]);

  // Convert yearly data for YearlyChart component
  const yearSummary = useMemo(() => {
    if (!yearlyData?.hasData) return [];

    return yearlyData.months.map((m) => ({
      monthName: m.monthName,
      income: m.income,
      fixedMandatory: m.fixedMandatory,
      fixedDiscretionary: m.fixedDiscretionary,
      dailySpent: m.dailySpent,
      plannedSavings: m.plannedSavings,
      realSavings: m.realSavings,
    }));
  }, [yearlyData]);

  const status = summary
    ? calculateStatus(summary.income, summary.totalFixed)
    : FinancialStatus.HEALTHY;

  // All financial metrics are now calculated in the backend
  const initialAvailable = currentConfig?.initialAvailable ?? 0;
  const remainingBalance = currentConfig?.remainingBalance ?? 0;
  const balanceProgress = currentConfig?.balanceProgress ?? 0;
  const recommendedDailyAverage = currentConfig?.idealDailyAverage ?? 0;
  const currentDailyAverage = currentConfig?.currentDailyAverage ?? 0;
  const projectedBudgetDurationDays =
    currentConfig?.projectedBudgetDurationDays ?? 0;

  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  // Navigation - allow going to previous month only if it's configured
  const canGoPrevious =
    (currentConfig?.isPreviousMonthConfigured && viewMode !== "week") ?? false;

  const canGoNext = useMemo(() => {
    if (isCurrentMonth) return false;
    return true;
  }, [isCurrentMonth]);

  // Year navigation
  const isCurrentYear = currentDate.getFullYear() === new Date().getFullYear();
  const canGoPreviousYear = yearlyData?.hasPreviousYearData ?? false;
  const canGoNextYear = !isCurrentYear;

  const handlePreviousMonth = () => {
    if (!canGoPrevious) return;
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };
  const handleNextMonth = () => {
    if (!canGoNext) return;
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handlePreviousYear = () => {
    if (!canGoPreviousYear) return;
    const prev = new Date(currentDate);
    prev.setFullYear(prev.getFullYear() - 1);
    setCurrentDate(prev);
  };

  const handleNextYear = () => {
    if (!canGoNextYear) return;
    const next = new Date(currentDate);
    next.setFullYear(next.getFullYear() + 1);
    setCurrentDate(next);
  };

  const handleSaveConfig = useCallback(
    async (config: BudgetConfig) => {
      if (isSavingBudget) return;

      const payload: BudgetConfigPayload = {
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        incomes: config.incomes,
        expenses: config.expenses,
        creditCards: config.creditCards,
        allocation: config.allocation,
        targetRemaining: config.targetRemaining,
        invoiceOpeningBalances: config.invoiceOpeningBalances,
      };

      setIsSavingBudget(true);
      try {
        const savedConfig = await saveBudget(payload);
        if (!savedConfig) return;

        completeActiveTour();
        await completeSetupTour();
        setShowWizard(false);
      } finally {
        setIsSavingBudget(false);
      }
    },
    [currentDate, saveBudget, completeSetupTour, isSavingBudget],
  );

  const handleViewChange = useCallback(
    (mode: ViewMode) => {
      const phase = getActivePhase();
      if (phase === "daily" && mode === "month") {
        destroyActiveTour();
        completeDailyTour();
      } else if (phase === "monthly" && mode === "year") {
        destroyActiveTour();
        completeMonthlyTour();
      }
      setViewMode(mode);
    },
    [completeDailyTour, completeMonthlyTour],
  );

  // Open wizard - data is already loaded via currentConfig.wizardInitialData
  const handleOpenWizard = useCallback(() => {
    setShowWizard(true);
  }, []);

  const dailyChecklistSteps = useMemo(
    () => [
      {
        id: "whatsapp",
        title: "Conecte seu WhatsApp",
        description:
          "Vincule seu WhatsApp para registrar gastos com mais rapidez direto na conversa.",
        isCompleted: !!user?.whatsappLinked,
        actionLabel: "Vincular WhatsApp",
        actionHref: whatsappBindLink ?? undefined,
        icon: MessageCircle,
      },
      {
        id: "budget",
        title: "Configure seu mês",
        description:
          "Defina sua receita, gastos fixos e estratégia mensal para liberar o rastreio diário.",
        isCompleted: isConfigured,
        actionLabel: `Configurar ${monthNames[currentDate.getMonth()]}`,
        onAction: handleOpenWizard,
        actionId: "onboarding-configure-btn",
        icon: Settings2,
      },
    ],
    [
      user?.whatsappLinked,
      whatsappBindLink,
      isConfigured,
      monthNames,
      currentDate,
      handleOpenWizard,
    ],
  );

  const monthlyChecklistSteps = useMemo(
    () => [
      {
        id: "whatsapp",
        title: "Ative o WhatsApp como atalho",
        description:
          "Ao conectar, você ganha um canal rápido para capturar gastos e manter o mês atualizado.",
        isCompleted: !!user?.whatsappLinked,
        actionLabel: "Vincular WhatsApp",
        actionHref: whatsappBindLink ?? undefined,
        icon: MessageCircle,
      },
      {
        id: "budget",
        title: "Finalize seu planejamento",
        description:
          "Configure este mês para visualizar a distribuição da renda e os compromissos financeiros.",
        isCompleted: isConfigured,
        actionLabel: `Configurar ${monthNames[currentDate.getMonth()]}`,
        onAction: handleOpenWizard,
        icon: Settings2,
      },
    ],
    [
      user?.whatsappLinked,
      whatsappBindLink,
      isConfigured,
      monthNames,
      currentDate,
      handleOpenWizard,
    ],
  );

  const shouldShowChecklist = isNewUser && !onboardingLoading && !isLoading;

  return (
    <>
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8 relative font-sans mb-24 md:mb-20">
        {/* Budget Setup Wizard */}
        {showWizard && currentConfig && (
          <BudgetSetupWizard
            monthName={monthNames[currentDate.getMonth()]}
            month={currentDate.getMonth()}
            year={currentDate.getFullYear()}
            initialData={currentConfig.wizardInitialData}
            isEditing={currentConfig.isConfigured}
            isFirstMonth={!currentConfig.isPreviousMonthConfigured}
            isPartialMonth={currentConfig.isPartialMonth}
            partialMonthInfo={currentConfig.partialMonthInfo}
            isSaving={isSavingBudget}
            onSave={handleSaveConfig}
            onCancel={() => {
              if (isSavingBudget) return;
              destroyActiveTour();
              setShowWizard(false);
            }}
          />
        )}

        {/* Capture Menu (FAB) */}
        <CaptureMenu />

        {/* Header with Navigation */}
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 border-b border-slate-200 pb-4 md:pb-6">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                  {viewMode === "week"
                    ? "Rastreio Diário"
                    : viewMode === "month"
                      ? "Planejamento"
                      : "Visão Anual"}
                </h1>
              </div>
              <p className="text-slate-500 text-sm md:text-base">
                {viewMode === "week" && "Acompanhe seus gastos dia a dia."}
                {viewMode === "month" && "Saúde financeira e contas fixas."}
                {viewMode === "year" && "Sua evolução anual."}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
              {/* View Toggle */}
              <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />

              {/* Date Navigation - Only for Week and Month views */}
              {(viewMode === "week" || viewMode === "month") && (
                <MonthNavigator
                  currentDate={currentDate}
                  onPrevious={handlePreviousMonth}
                  onNext={handleNextMonth}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  isCurrentMonth={isCurrentMonth}
                  isWeeklyView={viewMode === "week"}
                />
              )}

              {/* Edit Budget Button - Only in Month view, current month, and configured */}
              {viewMode === "month" && isCurrentMonth && isConfigured && (
                <button
                  onClick={handleOpenWizard}
                  className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors"
                  title="Editar orçamento"
                >
                  <Settings2 size={20} />
                </button>
              )}

              {/* Year Navigation */}
              {viewMode === "year" && (
                <MonthNavigator
                  currentDate={currentDate}
                  onPrevious={handlePreviousYear}
                  onNext={handleNextYear}
                  canGoPrevious={canGoPreviousYear}
                  canGoNext={canGoNextYear}
                  isCurrentMonth={isCurrentYear}
                  isYearView={true}
                />
              )}
            </div>
          </div>
        </header>

        {/* VIEW CONTENT */}

        {/* 1. WEEKLY VIEW (Operational / Daily Tracking) */}
        {viewMode === "week" && (
          <>
            {!isConfigured && !isLoading ? (
              shouldShowChecklist ? (
                <BudgetNotConfigured
                  title="Comece em 2 passos"
                  description="Antes de acompanhar o dia a dia, faça este setup rápido para liberar seu painel."
                  checklistTitle="Primeiros passos"
                  checklistSteps={dailyChecklistSteps}
                />
              ) : (
                <BudgetNotConfigured
                  title="Orçamento não configurado"
                  description="Configure o mês para liberar o rastreio diário e a projeção do seu ritmo de gastos."
                  actionLabel={`Configurar ${monthNames[currentDate.getMonth()]}`}
                  actionId="onboarding-configure-btn"
                  onAction={handleOpenWizard}
                />
              )
            ) : (
              <DailyView
                summary={
                  summary
                    ? {
                        currentDay: summary.currentDay,
                        daysInMonth: summary.daysInMonth,
                        dailyHistory: summary.dailyHistory,
                      }
                    : { currentDay: 0, daysInMonth: 0, dailyHistory: [] }
                }
                initialAvailable={initialAvailable}
                recommendedDailyAverage={recommendedDailyAverage}
                currentDailyAverage={currentDailyAverage}
                remainingBalance={remainingBalance}
                balanceProgress={balanceProgress}
                projectedBudgetDurationDays={projectedBudgetDurationDays}
                categoryData={summary?.categories || []}
                month={currentDate.getMonth()}
                year={currentDate.getFullYear()}
                isLoading={isLoading}
              />
            )}
          </>
        )}

        {/* 2. MONTHLY VIEW (Strategic / Budget Config) */}
        {viewMode === "month" && (
          <>
            {!isConfigured && !isLoading ? (
              shouldShowChecklist ? (
                <BudgetNotConfigured
                  title="Planejamento em 2 passos"
                  description="Conclua estes passos para visualizar sua distribuição mensal e compromissos do período."
                  checklistTitle="Checklist de ativação"
                  checklistSteps={monthlyChecklistSteps}
                />
              ) : (
                <BudgetNotConfigured
                  title="Configure o Orçamento Mensal"
                  description="Defina suas receitas e gastos fixos para visualizar a saúde financeira do mês."
                  actionLabel={`Configurar ${monthNames[currentDate.getMonth()]}`}
                  onAction={handleOpenWizard}
                />
              )
            ) : (
              <MonthlyView
                summary={
                  summary
                    ? {
                        income: summary.income,
                        totalFixed: summary.totalFixed,
                        reserveGoal: summary.reserveGoal,
                        dailyHistory: summary.dailyHistory,
                        currentDay: summary.currentDay,
                        expenses: summary.expenses,
                        creditCards: summary.creditCards,
                        payments: summary.payments,
                      }
                    : {
                        income: 0,
                        totalFixed: 0,
                        reserveGoal: 0,
                        dailyHistory: [],
                        currentDay: 0,
                        expenses: [],
                        creditCards: [],
                        payments: [],
                      }
                }
                initialAvailable={initialAvailable}
                status={status}
                monthId={computeMonthId(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                )}
                isLoading={isLoading}
              />
            )}
          </>
        )}

        {/* 3. YEAR VIEW (Annual Evolution) */}
        {viewMode === "year" && (
          <>
            {!yearlyData?.hasData && !isLoading ? (
              <BudgetNotConfigured
                title="Nenhum dado anual"
                description="Configure ao menos um mês para visualizar a evolução anual das suas finanças."
                icon={Calendar}
              />
            ) : (
              <YearlyView
                yearSummary={yearSummary}
                totals={
                  yearlyData?.totals || {
                    income: 0,
                    fixedMandatory: 0,
                    fixedDiscretionary: 0,
                    dailySpent: 0,
                    plannedSavings: 0,
                    realSavings: 0,
                  }
                }
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
