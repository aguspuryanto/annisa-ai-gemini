import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_STOCKS } from './data/idxStocks';
import { StockItem, StockAlert, AlertTriggerEvent } from './types/stock';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ScreenerView } from './components/ScreenerView';
import { AnnisaAiView } from './components/AnnisaAiView';
import { BacktestView } from './components/BacktestView';
import { AlertsView } from './components/AlertsView';
import { EducationView } from './components/EducationView';
import { StockSearchModal } from './components/StockSearchModal';
import { AlertNotificationDrawer } from './components/AlertNotificationDrawer';
import { KillerRecipe } from './utils/educationContent';
import { roundToIdxTick, getIdxTickSize } from './utils/idxCalculations';
import { Bell, Sparkles, X, ArrowRight } from 'lucide-react';

export default function App() {
  const [stocks, setStocks] = useState<StockItem[]>(INITIAL_STOCKS);
  const [selectedStock, setSelectedStock] = useState<StockItem>(INITIAL_STOCKS[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Watchlist (persisted in localStorage)
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('annisa_ai_watchlist');
      return saved ? JSON.parse(saved) : ['BBCA', 'BBRI', 'BREN', 'ADRO'];
    } catch {
      return ['BBCA', 'BBRI', 'BREN', 'ADRO'];
    }
  });

  const handleToggleWatchlist = (ticker: string) => {
    setWatchlist(prev => {
      const updated = prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker];
      try {
        localStorage.setItem('annisa_ai_watchlist', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Pre-configured Custom Alerts
  const [alerts, setAlerts] = useState<StockAlert[]>([
    {
      id: 'ALT-1',
      createdAt: '2026-10-02 09:15',
      ticker: 'BBCA',
      name: 'Bank Central Asia Tbk.',
      active: true,
      conditionDescription: 'RSI < 45 DAN DER < 1.0',
      technicalCondition: { indicator: 'RSI', comparator: '<', thresholdValue: 45 },
      fundamentalCondition: { metric: 'DER', comparator: '<', thresholdValue: 1.0 },
      notificationType: 'BOTH',
      emailRecipient: 'trader.idx@gmail.com',
      triggerCount: 1
    },
    {
      id: 'ALT-2',
      createdAt: '2026-10-02 10:30',
      ticker: 'BREN',
      name: 'Barito Renewables Energy Tbk.',
      active: true,
      conditionDescription: 'VOLUME > 1.8x DAN MACD Golden Cross',
      technicalCondition: { indicator: 'VOLUME', comparator: '>', thresholdValue: 1.8 },
      notificationType: 'IN_APP',
      triggerCount: 2
    },
    {
      id: 'ALT-3',
      createdAt: '2026-10-02 11:00',
      ticker: 'ADRO',
      name: 'Adaro Energy Indonesia Tbk.',
      active: true,
      conditionDescription: 'PER < 8.0 DAN ROE > 15.0%',
      fundamentalCondition: { metric: 'PER', comparator: '<', thresholdValue: 8.0 },
      notificationType: 'BOTH',
      emailRecipient: 'investor.val@gmail.com',
      triggerCount: 1
    }
  ]);

  // Triggered Alerts Log
  const [triggerEvents, setTriggerEvents] = useState<AlertTriggerEvent[]>([
    {
      id: 'EVT-1',
      alertId: 'ALT-2',
      ticker: 'BREN',
      timestamp: '11:42 WIB',
      triggerPrice: 6950,
      message: 'Volume melonjak 2.1x rata-rata 20 hari! Terkonfirmasi akumulasi broker institusi.',
      read: false
    },
    {
      id: 'EVT-2',
      alertId: 'ALT-1',
      ticker: 'BBCA',
      timestamp: '09:20 WIB',
      triggerPrice: 9825,
      message: 'Harga memasuki area Support 1 (Rp 9.800 - 9.850). RSI 14 di zona pantulan teknikal.',
      read: true
    }
  ]);

  // Active Toast Alert
  const [activeToast, setActiveToast] = useState<AlertTriggerEvent | null>(null);

  // Web Audio Synthesizer for Clean Notification Ping
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Alert Management Handlers
  const handleAddAlert = (alertData: Omit<StockAlert, 'id' | 'createdAt' | 'triggerCount'>) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
    const newAlert: StockAlert = {
      id: `ALT-${Date.now()}`,
      createdAt: timeStr,
      triggerCount: 0,
      ...alertData
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Trigger test alert simulation
  const handleTriggerTestAlert = () => {
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`;

    const newEvt: AlertTriggerEvent = {
      id: `EVT-${Date.now()}`,
      alertId: 'TEST',
      ticker: randomStock.ticker,
      timestamp: timeStr,
      triggerPrice: randomStock.price,
      message: `Sinyal Terpicu: ${randomStock.ticker} terdeteksi memenuhi filter teknikal & fundamental (${randomStock.verdict})!`,
      read: false
    };

    setTriggerEvents(prev => [newEvt, ...prev]);
    setActiveToast(newEvt);
    playAlertSound();

    setTimeout(() => {
      setActiveToast(prev => (prev?.id === newEvt.id ? null : prev));
    }, 6000);
  };

  // Live simulation: periodic subtle tick updates for real-time vibe
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => {
        // Pick 1-2 random stocks to adjust by 1 tick
        const randomIndex = Math.floor(Math.random() * prevStocks.length);
        const stock = prevStocks[randomIndex];
        const tick = getIdxTickSize(stock.price);
        const changeDir = Math.random() > 0.48 ? 1 : -1;
        const newPrice = Math.min(stock.araPrice, Math.max(stock.arbPrice, stock.price + (changeDir * tick)));

        if (newPrice === stock.price) return prevStocks;

        const updated = [...prevStocks];
        const change = newPrice - stock.prevClose;
        const changePct = Number(((change / stock.prevClose) * 100).toFixed(2));

        updated[randomIndex] = {
          ...stock,
          price: newPrice,
          change,
          changePct,
          volume: stock.volume + Math.floor(1000 + Math.random() * 5000),
        };

        // Update selected stock if it matches
        if (selectedStock.ticker === stock.ticker) {
          setSelectedStock(updated[randomIndex]);
        }

        return updated;
      });
    }, 3800);

    return () => clearInterval(interval);
  }, [selectedStock.ticker]);

  // Apply recipe from Education directly to Screener
  const handleApplyPresetToScreener = (recipe: KillerRecipe) => {
    setActiveTab('screener');
  };

  const unreadAlertsCount = triggerEvents.filter(e => !e.read).length;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAlertsDrawer={() => setIsAlertsDrawerOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        stocks={stocks}
        selectedStock={selectedStock}
        onSelectStock={(s) => {
          setSelectedStock(s);
          setActiveTab('dashboard');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'dashboard' && (
          <DashboardView
            stock={selectedStock}
            stocks={stocks}
            onSelectStock={setSelectedStock}
            setActiveTab={setActiveTab}
            isWatchlist={watchlist.includes(selectedStock.ticker)}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'screener' && (
          <ScreenerView
            stocks={stocks}
            onSelectStock={setSelectedStock}
            setActiveTab={setActiveTab}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'annisa-ai' && (
          <AnnisaAiView
            stocks={stocks}
            selectedStock={selectedStock}
            onSelectStock={setSelectedStock}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestView
            stocks={stocks}
            selectedStock={selectedStock}
            onSelectStock={setSelectedStock}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            stocks={stocks}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
            triggerEvents={triggerEvents}
            onTriggerTestAlert={handleTriggerTestAlert}
            onSelectStock={(s) => {
              setSelectedStock(s);
              setActiveTab('dashboard');
            }}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'education' && (
          <EducationView
            setActiveTab={setActiveTab}
            onApplyPresetToScreener={handleApplyPresetToScreener}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#080b10] border-t border-slate-800/80 py-6 px-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Annisa AI</span>
            <span>•</span>
            <span>Analisa Teknikal Saham AI & Screener Kuantitatif</span>
            <span>•</span>
            <span className="text-cyan-400/80">Bursa Efek Indonesia (IDX)</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Trade dengan Rencana, Bukan Ekspektasi • Fraksi Harga BEI Terintegrasi
          </div>
        </div>
      </footer>

      {/* Floating In-App Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#121826] border border-cyan-500/50 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white font-mono text-sm">{activeToast.ticker}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    Peringatan Dini
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{activeToast.timestamp}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-sans mt-2.5 leading-relaxed">{activeToast.message}</p>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-300">
              Rp {activeToast.triggerPrice.toLocaleString('id-ID')}
            </span>
            <button
              onClick={() => {
                const s = stocks.find(item => item.ticker === activeToast.ticker);
                if (s) {
                  setSelectedStock(s);
                  setActiveTab('dashboard');
                }
                setActiveToast(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1"
            >
              <span>Lihat Saham</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <StockSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        stocks={stocks}
        onSelectStock={(s) => {
          setSelectedStock(s);
          setActiveTab('dashboard');
        }}
      />

      {/* Notifications Drawer */}
      <AlertNotificationDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        events={triggerEvents}
        onMarkAllAsRead={() => setTriggerEvents(prev => prev.map(e => ({ ...e, read: true })))}
        onClearEvents={() => setTriggerEvents([])}
        stocks={stocks}
        onSelectStock={(s) => {
          setSelectedStock(s);
          setActiveTab('dashboard');
        }}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
