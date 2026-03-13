/**
 * Profile type representing user's Stripe subscription data
 */
export interface Profile {
  id: string;
  email: string | null;
  customer_id: string | null;
  price_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status:
    | "inactive"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired";
  has_access: boolean;
  onboarding_setup_completed: boolean;
  onboarding_daily_completed: boolean;
  onboarding_monthly_completed: boolean;
  onboarding_yearly_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for creating/updating a profile
 */
export interface ProfileUpdatePayload {
  email?: string;
  customer_id?: string;
  price_id?: string;
  stripe_subscription_id?: string | null;
  subscription_status?:
    | "inactive"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired";
  has_access?: boolean;
  onboarding_setup_completed?: boolean;
  onboarding_daily_completed?: boolean;
  onboarding_monthly_completed?: boolean;
  onboarding_yearly_completed?: boolean;
}
