/**
 * Monetary conversion utilities for API responses
 * Backend stores values in cents, frontend works with currency (decimal)
 */

import { toCurrency, toCents } from "@/libs/currency";

/**
 * Type brand for API responses
 * Each API response type has a unique __type discriminator
 */
export type ApiResponseType =
  | "BudgetConfigResponse"
  | "BudgetSaveResponse"
  | "YearlySummaryResponse"
  | "ExpenseResponse"
  | "ExpenseListResponse"
  | "BudgetSummary"
  | "CreditCardInvoicesResponse"
  | "CreditCardInvoiceExpensesResponse";

/**
 * Branded API response - forces explicit type annotation
 */
export interface BrandedApiResponse<T extends ApiResponseType> {
  __type: T;
}

/**
 * Monetary field configuration per type
 */
interface MonetaryFieldConfig {
  fields: string[];
  nested?: Record<string, MonetaryFieldConfig>;
}

/**
 * Request payload configurations for automatic conversion
 * Maps URL patterns to field configurations
 */
interface RequestPayloadConfig {
  pattern: RegExp;
  config: MonetaryFieldConfig;
}

const REQUEST_CONFIGS: RequestPayloadConfig[] = [
  // POST/PUT /api/budget - BudgetConfigPayload
  {
    pattern: /^\/budget$/,
    config: {
      fields: ["targetRemaining"],
      nested: {
        incomes: { fields: ["amount"] },
        expenses: { fields: ["amount"] },
        creditCards: { fields: ["limit"] },
        invoiceOpeningBalances: { fields: ["amount"] },
      },
    },
  },
  // POST /api/expenses and PATCH /api/expenses/:id - expense payloads
  {
    pattern: /^\/expenses(?:\/[^/?#]+)?(?:\?.*)?$/,
    config: {
      fields: ["amount"],
    },
  },
  // POST /api/fixed-expenses - CreateFixedExpensePayload
  {
    pattern: /^\/fixed-expenses$/,
    config: {
      fields: ["amount"],
    },
  },
];

const MONETARY_CONFIG: Record<ApiResponseType, MonetaryFieldConfig> = {
  BudgetConfigResponse: {
    fields: [
      "totalIncome",
      "totalFixed",
      "dailyBudget",
      "reserveAmount",
      "initialAvailable",
      "initialLimit",
      "totalSpent",
      "remainingBalance",
      "remainingDailyBudget",
      "idealDailyAverage",
      "recommendedDailyAverage",
      "currentDailyAverage",
      "projectedMonthEndBalance",
    ],
    nested: {
      incomes: {
        fields: ["amount"],
      },
      expenses: {
        fields: ["amount"],
      },
      creditCards: {
        fields: ["limit"],
      },
      dailyHistory: {
        fields: ["limit", "spent", "cumulativeSpent"],
        nested: {
          breakdown: { fields: ["*"] }, // All values in breakdown
          transactions: { fields: ["amount"] },
        },
      },
      wizardInitialData: {
        fields: [],
        nested: {
          incomes: { fields: ["amount"] },
          expenses: { fields: ["amount"] },
          creditCards: { fields: ["limit"] },
          invoiceOpeningBalances: { fields: ["*"] },
        },
      },
      payments: {
        fields: [],
        nested: {
          data: {
            fields: ["amount", "totalAmount"],
          },
        },
      },
    },
  },
  BudgetSaveResponse: {
    fields: [],
  },
  YearlySummaryResponse: {
    fields: [],
    nested: {
      months: {
        fields: [
          "income",
          "fixedMandatory",
          "fixedDiscretionary",
          "dailySpent",
          "plannedSavings",
          "realSavings",
        ],
      },
      totals: {
        fields: [
          "income",
          "fixedMandatory",
          "fixedDiscretionary",
          "dailySpent",
          "plannedSavings",
          "realSavings",
        ],
      },
    },
  },
  ExpenseResponse: {
    fields: ["amount"],
  },
  ExpenseListResponse: {
    fields: [],
    nested: {
      expenses: {
        fields: ["amount"],
      },
    },
  },
  BudgetSummary: {
    fields: ["totalIncome"],
    nested: {
      fixed: { fields: ["amount"] },
      daily: { fields: ["amount"] },
      reserve: { fields: ["amount"] },
    },
  },
  CreditCardInvoicesResponse: {
    fields: [],
    nested: {
      invoices: { fields: ["totalAmount"] },
    },
  },
  CreditCardInvoiceExpensesResponse: {
    fields: ["totalAmount"],
    nested: {
      expenses: { fields: ["amount"] },
    },
  },
};

/**
 * Convert monetary fields recursively (cents to currency)
 */
function convertFieldsToCurrency<T>(data: T, config: MonetaryFieldConfig): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => convertFieldsToCurrency(item, config)) as T;
  }

  if (typeof data === "object") {
    const result = { ...data } as any;

    // Convert direct fields
    for (const field of config.fields) {
      if (field === "*") {
        // Convert all numeric properties
        for (const key in result) {
          if (typeof result[key] === "number") {
            result[key] = toCurrency(result[key]);
          }
        }
      } else if (field in result && typeof result[field] === "number") {
        result[field] = toCurrency(result[field]);
      }
    }

    // Convert nested structures
    if (config.nested) {
      for (const [key, nestedConfig] of Object.entries(config.nested)) {
        if (key in result && result[key] !== null) {
          result[key] = convertFieldsToCurrency(result[key], nestedConfig);
        }
      }
    }

    return result as T;
  }

  return data;
}

