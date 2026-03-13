# Monetary Conversion System

## Overview

This project implements an **automatic monetary conversion system** that handles the conversion between cents (backend) and currency (frontend) transparently using TypeScript discriminated unions and Axios interceptors.

## Architecture

### 1. **Backend** (API Routes)
- Stores all monetary values as **integers (cents)** in the database
- API responses include a `__type` discriminator field
- Example: `R$ 100.50` is stored as `10050`

### 2. **Frontend** (React/Context)
- Works with **decimal currency values**
- Automatic conversion happens via `apiClient` interceptor
- Example: Receives `100.50` from API (already converted from `10050`)

### 3. **Type Safety**
- Uses TypeScript branded types with `__type` discriminator
- Compile-time guarantee that conversion happens correctly

## How It Works

### Type Discriminators

All API responses extend `BrandedApiResponse<T>`:

```typescript
export interface BudgetConfigResponse extends BrandedApiResponse<'BudgetConfigResponse'> {
  __type: 'BudgetConfigResponse'; // Added automatically
  totalIncome: number; // In cents from API, converted to currency
  // ... other fields
}
```

### Automatic Conversion (Both Ways!)

#### From API (Cents → Currency) - Automatic ✅

```typescript
// API returns (cents):
{
  __type: 'BudgetConfigResponse',
  totalIncome: 10050,  // cents
  expenses: [
    { amount: 5000 }   // cents
  ]
}

// Frontend receives (currency) - AUTOMATIC via response interceptor:
{
  __type: 'BudgetConfigResponse',
  totalIncome: 100.50,  // automatically converted
  expenses: [
    { amount: 50.00 }   // automatically converted
  ]
}
```

#### To API (Currency → Cents) - Automatic ✅

```typescript
// Frontend sends (currency):
const payload = {
  incomes: [{ name: 'Salary', amount: 5000.00 }],
  expenses: [{ name: 'Rent', amount: 1500.00 }]
};

// AUTOMATIC conversion via request interceptor:
await apiClient.post('/budget', payload);
// Payload is automatically converted to cents before sending!

// No need for manual conversion anymore! 🎉
```

## Configuration

### Adding New Response Types

1. **Define the type in `types/budget.ts`:**

```typescript
export interface NewResponse extends BrandedApiResponse<'NewResponse'> {
  total: number;
  items: Array<{ price: number }>;
}
```

2. **Configure monetary fields in `types/monetary.ts`:**

```typescript
const MONETARY_CONFIG: Record<ApiResponseType, MonetaryFieldConfig> = {
  // ... existing types
  NewResponse: {
    fields: ['total'],
    nested: {
      items: { fields: ['price'] }
    }
  }
};
```

3. **Add discriminator in API route:**

```typescript
const response: NewResponse = {
  __type: 'NewResponse',
  total: totalCents,
  items: itemsWithPricesInCents
};

return NextResponse.json(response);
```

### Adding New Request Payloads

Configure automatic conversion for POST/PUT/PATCH requests:

```typescript
const REQUEST_CONFIGS: RequestPayloadConfig[] = [
  // ... existing configs
  {
    pattern: /^\/new-endpoint$/,  // URL pattern to match
    config: {
      fields: ['amount', 'total'],
      nested: {
        items: { fields: ['price'] }
      }
    }
  }
];
```

### Field Configuration Examples

```typescript
{
  // Direct fields
  fields: ['amount', 'total', 'balance'],
  
  // Nested arrays
  nested: {
    transactions: { 
      fields: ['amount'] 
    }
  },
  
  // Nested objects
  nested: {
    summary: { 
      fields: ['income', 'expenses'] 
    }
  },
  
  // Wildcard (all numeric fields)
  nested: {
    breakdown: { 
      fields: ['*'] 
    }
  }
}
```

## API Usage

### Using `apiClient` (Recommended - Fully Automatic!)

