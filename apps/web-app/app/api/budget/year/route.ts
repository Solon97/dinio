import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { computeMonthId } from "@/libs/monthId";
import { YearlySummaryResponse, YearlyMonthRecord } from "@/types/budget";
import { calculateAllocationValues } from "@/libs/financeService";
import { isCurrentMonthCheck } from "../helpers";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/**
 * GET /api/budget/year?year=YYYY
 * Returns yearly budget summary with all configured months
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "");

    if (isNaN(year)) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    // Fetch all monthly budgets for the year
    const yearStart = computeMonthId(year, 0); // e.g., 202601 for 2026
    const yearEnd = computeMonthId(year, 11); // e.g., 202612 for 2026

    const { data: monthlyBudgets, error: budgetError } = await supabase
      .from("monthly_budgets")
      .select("*")
      .eq("user_id", user.id)
      .gte("month_id", yearStart)
      .lte("month_id", yearEnd)
      .order("month_id", { ascending: true });

    if (budgetError) {
      console.error("Error fetching yearly budgets:", budgetError);
      return NextResponse.json(
        { error: "Failed to fetch yearly data" },
        { status: 500 },
      );
    }

    // Check if previous year has any configured months
    const prevYearStart = (year - 1) * 100 + 1;
    const prevYearEnd = (year - 1) * 100 + 12;

    const { data: previousYearBudgets } = await supabase
      .from("monthly_budgets")
      .select("id")
      .eq("user_id", user.id)
      .gte("month_id", prevYearStart)
      .lte("month_id", prevYearEnd)
      .limit(1);

    const hasPreviousYearData = (previousYearBudgets?.length ?? 0) > 0;

    // Build month lookup map (key is 0-based month)
    const budgetByMonth = new Map(
      (monthlyBudgets || []).map((b) => [b.month, b]),
    );

    // Fetch expenses for all configured months using month_id
    const monthIds = (monthlyBudgets || []).map((b) => b.month_id);
    let expensesByMonthId = new Map<
      number,
      { mandatory: number; discretionary: number }
    >();

    if (monthIds.length > 0) {
      const { data: expenses } = await supabase
        .from("fixed_expenses")
        .select("month_id, amount, is_mandatory")
        .eq("user_id", user.id)
        .in("month_id", monthIds);

      if (expenses) {
        expenses.forEach((e) => {
          const current = expensesByMonthId.get(e.month_id) || {
            mandatory: 0,
            discretionary: 0,
          };
          const amount = Number(e.amount);

          if (e.is_mandatory) {
            current.mandatory += amount;
          } else {
            current.discretionary += amount;
          }

          expensesByMonthId.set(e.month_id, current);
        });
      }
    }

    // Fetch daily expenses for all configured months using month_id
    let dailySpentByMonthId = new Map<number, number>();

    if (monthIds.length > 0) {
      const { data: dailyExpenses } = await supabase
        .from("daily_expenses")
        .select("month_id, amount")
        .eq("user_id", user.id)
        .in("month_id", monthIds);

      if (dailyExpenses) {
        dailyExpenses.forEach((e) => {
          const current = dailySpentByMonthId.get(e.month_id) || 0;
          dailySpentByMonthId.set(e.month_id, current + Number(e.amount));
        });
      }
    }

    // Build monthly records
    const months: YearlyMonthRecord[] = [];
    let configuredMonths = 0;
    const totals = {
      income: 0,
      fixedMandatory: 0,
      fixedDiscretionary: 0,
      dailySpent: 0,
      plannedSavings: 0,
      realSavings: 0,
    };

    for (let month = 0; month < 12; month++) {
      const budget = budgetByMonth.get(month);

      if (!budget) {
        months.push({
          month,
          monthName: MONTH_NAMES[month],
          income: 0,
          fixedMandatory: 0,
          fixedDiscretionary: 0,
          dailySpent: 0,
          plannedSavings: 0,
          realSavings: 0,
          isConfigured: false,
        });
        continue;
      }
      configuredMonths++;

      const income = Number(budget.total_income);
      const monthId = budget.month_id;
      const expenseData = expensesByMonthId.get(monthId) || {
        mandatory: 0,
        discretionary: 0,
      };

      // Calculate allocation values from percentages
      const { totalFixedCents, reserveAmountCents } = calculateAllocationValues(
        income,
        Number(budget.fixed_percent),
        Number(budget.daily_percent),
        Number(budget.reserve_percent),
      );

      // Get actual daily spending from daily_expenses table
      const dailySpent = dailySpentByMonthId.get(monthId) || 0;

      // Calculate savings
      const plannedSavings = reserveAmountCents;
      const realSavings = isCurrentMonthCheck(month, year)
        ? 0
        : income -
          (expenseData.mandatory + expenseData.discretionary + dailySpent);

      const record: YearlyMonthRecord = {
        month,
        monthName: MONTH_NAMES[month],
        income,
        fixedMandatory: expenseData.mandatory,
        fixedDiscretionary: expenseData.discretionary,
        dailySpent,
        plannedSavings,
        realSavings,
        isConfigured: true,
      };

      months.push(record);

      totals.income += income;
      totals.fixedMandatory += expenseData.mandatory;
      totals.fixedDiscretionary += expenseData.discretionary;
      totals.dailySpent += dailySpent;
      totals.plannedSavings += plannedSavings;
      totals.realSavings += realSavings;
    }

    const response: YearlySummaryResponse = {
      __type: "YearlySummaryResponse",
      year,
      months,
      totals,
      configuredMonths,
      hasData: configuredMonths > 0,
      hasPreviousYearData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Yearly budget GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
