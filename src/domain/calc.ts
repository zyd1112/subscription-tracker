import { addDays, addMonths, addWeeks, addYears, isAfter, isBefore, isEqual, parseISO, format } from 'date-fns';
import { Subscription } from './subscription';

export function getMonthlyEquivalent(sub: Subscription): number {
  if (sub.status !== 'active') return 0;
  
  switch (sub.billingPeriod) {
    case 'weekly':
      return (sub.amount * 52) / 12;
    case 'monthly':
      return sub.amount;
    case 'yearly':
      return sub.amount / 12;
    case 'custom_days':
      if (!sub.customDays || sub.customDays <= 0) return 0;
      return sub.amount * (30 / sub.customDays);
    default:
      return 0;
  }
}

export function getYearlyEquivalent(sub: Subscription): number {
  return getMonthlyEquivalent(sub) * 12;
}

export function calculateFixedMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((total, sub) => total + getMonthlyEquivalent(sub), 0);
}

export interface UpcomingCharge {
  subscriptionId: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

function getNextDate(date: Date, sub: Subscription): Date | null {
  if (sub.billingPeriod === 'weekly') return addWeeks(date, 1);
  if (sub.billingPeriod === 'monthly') return addMonths(date, 1);
  if (sub.billingPeriod === 'yearly') return addYears(date, 1);
  if (sub.billingPeriod === 'custom_days' && sub.customDays) return addDays(date, sub.customDays);
  return null;
}

export function getUpcomingCharges(
  subs: Subscription[],
  windowDays: number = 30,
  referenceDateStr: string = format(new Date(), 'yyyy-MM-dd')
): UpcomingCharge[] {
  const charges: UpcomingCharge[] = [];
  const refDate = parseISO(referenceDateStr);
  const windowEndDate = addDays(refDate, windowDays);

  for (const sub of subs) {
    if (sub.status !== 'active') continue;

    let currentDate = parseISO(sub.nextChargeDate);
    
    let iterations = 0;
    // 如果下次扣费日已经在过去，推演到当前或者未来
    while (isBefore(currentDate, refDate) && iterations < 1000) {
      const nextDate = getNextDate(currentDate, sub);
      if (!nextDate) break;
      currentDate = nextDate;
      iterations++;
    }

    iterations = 0;
    // 收集窗口内的扣费日
    while ((isBefore(currentDate, windowEndDate) || isEqual(currentDate, windowEndDate)) && iterations < 100) {
      if (isAfter(currentDate, refDate) || isEqual(currentDate, refDate)) {
        charges.push({
          subscriptionId: sub.id,
          name: sub.name,
          amount: sub.amount,
          date: format(currentDate, 'yyyy-MM-dd')
        });
      }

      const nextDate = getNextDate(currentDate, sub);
      if (!nextDate) break;
      currentDate = nextDate;
      iterations++;
    }
  }

  return charges.sort((a, b) => a.date.localeCompare(b.date));
}