```typescript
import apiClient from '@/libs/api';

// GET - automatic conversion from cents to currency
const budget = await apiClient.get<BudgetConfigResponse>('/budget?month=0&year=2026');
console.log(budget.totalIncome); // Already in currency: 5000.00 ✅

// POST - automatic conversion from currency to cents
const payload = {
  month: 0,
  year: 2026,
  incomes: [{ 
    name: 'Salary', 
    amount: 5000.00  // Keep in currency! ✅
  }]
};
await apiClient.post('/budget', payload);
// Payload is automatically converted to cents before sending! 🎉

// PUT - automatic conversion both ways
const updatedPayload = {
  ...payload,
  incomes: [{ 
    name: 'Salary', 
    amount: 6000.00  // Still in currency! ✅
  }]
};
const updated = await apiClient.put('/budget', updatedPayload);
console.log(updated.totalIncome); // Back in currency: 6000.00 ✅
```

### Using Native `fetch` (Not Recommended)

```typescript
// You lose automatic conversion!
const response = await fetch('/api/budget');
const data = await response.json();
console.log(data.totalIncome); // Still in cents: 500000 ❌

// Need manual conversion:
import { toCurrency } from '@/libs/currency';
const income = toCurrency(data.totalIncome); // 5000.00 ✅
```

## Context Example (BudgetContext)

```typescript
import apiClient from '@/libs/api';

// Fetch - automatic conversion
const fetchBudget = async (month: number, year: number) => {
  const data = await apiClient.get(`/budget?month=${month}&year=${year}`);
  // data.totalIncome is already in currency ✅
  setCurrentConfig(data);
};

// Save - automatic conversion (no manual toCents needed!)
const saveBudget = async (payload: BudgetConfigPayload) => {
  // Just send the payload as-is in currency format! ✅
  const data = await apiClient.post('/budget', payload);
  // data comes back with values already converted to currency ✅
  setCurrentConfig(data);
};

// Add expense - automatic conversion
const addExpense = async (expense: CreateExpensePayload) => {
  // expense.amount is in currency - no conversion needed! ✅
  const data = await apiClient.post('/expenses', expense);
  // data.amount is back in currency ✅
  return data;
};
```

## Utility Functions

```typescript
import { toCents, toCurrency, formatBRL } from '@/libs/currency';

// Convert to cents (for sending to API)
const cents = toCents(100.50);  // 10050

// Convert to currency (for display)
const currency = toCurrency(10050);  // 100.50

// Format for Brazilian display
const formatted = formatBRL(100.50);  // "R$ 100,50"
```

## Type Safety Guarantees

✅ **Compile-time checks**: TypeScript enforces `__type` field
✅ **Runtime validation**: Interceptor checks for discriminator
✅ **Configuration mismatch detection**: Warns if type not in config
✅ **Type inference**: Full autocomplete and type checking

## Best Practices

1. **Always use `apiClient`** instead of native `fetch`
2. **Keep values in currency** - conversion is automatic both ways! ✅
3. **Trust the interceptors** - no manual `toCents`/`toCurrency` needed
4. **Add `__type` to API responses** for automatic response conversion
5. **Configure request patterns** in `REQUEST_CONFIGS` for new endpoints
6. **Test edge cases**: Verify rounding, null values, nested arrays

## Testing

```typescript
// Test monetary conversion
import { toCents, toCurrency } from '@/libs/currency';

describe('Currency conversion', () => {
  it('converts currency to cents', () => {
    expect(toCents(100.50)).toBe(10050);
    expect(toCents(0.01)).toBe(1);
  });

  it('converts cents to currency', () => {
    expect(toCurrency(10050)).toBe(100.50);
    expect(toCurrency(1)).toBe(0.01);
  });
  
  it('handles rounding', () => {
    expect(toCents(100.505)).toBe(10051); // Rounds up
    expect(toCents(100.504)).toBe(10050); // Rounds down
  });
});
```

## Migration Checklist

When adding a new API endpoint:

- [ ] Add `__type` discriminator to response interface
- [ ] Extend `BrandedApiResponse<'TypeName'>`
- [ ] Configure monetary fields in `MONETARY_CONFIG`
- [ ] Add `__type: 'TypeName'` to API response
- [ ] Convert incoming payload to cents before processing
- [ ] Test both GET and POST with real values
- [ ] Verify conversion in browser DevTools
