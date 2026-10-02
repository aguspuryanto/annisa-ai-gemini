import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Download, 
  Sparkles, 
  Star, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  RotateCcw, 
  ShieldCheck, 
  FlaskConical, 
  ShieldAlert,
  LineChart
} from 'lucide-react';
import { StockItem, Sector, SignalVerdict } from '../types/stock';
import { ActiveTab } from './Header';

interface ScreenerViewProps {
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
  activePresetFilter?: any;
}

export type PresetType = 
  | 'ALL'
  | 'WATCHLIST'
  | 'MOMENTUM_BREAKOUT'
  | 'SWING_BULLISH'
  | 'BANDAR_ACCUMULATION'
  | 'UNDERVALUED_GEMS'
  | 'DIVIDEND_ARISTOCRATS'
  | 'ARA_HUNTER'
  | 'PULLBACK_AREA';

export const ScreenerView: React.FC<ScreenerViewProps> = ({
  stocks,
  onSelectStock,
  setActiveTab,
  watchlist,
  onToggleWatchlist,
  activePresetFilter
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Filter States
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [rsiMin, setRsiMin] = useState<number>(0);
  const [rsiMax, setRsiMax] = useState<number>(100);
  const [rvolMin, setRvolMin] = useState<number>(0);
  const [macdFilter, setMacdFilter] = useState<'ALL' | 'GOLDEN_CROSS' | 'BULLISH'>('ALL');
  const [emaTrendFilter, setEmaTrendFilter] = useState<'ALL' | 'EMA9_20' | 'EMA20_50' | 'ABOVE_EMA200'>('ALL');
  const [perMax, setPerMax] = useState<number>(100);
  const [pbvMax, setPbvMax] = useState<number>(50);
  const [roeMin, setRoeMin] = useState<number>(0);
  const [derMax, setDerMax] = useState<number>(10);
  const [divYieldMin, setDivYieldMin] = useState<number>(0);
  const [marketCapTier, setMarketCapTier] = useState<'ALL' | 'BIG_CAP' | 'MID_CAP' | 'SMALL_CAP'>('ALL');
  const [bandarStatusFilter, setBandarStatusFilter] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof StockItem | 'aiScore' | 'per' | 'roe' | 'rvol'>('aiScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedPreset('ALL');
    setSelectedSector('ALL');
    setRsiMin(0);
    setRsiMax(100);
    setRvolMin(0);
    setMacdFilter('ALL');
    setEmaTrendFilter('ALL');
    setPerMax(100);
    setPbvMax(50);
    setRoeMin(0);
    setDerMax(10);
    setDivYieldMin(0);
    setMarketCapTier('ALL');
    setBandarStatusFilter('ALL');
    setSearchQuery('');
  };

  // Preset Handlers
  const handleSelectPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    // Auto-adjust filters based on preset
    if (preset === 'MOMENTUM_BREAKOUT') {
      setRsiMin(50);
      setRsiMax(70);
      setRvolMin(1.4);
      setRoeMin(10);
      setDerMax(1.5);
    } else if (preset === 'SWING_BULLISH') {
      setEmaTrendFilter('EMA20_50');
      setRsiMin(45);
      setRvolMin(1.0);
    } else if (preset === 'BANDAR_ACCUMULATION') {
      setBandarStatusFilter('Big Accumulation');
      setRvolMin(1.1);
    } else if (preset === 'UNDERVALUED_GEMS') {
      setPerMax(12);
      setPbvMax(1.5);
      setRoeMin(12);
      setDivYieldMin(3);
    } else if (preset === 'DIVIDEND_ARISTOCRATS') {
      setDivYieldMin(5.0);
      setDerMax(1.2);
    } else if (preset === 'ARA_HUNTER') {
      setRvolMin(2.2);
      setRsiMin(60);
    } else if (preset === 'PULLBACK_AREA') {
      setRsiMin(20);
      setRsiMax(45);
    } else if (preset === 'ALL') {
      handleResetFilters();
    }
  };

  // Filtered & Sorted Stock List
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      // Watchlist tab filter
      if (selectedPreset === 'WATCHLIST' && !watchlist.includes(stock.ticker)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTicker = stock.ticker.toLowerCase().includes(q);
        const matchName = stock.name.toLowerCase().includes(q);
        const matchSector = stock.sector.toLowerCase().includes(q);
        if (!matchTicker && !matchName && !matchSector) return false;
      }

      // Sector
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) {
        return false;
      }

      // Technicals: RSI
      if (stock.technicals.rsi14 < rsiMin || stock.technicals.rsi14 > rsiMax) {
        return false;
      }

      // Technicals: RVOL
      if (stock.technicals.rvol < rvolMin) {
        return false;
      }

      // Technicals: MACD
      if (macdFilter === 'GOLDEN_CROSS' && stock.technicals.macdTrend !== 'Golden Cross') {
        return false;
      }
      if (macdFilter === 'BULLISH' && stock.technicals.macdHistogram <= 0) {
        return false;
      }

      // Technicals: EMA Trend
      if (emaTrendFilter === 'EMA9_20' && !(stock.technicals.ema9 > stock.technicals.ema20)) {
        return false;
      }
      if (emaTrendFilter === 'EMA20_50' && !(stock.technicals.ema20 > stock.technicals.ema50)) {
        return false;
      }
      if (emaTrendFilter === 'ABOVE_EMA200' && !(stock.price > stock.technicals.ema200)) {
        return false;
      }

      // Fundamentals: PER
      if (perMax < 100 && (stock.fundamentals.per <= 0 || stock.fundamentals.per > perMax)) {
        return false;
      }

      // Fundamentals: PBV
      if (pbvMax < 50 && (stock.fundamentals.pbv <= 0 || stock.fundamentals.pbv > pbvMax)) {
        return false;
      }

      // Fundamentals: ROE
      if (stock.fundamentals.roe < roeMin) {
        return false;
      }

      // Fundamentals: DER
      if (derMax < 10 && stock.fundamentals.der > derMax) {
        return false;
      }

      // Fundamentals: Dividend Yield
      if (stock.fundamentals.dividendYield < divYieldMin) {
        return false;
      }

      // Fundamentals: Market Cap Tier
      if (marketCapTier === 'BIG_CAP' && stock.fundamentals.marketCap < 50) return false;
      if (marketCapTier === 'MID_CAP' && (stock.fundamentals.marketCap < 10 || stock.fundamentals.marketCap >= 50)) return false;
      if (marketCapTier === 'SMALL_CAP' && stock.fundamentals.marketCap >= 10) return false;

      // Bandarmologi Status
      if (bandarStatusFilter !== 'ALL' && stock.bandar.status !== bandarStatusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortField === 'aiScore') {
        valA = a.aiScore;
        valB = b.aiScore;
      } else if (sortField === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (sortField === 'changePct') {
        valA = a.changePct;
        valB = b.changePct;
      } else if (sortField === 'per') {
        valA = a.fundamentals.per;
        valB = b.fundamentals.per;
      } else if (sortField === 'roe') {
        valA = a.fundamentals.roe;
        valB = b.fundamentals.roe;
      } else if (sortField === 'rvol') {
        valA = a.technicals.rvol;
        valB = b.technicals.rvol;
      } else if (sortField === 'value') {
        valA = a.value;
        valB = b.value;
      }

      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });
  }, [
    stocks,
    selectedPreset,
    watchlist,
    searchQuery,
    selectedSector,
    rsiMin,
    rsiMax,
    rvolMin,
    macdFilter,
    emaTrendFilter,
    perMax,
    pbvMax,
    roeMin,
    derMax,
    divYieldMin,
    marketCapTier,
    bandarStatusFilter,
    sortField,
    sortDirection
  ]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Kode', 'Nama', 'Sektor', 'Harga', 'Perubahan %', 'Volume', 'Nilai (M)', 'PER', 'PBV', 'ROE %', 'DER', 'Div Yield %', 'RSI 14', 'RVOL', 'Bandarmologi', 'Annisa Score', 'Verdict'];
    const rows = filteredStocks.map(s => [
      s.ticker,
      `"${s.name}"`,
      `"${s.sector}"`,
      s.price,
      s.changePct,
      s.volume,
      s.value,
      s.fundamentals.per,
      s.fundamentals.pbv,
      s.fundamentals.roe,
      s.fundamentals.der,
      s.fundamentals.dividendYield,
      s.technicals.rsi14,
      s.technicals.rvol,
      `"${s.bandar.status}"`,
      s.aiScore,
      `"${s.verdict}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Annisa_AI_Screener_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Verdict style mapping
  const getVerdictBadge = (verdict: SignalVerdict) => {
    switch (verdict) {
      case 'STRONG BUY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'BUY ON BREAKOUT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'BUY AREA':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'WAIT / PULLBACK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'TAKE PROFIT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Screener Header & Presets Bar */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              Screener Saham Annisa AI
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter multi-dimensi teknikal, fundamental, dan bandarmologi Bursa Efek Indonesia secara real-time.
            </p>
          </div>

          {/* Search & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kode atau emiten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
              />
            </div>

            <button
              onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                showFiltersDrawer 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Detail</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
              title="Unduh Data Hasil Screener (CSV)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Preset Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
          {[
            { id: 'ALL', label: '🔥 Semua Saham' },
            { id: 'MOMENTUM_BREAKOUT', label: '🚀 Momentum Breakout' },
            { id: 'SWING_BULLISH', label: '🌊 Swing Bullish' },
            { id: 'BANDAR_ACCUMULATION', label: '🐋 Bandar Akumulasi' },
            { id: 'UNDERVALUED_GEMS', label: '💎 Undervalued Gems' },
            { id: 'DIVIDEND_ARISTOCRATS', label: '💰 Dividen Jumbo' },
            { id: 'ARA_HUNTER', label: '⚡ ARA Hunter' },
            { id: 'PULLBACK_AREA', label: '🛡️ Area Pullback' },
            { id: 'WATCHLIST', label: `⭐ Watchlist (${watchlist.length})` },
          ].map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id as PresetType)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap border font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Granular Filter Drawer */}
        {showFiltersDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-slate-950/60 p-4 rounded-xl border animate-in fade-in duration-200">
            {/* Technical: RSI */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Rentang RSI (14): {rsiMin} - {rsiMax}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rsiMin}
                  onChange={(e) => setRsiMin(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rsiMax}
                  onChange={(e) => setRsiMax(Number(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Technical: RVOL */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Min RVOL: {rvolMin}x</label>
              <input
                type="range"
                min="0"
                max="4"
                step="0.1"
                value={rvolMin}
                onChange={(e) => setRvolMin(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Technical: MACD */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Status MACD</label>
              <select
                value={macdFilter}
                onChange={(e) => setMacdFilter(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Kondisi MACD</option>
                <option value="GOLDEN_CROSS">Golden Cross Baru</option>
                <option value="BULLISH">Histogram Positif (Bullish)</option>
              </select>
            </div>

            {/* Technical: EMA Trend */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Struktur EMA</label>
              <select
                value={emaTrendFilter}
                onChange={(e) => setEmaTrendFilter(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Pola EMA</option>
                <option value="EMA9_20">EMA 9 {'>'} EMA 20 (Momentum Cepat)</option>
                <option value="EMA20_50">EMA 20 {'>'} EMA 50 (Swing Bullish)</option>
                <option value="ABOVE_EMA200">Harga {'>'} EMA 200 (Major Trend)</option>
              </select>
            </div>

            {/* Fundamental: PER */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Max P/E Ratio (PER): {perMax === 100 ? 'Tak Terbatas' : `${perMax}x`}</label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={perMax}
                onChange={(e) => setPerMax(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Fundamental: ROE */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Min ROE: {roeMin}%</label>
              <input
                type="range"
                min="0"
                max="30"
                step="2"
                value={roeMin}
                onChange={(e) => setRoeMin(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Fundamental: DER */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Max Utang (DER): {derMax === 10 ? 'Semua' : `${derMax}x`}</label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={derMax}
                onChange={(e) => setDerMax(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Fundamental: Dividend */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Min Dividen Yield: {divYieldMin}%</label>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={divYieldMin}
                onChange={(e) => setDivYieldMin(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            {/* Sektor & Bandarmologi */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Sektor Saham</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Sektor</option>
                <option value="Financials">Financials (Perbankan)</option>
                <option value="Energy">Energy (Batu Bara / Migas)</option>
                <option value="Basic Materials">Basic Materials (Tambang/Kertas)</option>
                <option value="Infrastructures">Infrastructures (Telco/Tol/Listrik)</option>
                <option value="Consumer Non-Cyclicals">Consumer Non-Cyclicals</option>
                <option value="Consumer Cyclicals">Consumer Cyclicals</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 block font-semibold">Status Bandarmologi</label>
              <select
                value={bandarStatusFilter}
                onChange={(e) => setBandarStatusFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none"
              >
                <option value="ALL">Semua Aliran Bandar</option>
                <option value="Big Accumulation">Big Accumulation</option>
                <option value="Normal Accumulation">Normal Accumulation</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="sm:col-span-2 md:col-span-2 flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter ke Standar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Meta Info */}
      <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
        <span>Menampilkan <strong className="text-white">{filteredStocks.length}</strong> emiten terseleksi</span>
        <span>Urut Berdasarkan: <strong className="text-cyan-300 uppercase">{sortField}</strong> ({sortDirection})</span>
      </div>

      {/* Main Stock Table */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3 px-3 w-10 text-center">⭐</th>
                <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">Saham <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end gap-1">Harga <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('changePct')}>
                  <div className="flex items-center justify-end gap-1">1D % <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('rvol')}>
                  <div className="flex items-center justify-end gap-1">RVOL <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-center">RSI (14)</th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('per')}>
                  <div className="flex items-center justify-end gap-1">PER <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('roe')}>
                  <div className="flex items-center justify-end gap-1">ROE <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-3 text-center">Bandarmologi</th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('aiScore')}>
                  <div className="flex items-center justify-center gap-1">Annisa Score <ArrowUpDown className="w-3 h-3 text-cyan-400" /></div>
                </th>
                <th className="py-3 px-3 text-center">Verdict</th>
                <th className="py-3 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-sans">Tidak ada saham yang sesuai dengan kriteria filter saat ini.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold"
                    >
                      Reset Filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((s) => {
                  const isPositive = s.changePct >= 0;
                  const isSaved = watchlist.includes(s.ticker);

                  return (
                    <tr key={s.ticker} className="hover:bg-slate-800/40 transition group">
                      {/* Watchlist Star */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleWatchlist(s.ticker)}
                          className={`p-1 rounded hover:bg-slate-700 transition ${
                            isSaved ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                      </td>

                      {/* Ticker & Name */}
                      <td className="py-3 px-3">
                        <div 
                          onClick={() => {
                            onSelectStock(s);
                            setActiveTab('dashboard');
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-cyan-400 transition font-mono tracking-wide">
                              {s.ticker}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 truncate max-w-[90px]">
                              {s.sector.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans truncate max-w-[170px] mt-0.5">{s.name}</p>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        Rp {s.price.toLocaleString('id-ID')}
                      </td>

                      {/* 1D Change % */}
                      <td className={`py-3 px-3 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{s.changePct}%
                      </td>

                      {/* RVOL */}
                      <td className="py-3 px-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                          s.technicals.rvol >= 1.5 
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' 
                            : 'text-slate-400'
                        }`}>
                          {s.technicals.rvol.toFixed(1)}x
                        </span>
                      </td>

                      {/* RSI */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-semibold ${
                          s.technicals.rsi14 >= 50 && s.technicals.rsi14 <= 70 
                            ? 'text-cyan-400 font-bold' 
                            : (s.technicals.rsi14 < 35 ? 'text-emerald-400' : 'text-slate-300')
                        }`}>
                          {s.technicals.rsi14}
                        </span>
                      </td>

                      {/* PER */}
                      <td className="py-3 px-3 text-right text-slate-300">
                        {s.fundamentals.per.toFixed(1)}x
                      </td>

                      {/* ROE */}
                      <td className={`py-3 px-3 text-right font-semibold ${
                        s.fundamentals.roe >= 15 ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {s.fundamentals.roe.toFixed(1)}%
                      </td>

                      {/* Bandarmologi */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.bandar.status === 'Big Accumulation'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : (s.bandar.status === 'Normal Accumulation'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700')
                        }`}>
                          {s.bandar.status.split(' ')[0]}
                        </span>
                      </td>

                      {/* Annisa AI Score */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-sm font-black font-mono ${
                            s.aiScore >= 80 ? 'text-cyan-400' : (s.aiScore >= 65 ? 'text-emerald-400' : 'text-slate-400')
                          }`}>
                            {s.aiScore}
                          </span>
                          <span className="text-[10px] text-slate-500">/100</span>
                        </div>
                      </td>

                      {/* Verdict */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider uppercase ${getVerdictBadge(s.verdict)}`}>
                          {s.verdict}
                        </span>
                      </td>

                      {/* Fast Action Buttons */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              onSelectStock(s);
                              setActiveTab('dashboard');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition"
                            title="Buka Chart Interaktif"
                          >
                            <LineChart className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectStock(s);
                              setActiveTab('annisa-ai');
                            }}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition"
                            title="Analisa Lengkap Annisa AI"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectStock(s);
                              setActiveTab('backtest');
                            }}
                            className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition"
                            title="Backtest Strategi Saham Ini"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