/**
 * Convert monetary fields recursively (currency to cents)
 */
function convertFieldsToCents<T>(data: T, config: MonetaryFieldConfig): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => convertFieldsToCents(item, config)) as T;
  }

  if (typeof data === "object") {
    const result = { ...data } as any;

    // Convert direct fields
    for (const field of config.fields) {
      if (field === "*") {
        // Convert all numeric properties
        for (const key in result) {
          if (typeof result[key] === "number") {
            result[key] = toCents(result[key]);
          }
        }
      } else if (field in result && typeof result[field] === "number") {
        result[field] = toCents(result[field]);
      }
    }

    // Convert nested structures
    if (config.nested) {
      for (const [key, nestedConfig] of Object.entries(config.nested)) {
        if (key in result && result[key] !== null) {
          result[key] = convertFieldsToCents(result[key], nestedConfig);
        }
      }
    }

    return result as T;
  }

  return data;
}

/**
 * Convert API response from cents to currency based on explicit type
 */
export function convertResponseToCurrency<T extends ApiResponseType>(
  data: any,
  type: T,
): any {
  const config = MONETARY_CONFIG[type];
  if (!config) {
    console.warn(`No monetary config found for type: ${type}`);
    return data;
  }

  return convertFieldsToCurrency(data, config);
}

/**
 * Convert API request from currency to cents based on explicit type
 */
export function convertRequestToCents<T extends ApiResponseType>(
  data: any,
  type: T,
): any {
  const config = MONETARY_CONFIG[type];
  if (!config) {
    console.warn(`No monetary config found for type: ${type}`);
    return data;
  }

  return convertFieldsToCents(data, config);
}

/**
 * Type guard to check if response has __type discriminator
 */
export function hasTypeDiscriminator(
  data: any,
): data is { __type: ApiResponseType } {
  return data && typeof data === "object" && "__type" in data;
}

/**
 * Convert request payload from currency to cents based on URL
 * @param url - The API endpoint URL (e.g., "/budget", "/expenses")
 * @param data - The payload data to convert
 * @returns Converted payload with monetary values in cents
 */
export function convertRequestPayload(url: string, data: any): any {
  if (!data || typeof data !== "object") return data;

  // Find matching configuration
  const matchedConfig = REQUEST_CONFIGS.find((rc) => rc.pattern.test(url));

  if (!matchedConfig) {
    // No conversion needed for this endpoint
    return data;
  }

  return convertFieldsToCents(data, matchedConfig.config);
}
