import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../apps/web-app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web-app/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// Constants
// ============================================================

const CARD_ID = 'b09b0027-cee8-49bb-90e6-46f2b49b79e2';
const USER_EMAIL = 'dev@dinio.test';
const USER_PASSWORD = 'dev123456';

// ============================================================
// Month ID helpers
// ============================================================

function computeMonthId(year, month) {
  return year * 100 + (month + 1);
}

function computeMonthIdFromDate(date) {
  return computeMonthId(date.getFullYear(), date.getMonth());
}

function addMonths(monthId, n) {
  const year = Math.floor(monthId / 100);
  const month = (monthId % 100) - 1 + n;
  const d = new Date(year, month, 1);
  return computeMonthIdFromDate(d);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function parseMonthId(monthId) {
  return { year: Math.floor(monthId / 100), month: (monthId % 100) - 1 };
}

// ============================================================
// Data builders
// ============================================================

function buildBudgetId(monthId) {
  const budgetIds = {
    prev: 'cf14c7d1-07f4-4bb3-b5e7-5b9b3f940b62',
    current: '269d3d24-0864-4940-a027-e411cd7ae999',
  };
  return monthId === currentMonthId ? budgetIds.current : budgetIds.prev;
}

function buildIncomes(authUserId, monthId) {
  return [
    { user_id: authUserId, month_id: monthId, name: 'Salário', amount: 600000 },
    { user_id: authUserId, month_id: monthId, name: 'Renda Extra', amount: 100000 },
  ];
}

function buildFixedExpenses(authUserId, monthId, isCurrentMonth) {
  return [
    { user_id: authUserId, month_id: monthId, name: 'Aluguel', amount: 150000, due_day: 5, is_paid: true, is_mandatory: true },
    { user_id: authUserId, month_id: monthId, name: 'Internet', amount: 10000, due_day: 10, is_paid: true, is_mandatory: true },
    { user_id: authUserId, month_id: monthId, name: 'Academia', amount: 10000, due_day: 15, is_paid: !isCurrentMonth, is_mandatory: false },
    { user_id: authUserId, month_id: monthId, name: 'Plano de Saúde', amount: 100000, due_day: 20, is_paid: !isCurrentMonth, is_mandatory: true },
  ];
}

function buildDailyExpenses(authUserId, monthId, upToDay) {
  const { year, month } = parseMonthId(monthId);
  const daysInMonth = getDaysInMonth(year, month);
  const maxDay = upToDay ?? daysInMonth;

  const templates = [
    { day: 1, amount: 3000, description: 'Café', category: 'Alimentação' },
    { day: 2, amount: 8000, description: 'Supermercado', category: 'Mercado' },
    { day: 4, amount: 4500, description: 'Almoço', category: 'Alimentação' },
    { day: 5, amount: 5000, description: 'Farmácia', category: 'Saúde' },
    { day: 7, amount: 2500, description: 'Lanche', category: 'Alimentação' },
    { day: 8, amount: 12000, description: 'Supermercado', category: 'Mercado' },
    { day: 10, amount: 3800, description: 'Restaurante', category: 'Alimentação' },
    { day: 11, amount: 4500, description: 'Transporte', category: 'Transporte' },
    { day: 12, amount: 4200, description: 'Lanche', category: 'Alimentação' },
    { day: 14, amount: 4000, description: 'Uber', category: 'Transporte' },
    { day: 15, amount: 6500, description: 'Almoço', category: 'Alimentação' },
    { day: 16, amount: 2000, description: 'Café da manhã', category: 'Alimentação' },
    { day: 18, amount: 5000, description: 'Cinema', category: 'Lazer' },
    { day: 19, amount: 3000, description: 'Transporte', category: 'Transporte' },
    { day: 20, amount: 2800, description: 'Café da manhã', category: 'Alimentação' },
    { day: 21, amount: 9000, description: 'Restaurante', category: 'Alimentação' },
    { day: 22, amount: 12000, description: 'Jantar a dois', category: 'Lazer' },
    { day: 24, amount: 7500, description: 'Restaurante', category: 'Alimentação' },
    { day: 25, amount: 3500, description: 'Uber', category: 'Transporte' },
    { day: 26, amount: 15000, description: 'Compras roupa', category: 'Vestuário' },
    { day: 27, amount: 7000, description: 'Material escritório', category: 'Outros' },
    { day: 28, amount: 3500, description: 'Uber', category: 'Transporte' },
  ];

  return templates
    .filter(({ day }) => day <= maxDay)
    .map(({ day, amount, description, category }) => {
      const paddedMonth = String(month + 1).padStart(2, '0');
      const paddedDay = String(day).padStart(2, '0');
      return {
        user_id: authUserId,
        month_id: monthId,
        date: `${year}-${paddedMonth}-${paddedDay}`,
        amount,
        description,
        category,
      };
    });
}

// ============================================================
// Main
// ============================================================

const today = new Date();
const currentMonthId = computeMonthIdFromDate(today);
const prevMonthId = addMonths(currentMonthId, -1);
const todayDay = today.getDate();

async function assertNoError(label, result) {
  if (result.error) {
    console.error(`[FAIL] ${label}:`, result.error.message);
    process.exit(1);
  }
  console.log(`  [OK] ${label}`);
}

async function seed() {
  console.log('\n--- Seed ---');
  console.log(`  Months: ${prevMonthId} (prev) + ${currentMonthId} (current, up to day ${todayDay})`);

  const createUserResult = await supabase.auth.admin.createUser({
    email: USER_EMAIL,
    password: USER_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Dev User' },
  });

  await assertNoError('create auth user', createUserResult);

  const authUserId = createUserResult.data.user?.id;
  if (!authUserId) {
    console.error('[FAIL] create auth user: missing user id in response');
    process.exit(1);
  }

  // Profile
  await assertNoError(
    'upsert profile',
    await supabase.from('profiles').upsert({
      id: authUserId,
      name: 'Dev User',
      email: USER_EMAIL,
      customer_id: 'cus_dev_local_test',
      price_id: 'price_dev_local_test',
      has_access: true,
      stripe_subscription_id: 'sub_dev_local_test',
      subscription_status: 'active',
      onboarding_setup_completed: true,
      onboarding_daily_completed: true,
      onboarding_monthly_completed: true,
    }),
  );

  // Credit card
  await assertNoError(
    'insert credit_card',
    await supabase.from('credit_cards').insert({
      id: CARD_ID,
      user_id: authUserId,
      name: 'Nubank',
      closing_day: 23,
      due_day: 2,
      credit_limit: 500000,
      color: '#820AD1',
    }),
  );

  // Monthly budgets
  for (const monthId of [prevMonthId, currentMonthId]) {
    await assertNoError(
      `insert monthly_budget ${monthId}`,
      await supabase.from('monthly_budgets').insert({
        id: buildBudgetId(monthId),
        user_id: authUserId,
        month: parseMonthId(monthId).month,
        year: parseMonthId(monthId).year,
        month_id: monthId,
        total_income: 700000,
        fixed_percent: 38,
        daily_percent: 50,
        reserve_percent: 12,
        start_day: 1,
      }),
    );
  }

  // Incomes
  for (const monthId of [prevMonthId, currentMonthId]) {
    await assertNoError(
      `insert incomes ${monthId}`,
      await supabase.from('incomes').insert(buildIncomes(authUserId, monthId)),
    );
  }

  // Fixed expenses
  for (const monthId of [prevMonthId, currentMonthId]) {
    await assertNoError(
      `insert fixed_expenses ${monthId}`,
      await supabase.from('fixed_expenses').insert(
        buildFixedExpenses(authUserId, monthId, monthId === currentMonthId),
      ),
    );
  }

  // Daily expenses
  await assertNoError(
    `insert daily_expenses ${prevMonthId} (full month)`,
    await supabase.from('daily_expenses').insert(buildDailyExpenses(authUserId, prevMonthId, null)),
  );

  await assertNoError(
    `insert daily_expenses ${currentMonthId} (up to today)`,
    await supabase.from('daily_expenses').insert(buildDailyExpenses(authUserId, currentMonthId, todayDay)),
  );
}

await seed();
console.log('\nSeed complete. Login: dev@dinio.test / dev123456');
