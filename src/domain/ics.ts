import { Subscription } from './subscription';
import { getUpcomingCharges } from './calc';

export function generateICS(subs: Subscription[]): string {
  // 导出未来 365 天的所有扣费事件
  const charges = getUpcomingCharges(subs, 365);
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Subscription Tracker//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const now = new Date();
  const dtstamp = formatICSDate(now) + 'T' + formatICSTime(now) + 'Z';

  charges.forEach((charge, index) => {
    const dateStr = charge.date.replace(/-/g, ''); // YYYYMMDD
    
    const d = new Date(charge.date);
    d.setDate(d.getDate() + 1);
    const dateEndStr = d.toISOString().split('T')[0].replace(/-/g, '');

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:sub-${charge.subscriptionId}-${dateStr}-${index}@subtracker`);
    ics.push(`DTSTAMP:${dtstamp}`);
    ics.push(`DTSTART;VALUE=DATE:${dateStr}`);
    ics.push(`DTEND;VALUE=DATE:${dateEndStr}`);
    ics.push(`SUMMARY:扣费提醒: ${charge.name} (¥${charge.amount.toFixed(2)})`);
    ics.push(`DESCRIPTION:您的订阅 ${charge.name} 即将扣费 ¥${charge.amount.toFixed(2)}`);
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

function formatICSDate(d: Date): string {
  return d.toISOString().split('T')[0].replace(/-/g, '');
}

function formatICSTime(d: Date): string {
  return d.toISOString().split('T')[1].replace(/[:.]/g, '').substring(0, 6);
}
