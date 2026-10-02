import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  FlaskConical, 
  ShieldAlert, 
  Star, 
  Layers, 
  ArrowUpRight,
  Target,
  AlertTriangle
} from 'lucide-react';
import { StockItem } from '../types/stock';
import { InteractiveChart } from './InteractiveChart';
import { OrderBook } from './OrderBook';
import { BandarmologiSection } from './BandarmologiSection';
import { SectorAnalysisSection } from './SectorAnalysisSection';
import { AiPricePredictionBadge } from './AiPricePredictionBadge';
import { ActiveTab } from './Header';

interface DashboardViewProps {
  stock: StockItem;
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
  isWatchlist: boolean;
  onToggleWatchlist: (ticker: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stock,
  stocks,
  onSelectStock,
  setActiveTab,
  isWatchlist,
  onToggleWatchlist
}) => {
  const [subSection, setSubSection] = React.useState<'BANDAR' | 'SEKTOR' | 'BOTH'>('BOTH');
  const isPositive = stock.changePct >= 0;

  // Verdict style mapping
  const getVerdictStyle = (verdict: StockItem['verdict']) => {
    switch (verdict) {
      case 'STRONG BUY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20';
      case 'BUY ON BREAKOUT':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/20';
      case 'BUY AREA':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-teal-500/20';
      case 'WAIT / PULLBACK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20';
      case 'TAKE PROFIT':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/20';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Selected Stock Meta & Live Stats */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Ticker & Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-white text-lg shadow-inner">
              {stock.ticker}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white font-mono tracking-tight">{stock.ticker}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
                  {stock.sector}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono">
                  {stock.subSector}
                </span>
                <button
                  onClick={() => onToggleWatchlist(stock.ticker)}
                  className={`p-1.5 rounded-lg border transition ${
                    isWatchlist 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title={isWatchlist ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
                >
                  <Star className={`w-4 h-4 ${isWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{stock.name}</p>
            </div>
          </div>

          {/* Current Price, AI Projection & Day Change */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Harga Terakhir</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  Rp {stock.price.toLocaleString('id-ID')}
                </span>
                <span className={`text-sm font-bold font-mono flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-0.5" /> : <TrendingDown className="w-4 h-4 mr-0.5" />}
                  {isPositive ? '+' : ''}{stock.change} ({isPositive ? '+' : ''}{stock.changePct}%)
                </span>
              </div>
            </div>

            {/* AI-Driven Short-Term Price Prediction Badge */}
            <AiPricePredictionBadge stock={stock} variant="compact" />

            {/* Quick Action Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('annisa-ai')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-teal-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-teal-500/30 border border-cyan-500/40 text-xs font-semibold shadow-lg shadow-cyan-500/10 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analisa AI</span>
              </button>
              <button
                onClick={() => setActiveTab('backtest')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>Backtest</span>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Peringatan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Quick Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-4 mt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Rentang Hari Ini</span>
            <span className="font-semibold text-slate-200">
              {stock.low.toLocaleString('id-ID')} - {stock.high.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Volume Transaksi</span>
            <span className="font-semibold text-slate-200">
              {(stock.volume / 1000000).toFixed(1)} Juta Lembar
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Nilai Transaksi</span>
            <span className="font-semibold text-cyan-300">
              Rp {stock.value.toFixed(1)} Miliar
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Kapitalisasi Pasar</span>
            <span className="font-semibold text-slate-200">
              Rp {stock.fundamentals.marketCap.toFixed(1)} Triliun
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Valuasi (PER / PBV)</span>
            <span className="font-semibold text-slate-200">
              {stock.fundamentals.per.toFixed(1)}x / {stock.fundamentals.pbv.toFixed(1)}x
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Dividen Yield</span>
            <span className="font-semibold text-emerald-400">
              {stock.fundamentals.dividendYield > 0 ? `${stock.fundamentals.dividendYield}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart (Left) + Right Intelligence Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Interactive Candlestick Chart */}
        <div className="lg:col-span-8 space-y-4">
          <InteractiveChart
            ticker={stock.ticker}
            history={stock.history}
            technicals={stock.technicals}
          />

          {/* Quick Technical S/R Pivot Ribbon */}
          <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Level Kunci Pivot, Support & Resistance (Fraksi BEI)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">ATR(14): Rp {stock.technicals.atr14}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span className="text-[10px] text-rose-400/80 block uppercase">Resistance 2 (R2)</span>
                <span className="text-sm font-bold">Rp {stock.technicals.resistance2.toLocaleString('id-ID')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span className="text-[10px] text-rose-400/80 block uppercase">Resistance 1 (R1)</span>
                <span className="text-sm font-bold">Rp {stock.technicals.resistance1.toLocaleString('id-ID')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span className="text-[10px] text-emerald-400/80 block uppercase">Support 1 (S1)</span>
                <span className="text-sm font-bold">Rp {stock.technicals.support1.toLocaleString('id-ID')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span className="text-[10px] text-emerald-400/80 block uppercase">Support 2 (S2)</span>
                <span className="text-sm font-bold">Rp {stock.technicals.support2.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Annisa AI Score & Order Book */}
        <div className="lg:col-span-4 space-y-4">
          {/* Annisa AI Quick Verdict Card */}
          <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Annisa AI Score</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Real-time Model</span>
            </div>

            {/* Score & Verdict Row */}
            <div className="flex items-center justify-between my-3 relative z-10">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black font-mono text-cyan-400 tracking-tight">
                  {stock.aiScore}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>

              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wide shadow-md ${getVerdictStyle(stock.verdict)}`}>
                {stock.verdict}
              </div>
            </div>

            {/* Sub-Score Progress Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Teknikal & Momentum</span>
                  <span className="text-slate-200 font-bold">{stock.aiScore >= 70 ? 'Bullish Strong' : 'Neutral'}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, stock.aiScore * 0.95)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Fundamental (ROE & DER)</span>
                  <span className="text-slate-200 font-bold">ROE {stock.fundamentals.roe}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, stock.fundamentals.roe * 4)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Bandarmologi Flow</span>
                  <span className="text-slate-200 font-bold">{stock.bandar.status}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${stock.bandar.score}%` }} />
                </div>
              </div>
            </div>

            {/* AI Momentum Price Projection Card */}
            <div className="mt-3.5">
              <AiPricePredictionBadge stock={stock} variant="detailed" />
            </div>

            {/* Actionable Trading Plan Snapshot */}
            <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-900/50 p-3 rounded-xl border text-xs font-mono space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Rencana Trading Otomatis (IDX Ticks)</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Area Beli (Entry):</span>
                <span className="text-slate-200 font-bold">Rp {stock.tradingPlan.entryMin} - {stock.tradingPlan.entryMax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Target Profit 1 (TP1):</span>
                <span className="text-emerald-300 font-bold">Rp {stock.tradingPlan.tp1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Stop Loss (Ketat):</span>
                <span className="text-rose-300 font-bold">Rp {stock.tradingPlan.stopLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk : Reward:</span>
                <span className="text-cyan-300 font-bold">1 : {stock.tradingPlan.riskRewardRatio}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('annisa-ai')}
              className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buka Bedah Analisa AI Lengkap</span>
            </button>
          </div>

          {/* Real-time Order Book */}
          <OrderBook stock={stock} />
        </div>
      </div>

      {/* Advanced Market Intelligence Switcher */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-mono">
          <button
            onClick={() => setSubSection('BANDAR')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              subSection === 'BANDAR' 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🐋 Aliran Dana & Bandarmologi
          </button>

          <button
            onClick={() => setSubSection('SEKTOR')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              subSection === 'SEKTOR' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Analisa Sektoral vs IHSG
          </button>

          <button
            onClick={() => setSubSection('BOTH')}
            className={`px-3 py-1.5 rounded-lg transition font-medium ${
              subSection === 'BOTH' 
                ? 'bg-slate-800 text-white font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📑 Tampilkan Keduanya
          </button>
        </div>
      </div>

      {/* Analisa Bandarmologi Section */}
      {(subSection === 'BANDAR' || subSection === 'BOTH') && (
        <BandarmologiSection stock={stock} />
      )}

      {/* Analisa Sektoral & Komparasi IHSG Section */}
      {(subSection === 'SEKTOR' || subSection === 'BOTH') && (
        <SectorAnalysisSection
          stocks={stocks}
          currentStock={stock}
          onSelectStock={onSelectStock}
        />
      )}
    </div>
  );
};
