import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { getMonthlyEquivalent } from '../domain/calc';

export default function Subscriptions() {
  const { subscriptions, fetchSubscriptions, updateSubscription, deleteSubscription } = useSubscriptionStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleToggleStatus = async (e: React.MouseEvent, id: string, currentStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateSubscription(id, { status: newStatus as any });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这个订阅吗？')) {
      await deleteSubscription(id);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的订阅</h1>
        <Link
          to="/add"
          className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition-colors"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-gray-400 mb-4">还没有任何订阅记录</div>
          <Link
            to="/add"
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
          >
            <Plus className="w-5 h-5 mr-1" />
            添加第一个订阅
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map(sub => {
            const monthlyCost = getMonthlyEquivalent(sub);
            const isActive = sub.status === 'active';
            
            return (
              <div
                key={sub.id}
                onClick={() => navigate(`/edit/${sub.id}`)}
                className={`flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${!isActive ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{sub.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex items-center space-x-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {sub.billingPeriod === 'monthly' && '每月'}
                      {sub.billingPeriod === 'yearly' && '每年'}
                      {sub.billingPeriod === 'weekly' && '每周'}
                      {sub.billingPeriod === 'custom_days' && `${sub.customDays}天`}
                    </span>
                    <span>下次扣费: {sub.nextChargeDate}</span>
                  </div>
                </div>
                
                <div className="text-right mr-4">
                  <div className="font-bold text-gray-900">¥{sub.amount.toFixed(2)}</div>
                  {isActive && <div className="text-xs text-gray-500">约 ¥{monthlyCost.toFixed(2)}/月</div>}
                  {!isActive && <div className="text-xs text-orange-500 font-medium">{sub.status === 'paused' ? '已暂停' : '已取消'}</div>}
                </div>

                <div className="flex items-center space-x-2 text-gray-400">
                  <button 
                    onClick={(e) => handleToggleStatus(e, sub.id, sub.status)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title={isActive ? '暂停' : '恢复'}
                  >
                    {isActive ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, sub.id)}
                    className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
