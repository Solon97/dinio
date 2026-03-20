"use client";

import { useBudgetSetupWizard } from "./Context";
import { BudgetSetupWizardHeader } from "./Header";
import { BudgetSetupWizardBody } from "./Body";
import { BudgetSetupWizardFooter } from "./Footer";
import { InstallmentDeleteModal } from "./shared/InstallmentDeleteModal";
import { WizardOnboardingSync } from "./WizardOnboardingSync";

interface WizardModalProps {
  isSaving?: boolean;
}

export function WizardModal({ isSaving = false }: WizardModalProps) {
  const {
    expenseToDelete,
    setExpenseToDelete,
    handleDeleteCurrentInstallment,
    handleDeleteAllFutureInstallments,
    expenses,
    incomes,
    creditCards,
    allocation,
    isPartialMonth,
    isFirstMonth,
    targetRemaining,
    invoiceTotals,
    onSave,
    onCancel,
  } = useBudgetSetupWizard();

  const handleFinish = () => {
    if (isSaving) return;

    // Ensure card expenses use card's dueDay
    // Keep temporary IDs - backend will handle mapping them to real IDs
    const finalExpenses = expenses.map((e) => {
      if (e.creditCardId) {
        const card = creditCards.find((c) => c.id === e.creditCardId);
        if (card) {
          return { ...e, dueDay: card.dueDay };
        }
      }
      return e;
    });

    // Calculate net opening balance per card (invoiceTotal - active fixed expenses for that card)
    const invoiceOpeningBalances = creditCards.flatMap((card) => {
      const invoiceTotal = invoiceTotals[card.id ?? ""] ?? 0;
      if (invoiceTotal <= 0) return [];
      const cardFixedSum = finalExpenses
        .filter((e) => e.creditCardId === card.id && !e.markedForDeletion)
        .reduce((acc, e) => acc + e.amount, 0);
      const net = invoiceTotal - cardFixedSum;
      if (net <= 0) return [];
      return [{ tempCreditCardId: card.id!, amount: net }];
    });

    onSave({
      incomes,
      expenses: finalExpenses,
      creditCards,
      allocation,
      targetRemaining:
        isPartialMonth && targetRemaining !== null
          ? targetRemaining
          : undefined,
      // When isFirstMonth, always send the array (even empty) so the backend
      // knows to sync opening balances. undefined = don't touch existing records.
      invoiceOpeningBalances: isFirstMonth ? invoiceOpeningBalances : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center md:p-4">
      <WizardOnboardingSync />
      <div
        id="onboarding-wizard-modal"
        className="bg-white md:rounded-3xl w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        <BudgetSetupWizardHeader onCancel={onCancel} isSaving={isSaving} />

        <BudgetSetupWizardBody />

        <BudgetSetupWizardFooter onFinish={handleFinish} />
      </div>

      {/* Installment Delete Modal */}
      {expenseToDelete && (
        <InstallmentDeleteModal
          expense={expenseToDelete}
          onDeleteCurrent={handleDeleteCurrentInstallment}
          onDeleteAllFuture={handleDeleteAllFutureInstallments}
          onCancel={() => setExpenseToDelete(null)}
        />
      )}
    </div>
  );
}
