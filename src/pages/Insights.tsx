import { useEffect, useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { getMonthlyEquivalent, calculateFixedMonthlyTotal } from '../domain/calc';

export default function Insights() {
  const { subscriptions, fetchSubscriptions } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const activeSubs = useMemo(() => subscriptions.filter(s => s.status === 'active'), [subscriptions]);
  const monthlyTotal = useMemo(() => calculateFixedMonthlyTotal(activeSubs), [activeSubs]);
  const yearlyTotal = monthlyTotal * 12;

  // Category breakdown
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    activeSubs.forEach(sub => {
      const cat = sub.category || '其他';
      data[cat] = (data[cat] || 0) + getMonthlyEquivalent(sub);
    });
    
    return Object.entries(data)
      .map(([name, amount]) => ({ name, amount, percentage: amount / monthlyTotal * 100 }))
      .sort((a, b) => b.amount - a.amount);
  }, [activeSubs, monthlyTotal]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">统计</h1>

      {activeSubs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
          <PieChart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <div className="text-gray-500 text-sm">没有足够的数据进行统计</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-1">年度总支出</div>
              <div className="text-2xl font-bold text-gray-900">¥{yearlyTotal.toFixed(0)}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-sm font-medium mb-1">活跃订阅数</div>
              <div className="text-2xl font-bold text-gray-900">{activeSubs.length} 个</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">类别占比</h2>
            <div className="space-y-4">
              {categoryData.map(cat => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{cat.name}</span>
                    <span className="text-gray-500">¥{cat.amount.toFixed(0)}/月 ({cat.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
