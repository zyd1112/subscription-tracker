import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Crown, Check } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { calculateFixedMonthlyTotal, getMonthlyEquivalent } from '../domain/calc';
import { getSettings, saveSettings } from '../storage/settings';

export default function Share() {
  const navigate = useNavigate();
  const posterRef = useRef<HTMLDivElement>(null);
  const { subscriptions, fetchSubscriptions } = useSubscriptionStore();
  
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    setIsPro(getSettings().isPro);
  }, [fetchSubscriptions]);

  const activeSubs = useMemo(() => subscriptions.filter(s => s.status === 'active'), [subscriptions]);
  const monthlyTotal = useMemo(() => calculateFixedMonthlyTotal(activeSubs), [activeSubs]);
  const yearlyTotal = monthlyTotal * 12;

  // Top 3 subs
  const topSubs = useMemo(() => {
    return [...activeSubs]
      .sort((a, b) => getMonthlyEquivalent(b) - getMonthlyEquivalent(a))
      .slice(0, 3);
  }, [activeSubs]);

  const handleExport = async (highRes: boolean) => {
    if (highRes && !isPro) {
      setShowPaywall(true);
      return;
    }

    if (!posterRef.current) return;
    
    setIsExporting(true);
    try {
      // 临时移除水印样式（如果是 Pro）
      const watermarkEl = posterRef.current.querySelector('.watermark-overlay') as HTMLElement;
      if (watermarkEl && isPro && highRes) {
        watermarkEl.style.display = 'none';
      }

      const dataUrl = await htmlToImage.toPng(posterRef.current, {
        quality: highRes ? 1.0 : 0.8,
        pixelRatio: highRes ? 3 : 2, // 提升普通海报的清晰度，高清使用更高的3倍率
      });

      // 恢复水印显示
      if (watermarkEl) {
        watermarkEl.style.display = '';
      }

      const link = document.createElement('a');
      link.download = `年度订阅账单-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('导出图片失败，请稍后再试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpgrade = () => {
    // 模拟支付成功
    saveSettings({ isPro: true });
    setIsPro(true);
    setShowPaywall(false);
    alert('购买成功！已解锁 Pro 权限。');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">生成年度账单</h1>
        </div>
        {!isPro && (
          <button 
            onClick={() => setShowPaywall(true)}
            className="flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full"
          >
            <Crown className="w-4 h-4 mr-1" />
            升级 Pro
          </button>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-2xl flex justify-center mb-8 overflow-hidden">
        {/* 海报容器 */}
        <div 
          ref={posterRef}
          className="relative bg-white w-[340px] rounded-xl shadow-sm overflow-hidden flex flex-col"
          style={{ minHeight: '540px' }}
        >
          {/* 顶部装饰 */}
          <div className="bg-blue-600 p-6 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 opacity-20 rounded-full blur-xl transform -translate-x-10 translate-y-10"></div>
            
            <h2 className="text-sm font-medium opacity-90 relative z-10 mb-1">我一年在会员上花了</h2>
            <div className="text-4xl font-bold relative z-10 tracking-tight">
              <span className="text-2xl mr-1">¥</span>
              {yearlyTotal.toFixed(2)}
            </div>
            <div className="text-blue-100 text-xs mt-3 relative z-10 flex justify-center items-center space-x-2">
              <span>平均每月 ¥{monthlyTotal.toFixed(2)}</span>
              <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
              <span>订阅数 {activeSubs.length}</span>
            </div>
          </div>

          {/* 内容区 */}
          <div className="p-6 flex-1 bg-gray-50 flex flex-col">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top 3 开销</h3>
              <div className="space-y-3">
                {topSubs.map((sub, i) => (
                  <div key={sub.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-2">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{sub.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">¥{getMonthlyEquivalent(sub).toFixed(0)}/月</span>
                  </div>
                ))}
                {topSubs.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-2">暂无订阅数据</div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="text-[10px] text-gray-400 text-center">
                按当前订阅估算｜不含一次性消费
              </div>
            </div>
          </div>

          {/* 水印遮罩 */}
          <div className="watermark-overlay absolute bottom-2 right-2 text-[10px] text-gray-300 font-medium opacity-70 pointer-events-none">
            来自「订阅管家」
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => handleExport(true)}
          disabled={isExporting}
          className="w-full flex items-center justify-center py-3.5 bg-blue-600 text-white rounded-xl font-medium text-lg hover:bg-blue-700 shadow-md transition-all"
        >
          {isExporting ? '生成中...' : (
            <>
              <Download className="w-5 h-5 mr-2" />
              下载高清无水印海报 {isPro ? '' : '(Pro)'}
            </>
          )}
        </button>
        
        {!isPro && (
          <button 
            onClick={() => handleExport(false)}
            disabled={isExporting}
            className="w-full py-3.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            下载带水印海报
          </button>
        )}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center text-white">
              <Crown className="w-12 h-12 mx-auto mb-2 text-amber-100" />
              <h2 className="text-xl font-bold">解锁 Pro 权限</h2>
              <p className="text-amber-100 text-sm mt-1">把会员开销看清楚，并在续费前提醒你</p>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {['无限订阅条目', '高清海报无水印', '多设备不丢数据'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 text-center">
                {/* 增加一个固定的高度，防止图片加载失败时塌陷，同时添加 onError 处理 */}
                <div className="w-32 h-32 mx-auto mb-2 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden border border-gray-100">
                  <img 
                    src="/pay-qrcode.png" 
                    alt="微信收款码" 
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      // 图片加载失败时显示占位文字
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerHTML = '<span class="text-xs text-gray-400">请将收款码保存为<br/>public/pay-qrcode.png</span>';
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">扫码支付 ¥29 后，添加微信获取激活码</p>
              </div>

              <div className="text-center mt-3">
                <button onClick={() => setShowPaywall(false)} className="text-sm text-gray-400 hover:text-gray-600">
                  先不用了，返回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
