import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Bell, 
  Sparkles, 
  SlidersHorizontal, 
  LineChart, 
  FlaskConical, 
  BookOpen, 
  ShieldAlert,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';
import { StockItem } from '../types/stock';

export type ActiveTab = 'dashboard' | 'screener' | 'annisa-ai' | 'backtest' | 'alerts' | 'education';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenAlertsDrawer: () => void;
  unreadAlertsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  stocks: StockItem[];
  selectedStock: StockItem;
  onSelectStock: (stock: StockItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAlertsDrawer,
  unreadAlertsCount,
  soundEnabled,
  onToggleSound,
  stocks,
  selectedStock,
  onSelectStock
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [sessionStatus, setSessionStatus] = useState<{ status: string; color: string }>({
    status: 'Sesi Berjalan',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  });

  // Real-time Indonesian Western Time (WIB) Clock & IDX Session determination
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC+7 for WIB
      const wibHours = (now.getUTCHours() + 7) % 24;
      const wibMinutes = now.getUTCMinutes();
      const wibSeconds = now.getUTCSeconds();
      const day = now.getUTCDay(); // 0 is Sunday, 6 is Saturday

      const formatted = `${String(wibHours).padStart(2, '0')}:${String(wibMinutes).padStart(2, '0')}:${String(wibSeconds).padStart(2, '0')} WIB`;
      setTimeStr(formatted);

      // IDX Trading Hours (Monday to Friday)
      if (day === 0 || day === 6) {
        setSessionStatus({
          status: 'Pasar Tutup (Weekend)',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        });
      } else {
        const timeVal = wibHours * 100 + wibMinutes;
        if (timeVal >= 845 && timeVal < 900) {
          setSessionStatus({ status: 'Pre-Opening', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' });
        } else if (timeVal >= 900 && timeVal < 1200) {
          setSessionStatus({ status: 'Sesi I Buka', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' });
        } else if (timeVal >= 1200 && timeVal < 1330) {
          setSessionStatus({ status: 'Istirahat Sesi', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' });
        } else if (timeVal >= 1330 && timeVal < 1550) {
          setSessionStatus({ status: 'Sesi II Buka', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' });
        } else if (timeVal >= 1550 && timeVal < 1615) {
          setSessionStatus({ status: 'Post-Trading', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' });
        } else {
          setSessionStatus({ status: 'Pasar Tutup', color: 'text-slate-400 bg-slate-800 border-slate-700' });
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Top Gainers & Value tickers for header marquee
  const topTickers = stocks.slice(0, 8);

  return (
    <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Bar: Live Running Ticker & IDX Status */}
      <div className="bg-[#080b10] border-b border-slate-800/50 px-4 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5">
          {/* IHSG Composite benchmark */}
          <div className="flex items-center gap-1.5 font-mono shrink-0 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
            <span className="text-slate-400 font-bold">IHSG</span>
            <span className="text-slate-100 font-semibold">7,485.20</span>
            <span className="text-emerald-400 font-medium flex items-center text-[11px]">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +0.68%
            </span>
          </div>

          {/* Running Stocks */}
          <div className="flex items-center gap-3 shrink-0">
            {topTickers.map((s) => (
              <button
                key={s.ticker}
                onClick={() => onSelectStock(s)}
                className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded transition ${
                  selectedStock.ticker === s.ticker ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">{s.ticker}</span>
                <span className="text-slate-400">Rp {s.price.toLocaleString('id-ID')}</span>
                <span className={s.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {s.changePct >= 0 ? '+' : ''}{s.changePct}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* IDX Clock & Session State */}
        <div className="flex items-center gap-2.5 shrink-0 pl-3 border-l border-slate-800 text-[11px]">
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center gap-1 ${sessionStatus.color}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {sessionStatus.status}
          </span>
          <span className="text-slate-400 font-mono hidden sm:inline flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {timeStr}
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
                <div className="w-full h-full bg-[#0c1017] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">Annisa<span className="text-cyan-400">.AI</span></span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    IDX Pro
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 tracking-tight -mt-0.5">Analisa Teknikal Saham AI & Screener</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Dashboard & Chart</span>
            </button>

            <button
              onClick={() => setActiveTab('screener')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'screener'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Screener Saham</span>
            </button>

            <button
              onClick={() => setActiveTab('annisa-ai')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'annisa-ai'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Annisa AI Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('backtest')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'backtest'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <span>Backtest Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition relative ${
                activeTab === 'alerts'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Peringatan Dini</span>
              {unreadAlertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'education'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Akademi</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Quick Search Shortcut */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 text-xs transition"
              title="Cari Saham (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cari Saham...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] rounded bg-slate-900 border border-slate-700 font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition ${
                soundEnabled 
                  ? 'bg-slate-800/80 text-cyan-400 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:bg-slate-800'
              }`}
              title={soundEnabled ? 'Suara Peringatan Aktif' : 'Suara Peringatan Nonaktif'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenAlertsDrawer}
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Notifikasi Peringatan"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Scroller */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-[#0a0d13] border-t border-slate-800/60 overflow-x-auto no-scrollbar text-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LineChart },
          { id: 'screener', label: 'Screener', icon: SlidersHorizontal },
          { id: 'annisa-ai', label: 'Annisa AI', icon: Sparkles },
          { id: 'backtest', label: 'Backtest', icon: FlaskConical },
          { id: 'alerts', label: 'Peringatan', icon: ShieldAlert },
          { id: 'education', label: 'Akademi', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
