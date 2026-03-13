/**
 * Expense Category Definitions
 * Centralized configuration for all expense categories with labels, emojis, and colors.
 */

export interface ExpenseCategory {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  {
    value: "Mercado",
    label: "Mercado",
    emoji: "🛒",
    color: "#10b981", // emerald-500
  },
  {
    value: "Restaurantes",
    label: "Restaurantes",
    emoji: "🍽️",
    color: "#14b8a6", // teal-500
  },
  {
    value: "Delivery",
    label: "Delivery",
    emoji: "🛵",
    color: "#f97316", // orange-500
  },
  {
    value: "Transporte",
    label: "Transporte",
    emoji: "🚗",
    color: "#f59e0b", // amber-500
  },
  {
    value: "Lazer",
    label: "Lazer",
    emoji: "🎉",
    color: "#ec4899", // pink-500
  },
  {
    value: "Família",
    label: "Família",
    emoji: "👪",
    color: "#ef4444", // red-500
  },
  {
    value: "Saúde",
    label: "Saúde",
    emoji: "❤️",
    color: "#06b6d4", // cyan-500
  },
  {
    value: "Cuidados Pessoais",
    label: "Cuidados pessoais",
    emoji: "💇",
    color: "#d946ef", // fuchsia-500
  },
  {
    value: "Presentes",
    label: "Presentes",
    emoji: "🎁",
    color: "#a855f7", // purple-500
  },
  {
    value: "Imprevistos",
    label: "Imprevistos",
    emoji: "🚨",
    color: "#dc2626", // red-600
  },
  {
    value: "Outros",
    label: "Outros",
    emoji: "📦",
    color: "#94a3b8", // slate-400
  },
] as const;

/**
 * Category options formatted for select dropdowns
 */
export const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((cat) => ({
  value: cat.value,
  label: `${cat.emoji} ${cat.label}`,
}));

/**
 * Map of category values to their full configuration
 */
export const CATEGORY_MAP = EXPENSE_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.value] = cat;
    return acc;
  },
  {} as Record<string, ExpenseCategory>,
);

/**
 * Map of category values to colors (for backward compatibility)
 */
export const CATEGORY_COLORS = EXPENSE_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.value] = cat.color;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Get category color by value, with fallback to default
 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS["Outros"];
}

/**
 * Get full category configuration by value
 */
export function getCategory(value: string): ExpenseCategory | undefined {
  return CATEGORY_MAP[value];
}

/**
 * Get emoji for a category
 */
export function getCategoryEmoji(category: string): string {
  return CATEGORY_MAP[category]?.emoji || CATEGORY_MAP["Outros"].emoji;
}
