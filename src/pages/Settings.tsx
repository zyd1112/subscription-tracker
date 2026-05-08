import { useEffect, useState } from 'react';
import { Calendar, Crown, Trash2, Key } from 'lucide-react';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { getSettings, saveSettings } from '../storage/settings';
import { generateICS } from '../domain/ics';
import * as db from '../storage/db';

export default function SettingsPage() {
  const { subscriptions, fetchSubscriptions } = useSubscriptionStore();
  const [isPro, setIsPro] = useState(false);
  const [activationCode, setActivationCode] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    setIsPro(getSettings().isPro);
  }, [fetchSubscriptions]);

  const handleActivatePro = () => {
    // 简单的激活码逻辑（你可以随时在这里更改激活码）
    if (activationCode.trim().toUpperCase() === 'EARLYBIRD-2026') {
      saveSettings({ isPro: true });
      setIsPro(true);
      setActivationCode('');
      alert('激活成功！已解锁 Pro 权限。');
    } else {
      alert('激活码无效，请重试');
    }
  };

  const handleExportICS = () => {
    if (subscriptions.length === 0) {
      alert('没有订阅数据可导出');
      return;
    }
    const icsContent = generateICS(subscriptions);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'subscriptions.ics';
    link.click();
  };

  const handleClearData = async () => {
    if (confirm('确定要清除所有本地数据吗？此操作不可恢复。')) {
      await db.clearAllData();
      saveSettings({ isPro: false });
      window.location.reload();
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center">
              <Crown className={`w-5 h-5 mr-3 ${isPro ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className="font-medium text-gray-900">Pro 状态</span>
            </div>
            <span className={`text-sm font-medium ${isPro ? 'text-amber-600' : 'text-gray-500'}`}>
              {isPro ? '已解锁' : '未解锁'}
            </span>
          </div>

          {!isPro && (
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">输入激活码解锁 Pro</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="请输入客服提供的激活码" 
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={handleActivatePro}
                  disabled={!activationCode.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  <Key className="w-4 h-4 mr-1" />
                  激活
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleExportICS}
            className="w-full p-4 border-b border-gray-100 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <div className="font-medium text-gray-900">导出日历 (ICS)</div>
                <div className="text-xs text-gray-500 mt-0.5">将未来 1 年的扣费提醒导入系统日历</div>
              </div>
            </div>
          </button>

          <button 
            onClick={handleClearData}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-red-50 transition-colors group"
          >
            <div className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-3 group-hover:text-red-700" />
              <span className="font-medium group-hover:text-red-700">清除所有数据</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
