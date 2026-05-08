export type BillingPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom_days';
export type SubscriptionStatus = 'active' | 'paused' | 'canceled';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string; // 默认 CNY
  billingPeriod: BillingPeriod;
  customDays?: number; // 当 billingPeriod 为 custom_days 时必填
  nextChargeDate: string; // 格式: YYYY-MM-DD
  category?: string;
  paymentMethod?: string;
  status: SubscriptionStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
