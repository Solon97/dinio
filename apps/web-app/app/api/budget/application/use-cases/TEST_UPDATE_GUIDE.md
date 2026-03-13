# Test Update Guide for Allocation Refactoring

## Changes Made

The budget allocation system has been refactored to remove redundant monetary columns from the database. Here's what changed:

### Database Schema Changes

**Removed columns from `monthly_budgets` table:**
- `total_fixed` (INT) - Now calculated dynamically
- `daily_budget` (INT) - Now calculated dynamically
- `reserve_amount` (INT) - Now calculated dynamically

**Retained columns:**
- `total_income` (INT) - Source of truth for income
- `fixed_percent` (DECIMAL) - User's allocation preference
- `daily_percent` (DECIMAL) - User's allocation preference
- `reserve_percent` (DECIMAL) - User's allocation preference
- `initial_spent` (INT) - Mid-month setup adjustment (never edited)
- `start_day` (INT) - Budget calculation start day

### Code Changes

1. **New helper function** (`libs/financeService.ts`):
   ```typescript
   calculateAllocationValues(
     totalIncomeCents,
     fixedPercent,
     dailyPercent,
     reservePercent
   ): AllocationValues
   ```
   - Validates percentages sum to ~100% (±0.1% tolerance)
   - Returns calculated values in cents

2. **CreateBudgetUseCase**:
   - Uses `calculateAllocationValues()` instead of manual calculation
   - Removed `totalFixed`, `dailyBudget`, `reserveAmount` from INSERT/UPDATE

3. **UpdateBudgetUseCase**:
   - Uses `calculateAllocationValues()` instead of manual calculation
   - Removed `totalFixed`, `dailyBudget`, `reserveAmount` from UPDATE
   - **CRITICAL**: `initial_spent` is now PRESERVED and never edited

4. **GetBudgetUseCase**:
   - Calculates `totalFixed`, `dailyBudget`, `reserveAmount` dynamically
   - Removed database reads for these fields

5. **BudgetConfig entity** (`domain/entities/BudgetConfig.ts`):
   - Removed `totalFixed`, `dailyBudget`, `reserveAmount` properties

6. **SupabaseBudgetRepository**:
   - Updated `findByUserAndMonth()`, `create()`, `update()` to exclude monetary allocation fields

## How to Update Tests

### Mock Data Changes

**OLD** (remove):
```typescript
const mockConfig = {
  totalIncome: 500000,
  totalFixed: 200000,      // ❌ Remove
  fixedPercent: 40.0,
  dailyBudget: 100000,     // ❌ Remove
  dailyPercent: 20.0,
  reserveAmount: 200000,   // ❌ Remove
  reservePercent: 40.0,
};
```

**NEW** (keep):
```typescript
const mockConfig = {
  totalIncome: 500000,
  fixedPercent: 40.0,
  dailyPercent: 20.0,
  reservePercent: 40.0,
  remainingDailyBudget: 0,
  startDay: 1,
};
```

### Assertion Changes

**OLD**:
```typescript
expect(mockBudgetRepo.create).toHaveBeenCalledWith({
  totalFixed: 200000,     // ❌ Remove
  dailyBudget: 100000,    // ❌ Remove
  reserveAmount: 200000,  // ❌ Remove
});
```

**NEW**:
```typescript
expect(mockBudgetRepo.create).toHaveBeenCalledWith({
  totalIncome: 500000,
  fixedPercent: 40.0,
  dailyPercent: 20.0,
  reservePercent: 40.0,
  remainingDailyBudget: 0,
  startDay: 1,
});
```

### Response Validation

Tests can still validate calculated values in the response:

```typescript
const result = await useCase.execute(request);

// These are calculated dynamically and returned in response
expect(result.totalFixed).toBe(200000);       // ✅ OK - response field
expect(result.dailyBudget).toBe(100000);      // ✅ OK - response field
expect(result.reserveAmount).toBe(200000);    // ✅ OK - response field
```

### Validation Tests

Add new tests for allocation validation:

```typescript
it('should throw error if percentages do not sum to 100%', async () => {
  const request = {
    allocation: {
      fixedPercent: 30.0,
      dailyPercent: 30.0,
      reservePercent: 30.0,  // Sum = 90%, should fail
    },
  };

  await expect(useCase.execute(request)).rejects.toThrow();
});

it('should allow rounding tolerance of ±0.1%', async () => {
  const request = {
    allocation: {
      fixedPercent: 33.3,
      dailyPercent: 33.3,
      reservePercent: 33.4,  // Sum = 100.0%, should pass
    },
  };

  await expect(useCase.execute(request)).resolves.toBeDefined();
});
```

## Migration Steps

1. ✅ Update code (use cases, repositories, entities)
2. ✅ Create database migration
3. ⚠️ Update tests (see patterns above)
4. Run tests: `npm test`
5. Apply migration: `npx supabase db push`
6. Verify in dev environment

## Rollback Plan

If issues are found, rollback is simple since app is not in production:
1. Revert code changes
2. Revert migration (drop constraints, add columns back)
3. Re-test

## Key Takeaways

- ✅ Single source of truth: percentages + total_income
- ✅ Validation ensures data integrity
- ✅ Mid-month adjustment (`initial_spent`) is preserved on edit
- ✅ No more sync issues between monetary values and percentages
- ✅ Database constraints prevent invalid data
