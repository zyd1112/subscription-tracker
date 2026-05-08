import { describe, it, expect } from 'vitest';
import { Subscription } from './subscription';
import {
  getMonthlyEquivalent,
  getYearlyEquivalent,
  calculateFixedMonthlyTotal,
  getUpcomingCharges
} from './calc';

describe('calc domain', () => {
  const baseSub: Subscription = {
    id: '1',
    name: 'Netflix',
    amount: 120,
    currency: 'CNY',
    billingPeriod: 'monthly',
    nextChargeDate: '2026-05-10',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  it('calculates monthly equivalent for monthly', () => {
    expect(getMonthlyEquivalent(baseSub)).toBe(120);
  });

  it('calculates monthly equivalent for yearly', () => {
    const yearly = { ...baseSub, billingPeriod: 'yearly' as const, amount: 1200 };
    expect(getMonthlyEquivalent(yearly)).toBe(100);
  });

  it('calculates monthly equivalent for weekly', () => {
    const weekly = { ...baseSub, billingPeriod: 'weekly' as const, amount: 10 };
    // 10 * 52 / 12 = 43.333...
    expect(getMonthlyEquivalent(weekly)).toBeCloseTo(43.33, 2);
  });

  it('calculates monthly equivalent for custom_days', () => {
    const custom = { ...baseSub, billingPeriod: 'custom_days' as const, amount: 15, customDays: 15 };
    // 15 * (30 / 15) = 30
    expect(getMonthlyEquivalent(custom)).toBe(30);
  });

  it('calculates yearly equivalent', () => {
    expect(getYearlyEquivalent(baseSub)).toBe(1440);
  });

  it('ignores non-active subs for equivalent', () => {
    const paused = { ...baseSub, status: 'paused' as const };
    expect(getMonthlyEquivalent(paused)).toBe(0);
  });

  it('calculates fixed monthly total', () => {
    const subs: Subscription[] = [
      { ...baseSub, id: '1', amount: 100, billingPeriod: 'monthly' },
      { ...baseSub, id: '2', amount: 1200, billingPeriod: 'yearly' },
      { ...baseSub, id: '3', amount: 50, billingPeriod: 'monthly', status: 'paused' }
    ];
    expect(calculateFixedMonthlyTotal(subs)).toBe(200); // 100 + 100 + 0
  });

  describe('getUpcomingCharges', () => {
    it('returns charges within window', () => {
      const subs: Subscription[] = [
        { ...baseSub, id: '1', name: 'Sub1', amount: 10, nextChargeDate: '2026-05-15', billingPeriod: 'monthly' },
        { ...baseSub, id: '2', name: 'Sub2', amount: 20, nextChargeDate: '2026-06-20', billingPeriod: 'monthly' },
        { ...baseSub, id: '3', name: 'Sub3', amount: 30, nextChargeDate: '2026-05-05', billingPeriod: 'monthly' }, // past
      ];
      
      const charges = getUpcomingCharges(subs, 30, '2026-05-08');
      
      // 窗口: 2026-05-08 ~ 2026-06-07
      // Sub1: 2026-05-15 (in window)
      // Sub2: 2026-06-20 (out of window)
      // Sub3: 2026-05-05 推演 -> 2026-06-05 (in window)
      expect(charges).toHaveLength(2);
      
      const ids = charges.map(c => c.subscriptionId);
      expect(ids).toContain('1');
      expect(ids).toContain('3');
      
      const dates = charges.map(c => c.date);
      expect(dates).toEqual(['2026-05-15', '2026-06-05']); // 已经排序过
    });

    it('returns multiple charges for short periods', () => {
      const subs: Subscription[] = [
        { ...baseSub, id: '1', name: 'WeeklySub', amount: 10, nextChargeDate: '2026-05-10', billingPeriod: 'weekly' }
      ];
      
      const charges = getUpcomingCharges(subs, 20, '2026-05-08');
      // window is 2026-05-08 to 2026-05-28
      // nextChargeDate: 2026-05-10
      // subsequent: 2026-05-17
      // subsequent: 2026-05-24
      // subsequent: 2026-05-31 (out of window)
      
      expect(charges).toHaveLength(3);
      expect(charges.map(c => c.date)).toEqual(['2026-05-10', '2026-05-17', '2026-05-24']);
    });
  });
});
