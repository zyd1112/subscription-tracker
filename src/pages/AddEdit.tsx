import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format, addMonths, addYears } from 'date-fns';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { Subscription, BillingPeriod } from '../domain/subscription';

export default function AddEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscriptions, addSubscription, updateSubscription } = useSubscriptionStore();
  
  const isEdit = Boolean(id);
  const existingSub = isEdit ? subscriptions.find(s => s.id === id) : null;

  const [name, setName] = useState(existingSub?.name || '');
  const [amount, setAmount] = useState(existingSub?.amount.toString() || '');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(existingSub?.billingPeriod || 'monthly');
  const [customDays, setCustomDays] = useState(existingSub?.customDays?.toString() || '');
  
  // Default to next month if adding new
  const [nextChargeDate, setNextChargeDate] = useState(
    existingSub?.nextChargeDate || format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  
  const [category, setCategory] = useState(existingSub?.category || '其他');
  const [notes, setNotes] = useState(existingSub?.notes || '');
  
  const categories = ['视频', '音乐', '网盘', '工具', 'AI', '健身', '学习', '其他'];

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value as BillingPeriod;
    setBillingPeriod(period);
    
    if (!isEdit) {
      const today = new Date();
      let nextDate = today;
      if (period === 'monthly') {
        nextDate = addMonths(today, 1);
      } else if (period === 'yearly') {
        nextDate = addYears(today, 1);
      }
      setNextChargeDate(format(nextDate, 'yyyy-MM-dd'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !nextChargeDate) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('请输入有效的金额');
      return;
    }

    const subData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> = {
      name,
      amount: numAmount,
      currency: 'CNY',
      billingPeriod,
      customDays: billingPeriod === 'custom_days' ? parseInt(customDays, 10) : undefined,
      nextChargeDate,
      category,
      status: existingSub?.status || 'active',
      notes,
    };

    if (isEdit && id) {
      await updateSubscription(id, subData);
    } else {
      await addSubscription(subData);
    }
    
    navigate(-1);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? '编辑订阅' : '添加订阅'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
          <input 
            type="text" 
            required
            placeholder="例如：Netflix, iCloud"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">金额 (¥) *</label>
            <input 
              type="number" 
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">周期 *</label>
            <select 
              value={billingPeriod}
              onChange={handlePeriodChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="monthly">每月</option>
              <option value="yearly">每年</option>
              <option value="weekly">每周</option>
              <option value="custom_days">自定义天数</option>
            </select>
          </div>
        </div>

        {billingPeriod === 'custom_days' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">间隔天数 *</label>
            <input 
              type="number" 
              required
              min="1"
              value={customDays}
              onChange={e => setCustomDays(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">下次扣费日 *</label>
          <input 
            type="date" 
            required
            value={nextChargeDate}
            onChange={e => setNextChargeDate(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类别</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  category === cat 
                    ? 'bg-blue-100 text-blue-700 font-medium border border-blue-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注 (可选)</label>
          <textarea 
            rows={2}
            placeholder="例如：首月优惠、试用到期后取消"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-700 shadow-md transition-all active:scale-[0.98]"
          >
            保存订阅
          </button>
        </div>
      </form>
    </div>
  );
}
