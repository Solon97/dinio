import { createClient } from "@/libs/supabase/server";
import { SupabaseBudgetRepository } from "./budget";
import { SupabaseCreditCardRepository } from "./credit-card";
import { SupabaseCreditCardInvoiceRepository } from "./credit-card-invoice";
import { SupabaseDailyExpenseRepository } from "./daily-expense";
import { SupabaseFixedExpenseRepository } from "./fixed-expense";
import { SupabaseIncomeRepository } from "./income";
import { SupabaseInstallmentExpenseRepository } from "./installment-expense";

// Factory function to create all repositories
export async function createRepositories() {
  const supabase = await createClient();

  return {
    budgetRepository: new SupabaseBudgetRepository(supabase),
    incomeRepository: new SupabaseIncomeRepository(supabase),
    expenseRepository: new SupabaseFixedExpenseRepository(supabase),
    creditCardRepository: new SupabaseCreditCardRepository(supabase),
    dailyExpenseRepository: new SupabaseDailyExpenseRepository(supabase),
    installmentExpenseRepository: new SupabaseInstallmentExpenseRepository(
      supabase,
    ),
    creditCardInvoiceRepository: new SupabaseCreditCardInvoiceRepository(
      supabase,
    ),
  };
}
