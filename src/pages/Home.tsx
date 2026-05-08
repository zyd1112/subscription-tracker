import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Calendar } from 'lucide-react';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { calculateFixedMonthlyTotal, getUpcomingCharges } from '../domain/calc';

export default function Home() {
  const { subscriptions, fetchSubscriptions } = useSubscriptionStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const monthlyTotal = useMemo(() => calculateFixedMonthlyTotal(subscriptions), [subscriptions]);
  const upcomingCharges = useMemo(() => getUpcomingCharges(subscriptions, 30), [subscriptions]);
  const activeCount = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">总览</h1>

      {/* Monthly Total Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-blue-100 text-sm font-medium mb-1">每月固定支出</div>
          <div className="text-4xl font-bold">
            <span className="text-2xl mr-1">¥</span>
            {monthlyTotal.toFixed(2)}
          </div>
          <div className="mt-4 flex space-x-3">
            <button 
              onClick={() => navigate('/share')}
              className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              年度账单海报
            </button>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* Add More Prompt */}
      {activeCount < 3 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-medium text-blue-900 text-sm">订阅记录较少</div>
            <div className="text-xs text-blue-700 mt-0.5">再添加 {3 - activeCount} 个，年度账单更准确</div>
          </div>
          <Link to="/add" className="p-2 bg-white rounded-full text-blue-600 shadow-sm hover:shadow transition-shadow">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Upcoming Charges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">未来 30 天将扣费</h2>
        </div>

        {upcomingCharges.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <div className="text-gray-500 text-sm">未来 30 天没有待扣费的项目</div>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingCharges.map((charge, i) => (
              <div key={`${charge.subscriptionId}-${i}`} className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500 mr-4 font-medium">
                  {charge.date.split('-')[2]}日
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{charge.name}</h3>
                  <div className="text-sm text-gray-500">{charge.date}</div>
                </div>
                <div className="font-bold text-gray-900">
                  ¥{charge.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
