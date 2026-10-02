import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  CheckCircle, 
  XCircle, 
  Percent, 
  Activity, 
  ArrowUpRight,
  Filter,
  RotateCcw
} from 'lucide-react';
import { StockItem, BacktestConfig, BacktestResult } from '../types/stock';
import { runBacktest } from '../utils/backtestEngine';
import { formatIDR } from '../utils/idxCalculations';

interface BacktestViewProps {
  stocks: StockItem[];
  selectedStock: StockItem;
  onSelectStock: (stock: StockItem) => void;
}

export const BacktestView: React.FC<BacktestViewProps> = ({
  stocks,
  selectedStock,
  onSelectStock
}) => {
  // Backtest Configuration State
  const [timeframeDays, setTimeframeDays] = useState<number>(180);
  const [initialCapital, setInitialCapital] = useState<number>(100000000); // 100 Juta IDR
  const [riskPerTradePct, setRiskPerTradePct] = useState<number>(2.0);
  const [tpPct, setTpPct] = useState<number>(8.0);
  const [slPct, setSlPct] = useState<number>(4.0);
  const [useTrailingStop, setUseTrailingStop] = useState<boolean>(true);
  const [trailingStopPct, setTrailingStopPct] = useState<number>(3.0);

  // Technical Entry Rules
  const [rsiOversold, setRsiOversold] = useState(false);
  const [rsiThreshold, setRsiThreshold] = useState(35);
  const [rsiCrossAbove50, setRsiCrossAbove50] = useState(true);
  const [emaGoldenCross9_20, setEmaGoldenCross9_20] = useState(true);
  const [emaTrend20_50, setEmaTrend20_50] = useState(false);
  const [priceAboveMa200, setPriceAboveMa200] = useState(false);
  const [macdBullishCross, setMacdBullishCross] = useState(true);
  const [volumeBreakout, setVolumeBreakout] = useState(true);
  const [rvolThreshold, setRvolThreshold] = useState(1.4);

  // Fundamental Entry Rules
  const [enablePerFilter, setEnablePerFilter] = useState(true);
  const [perMax, setPerMax] = useState<number>(25);
  const [enableRoeFilter, setEnableRoeFilter] = useState(true);
  const [roeMin, setRoeMin] = useState<number>(12);
  const [enableDerFilter, setEnableDerFilter] = useState(true);
  const [derMax, setDerMax] = useState<number>(1.5);
  const [enableDivFilter, setEnableDivFilter] = useState(false);
  const [divYieldMin, setDivYieldMin] = useState<number>(3.0);

  // Exit Rules
  const [macdDeathCrossExit, setMacdDeathCrossExit] = useState(true);
  const [rsiOverboughtExit, setRsiOverboughtExit] = useState(true);

  // Backtest Results & Trade Filter
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);

  // Run backtest function
  const handleExecuteBacktest = () => {
    setIsSimulating(true);
    setTimeout(() => {
      try {
        const config: BacktestConfig = {
          ticker: selectedStock.ticker,
          timeframeDays,
          initialCapital,
          riskPerTradePct,
          tpPct,
          slPct,
          useTrailingStop,
          trailingStopPct,
          entryRules: {
            rsiOversold,
            rsiThreshold,
            rsiCrossAbove50,
            emaGoldenCross9_20,
            emaTrend20_50,
            priceAboveMa200,
            macdBullishCross,
            volumeBreakout,
            rvolThreshold,
            bandarAccumulation: false,
            perMax: enablePerFilter ? perMax : null,
            roeMin: enableRoeFilter ? roeMin : null,
            derMax: enableDerFilter ? derMax : null,
            divYieldMin: enableDivFilter ? divYieldMin : null,
          },
          exitRules: {
            targetProfitPct: tpPct,
            stopLossPct: slPct,
            macdDeathCross: macdDeathCrossExit,
            rsiOverbought: rsiOverboughtExit,
          },
        };

        const result = runBacktest(selectedStock, config);
        setBacktestResult(result);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsSimulating(false);
      }
    }, 150);
  };

  // Run automatically on first render or when stock changes
  React.useEffect(() => {
    handleExecuteBacktest();
  }, [selectedStock.ticker, timeframeDays]);

  // Filtered trades for table
  const displayedTrades = useMemo(() => {
    if (!backtestResult) return [];
    if (tradeFilter === 'WIN') return backtestResult.trades.filter(t => t.win);
    if (tradeFilter === 'LOSS') return backtestResult.trades.filter(t => !t.win);
    return backtestResult.trades;
  }, [backtestResult, tradeFilter]);

  // Equity Curve SVG plotting
  const curvePoints = useMemo(() => {
    if (!backtestResult || backtestResult.equityCurve.length < 2) return null;
    const curve = backtestResult.equityCurve;
    const equities = curve.map(c => c.equity);
    const minEq = Math.min(...equities, backtestResult.initialCapital) * 0.95;
    const maxEq = Math.max(...equities, backtestResult.initialCapital) * 1.05;
    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 30, bottom: 25, left: 60 };

    const getX = (idx: number) => padding.left + (idx / (curve.length - 1)) * (width - padding.left - padding.right);
    const getY = (val: number) => padding.top + (1 - (val - minEq) / (maxEq - minEq)) * (height - padding.top - padding.bottom);

    let path = '';
    for (let i = 0; i < curve.length; i++) {
      const x = getX(i);
      const y = getY(curve[i].equity);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    return { path, minEq, maxEq, width, height, padding, getX, getY };
  }, [backtestResult]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <FlaskConical className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Studio Backtesting Strategi</h2>
                <p className="text-xs text-slate-400">
                  Uji performa kuantitatif indikator teknikal & filter fundamental terhadap data historis riil IDX.
                </p>
              </div>
            </div>
          </div>

          {/* Stock Selector & Timeframe Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-slate-400">Saham:</span>
              <select
                value={selectedStock.ticker}
                onChange={(e) => {
                  const s = stocks.find(item => item.ticker === e.target.value);
                  if (s) onSelectStock(s);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
              >
                {stocks.map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
              {[
                { days: 90, label: '3 Bulan' },
                { days: 180, label: '6 Bulan' },
                { days: 365, label: '1 Tahun' },
              ].map(tf => (
                <button
                  key={tf.days}
                  onClick={() => setTimeframeDays(tf.days)}
                  className={`px-3 py-1 rounded-lg transition ${
                    timeframeDays === tf.days ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Backtest Setup & Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Strategy Criteria Builder */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs font-mono">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Filter className="w-4 h-4 text-cyan-400" />
              1. Kriteria Entri (Entry Rules)
            </h3>

            {/* Technical Entry Rules */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Kondisi Teknikal (Wajib Terpenuhi):</span>
              
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={emaGoldenCross9_20}
                  onChange={(e) => setEmaGoldenCross9_20(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>EMA 9 Golden Cross ke atas EMA 20 (Momentum Entri)</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={macdBullishCross}
                  onChange={(e) => setMacdBullishCross(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>MACD Bullish Crossover (Line {'>'} Signal)</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={volumeBreakout}
                  onChange={(e) => setVolumeBreakout(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Volume Spike Breakout (RVOL {'>'} {rvolThreshold}x)</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={rsiCrossAbove50}
                  onChange={(e) => setRsiCrossAbove50(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>RSI 14 Memotong ke atas level 50 (Transisi Bullish)</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={rsiOversold}
                  onChange={(e) => setRsiOversold(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>RSI 14 Jenuh Jual / Rebound (RSI {'<'} {rsiThreshold})</span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={emaTrend20_50}
                  onChange={(e) => setEmaTrend20_50(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>EMA 20 {'>'} EMA 50 (Swing Trend Bullish)</span>
              </label>
            </div>

            {/* Fundamental Entry Filters */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Filter Kualitas Fundamental:</span>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePerFilter}
                    onChange={(e) => setEnablePerFilter(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>P/E Ratio (PER) Maksimal:</span>
                </label>
                <span className="font-bold text-emerald-400">{perMax}x</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRoeFilter}
                    onChange={(e) => setEnableRoeFilter(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Return on Equity (ROE) Minimal:</span>
                </label>
                <span className="font-bold text-emerald-400">{roeMin}%</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDerFilter}
                    onChange={(e) => setEnableDerFilter(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Rasio Utang (DER) Maksimal:</span>
                </label>
                <span className="font-bold text-emerald-400">{derMax}x</span>
              </div>
            </div>

            {/* Exit Rules */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                2. Kriteria Keluar (Exit Rules)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Target Profit (TP):</span>
                    <strong className="text-emerald-400">+{tpPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    step="1"
                    value={tpPct}
                    onChange={(e) => setTpPct(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Stop Loss (SL):</span>
                    <strong className="text-rose-400">-{slPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="0.5"
                    value={slPct}
                    onChange={(e) => setSlPct(Number(e.target.value))}
                    className="w-full accent-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTrailingStop}
                    onChange={(e) => setUseTrailingStop(e.target.checked)}
                    className="rounded border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Gunakan Trailing Stop:</span>
                </label>
                <span className="font-bold text-purple-400">{trailingStopPct}% dari puncak</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={macdDeathCrossExit}
                    onChange={(e) => setMacdDeathCrossExit(e.target.checked)}
                    className="rounded border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Keluar jika MACD Death Cross</span>
                </label>
              </div>
            </div>

            {/* Run Backtest Trigger */}
            <div className="pt-2">
              <button
                onClick={handleExecuteBacktest}
                disabled={isSimulating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white font-bold text-xs tracking-wider uppercase hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isSimulating ? 'Menghitung Simulasi...' : 'Jalankan Uji Strategi (Run Backtest)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Performance Metrics & Visual Equity Curve */}
        <div className="lg:col-span-7 space-y-4">
          {backtestResult && (
            <>
              {/* 4 Core Performance Metric Hero Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Return Card */}
                <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
                    <span>Total Return</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className={`text-2xl font-black font-mono tracking-tight ${
                    backtestResult.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {backtestResult.totalReturnPct >= 0 ? '+' : ''}{backtestResult.totalReturnPct}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Buy & Hold: {backtestResult.benchmarkReturnPct}%
                  </span>
                </div>

                {/* Maximum Drawdown Card */}
                <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
                    <span>Max Drawdown</span>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-rose-400">
                    -{backtestResult.maxDrawdownPct}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Risiko Penurunan Puncak
                  </span>
                </div>

                {/* Win Rate Card */}
                <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
                    <span>Win Rate</span>
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-cyan-400">
                    {backtestResult.winRatePct}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {backtestResult.winningTrades} Menang / {backtestResult.losingTrades} Kalah
                  </span>
                </div>

                {/* Profit Factor Card */}
                <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase mb-1">
                    <span>Profit Factor</span>
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-purple-300">
                    {backtestResult.profitFactor}x
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Total {backtestResult.totalTrades} Transaksi
                  </span>
                </div>
              </div>

              {/* Visual Equity Curve Chart */}
              <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Pertumbuhan Modal (Equity Curve vs Modal Awal)
                  </h3>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Strategi Annisa AI
                    </span>
                    <span className="text-white font-bold">
                      Akhir: {formatIDR(backtestResult.finalCapital)}
                    </span>
                  </div>
                </div>

                {curvePoints && (
                  <div className="w-full overflow-hidden select-none">
                    <svg viewBox={`0 0 ${curvePoints.width} ${curvePoints.height}`} className="w-full h-auto">
                      {/* Grid Lines */}
                      {[0, 0.5, 1].map((pct, i) => {
                        const val = curvePoints.minEq + pct * (curvePoints.maxEq - curvePoints.minEq);
                        const y = curvePoints.getY(val);
                        return (
                          <g key={i}>
                            <line
                              x1={curvePoints.padding.left}
                              y1={y}
                              x2={curvePoints.width - curvePoints.padding.right}
                              y2={y}
                              stroke="#1e293b"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={curvePoints.padding.left - 6}
                              y={y + 3}
                              fill="#64748b"
                              fontSize="9"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              {(val / 1000000).toFixed(0)}M
                            </text>
                          </g>
                        );
                      })}

                      {/* Initial Capital Reference Line */}
                      <line
                        x1={curvePoints.padding.left}
                        y1={curvePoints.getY(backtestResult.initialCapital)}
                        x2={curvePoints.width - curvePoints.padding.right}
                        y2={curvePoints.getY(backtestResult.initialCapital)}
                        stroke="#475569"
                        strokeDasharray="3 3"
                      />

                      {/* Main Equity Curve */}
                      <path
                        d={curvePoints.path}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Trade Log History Table */}
              <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Riwayat Transaksi Historis ({backtestResult.trades.length})
                  </h3>

                  {/* Filter Trades */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setTradeFilter('ALL')}
                      className={`px-2.5 py-1 rounded transition ${tradeFilter === 'ALL' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400'}`}
                    >
                      Semua ({backtestResult.trades.length})
                    </button>
                    <button
                      onClick={() => setTradeFilter('WIN')}
                      className={`px-2.5 py-1 rounded transition ${tradeFilter === 'WIN' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'}`}
                    >
                      Menang ({backtestResult.winningTrades})
                    </button>
                    <button
                      onClick={() => setTradeFilter('LOSS')}
                      className={`px-2.5 py-1 rounded transition ${tradeFilter === 'LOSS' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'}`}
                    >
                      Kalah ({backtestResult.losingTrades})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                        <th className="py-2">Tgl Beli</th>
                        <th className="py-2">Tgl Jual</th>
                        <th className="py-2 text-right">Beli</th>
                        <th className="py-2 text-right">Jual</th>
                        <th className="py-2 text-right">Hasil (PnL)</th>
                        <th className="py-2 text-center">Holding</th>
                        <th className="py-2 text-center">Alasan Keluar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {displayedTrades.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Tidak ada transaksi untuk filter ini.
                          </td>
                        </tr>
                      ) : (
                        displayedTrades.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition">
                            <td className="py-2 text-slate-300">{t.entryDate}</td>
                            <td className="py-2 text-slate-300">{t.exitDate}</td>
                            <td className="py-2 text-right text-slate-200">Rp {t.entryPrice.toLocaleString('id-ID')}</td>
                            <td className="py-2 text-right text-slate-200">Rp {t.exitPrice.toLocaleString('id-ID')}</td>
                            <td className={`py-2 text-right font-bold ${t.win ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.win ? '+' : ''}{t.pnlPct}% ({formatIDR(t.pnlAmount)})
                            </td>
                            <td className="py-2 text-center text-slate-400">{t.holdingDays} hari</td>
                            <td className="py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.reason === 'TAKE_PROFIT' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                  : (t.reason === 'STOP_LOSS' 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/30')
                              }`}>
                                {t.reason}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
