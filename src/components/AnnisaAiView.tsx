import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Target, 
  Layers, 
  RefreshCw,
  Coins,
  ShieldAlert,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { StockItem } from '../types/stock';
import { calculatePositionSizing, formatIDR } from '../utils/idxCalculations';

interface AnnisaAiViewProps {
  stocks: StockItem[];
  selectedStock: StockItem;
  onSelectStock: (stock: StockItem) => void;
}

export const AnnisaAiView: React.FC<AnnisaAiViewProps> = ({
  stocks,
  selectedStock,
  onSelectStock
}) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState<string | null>(null);

  // Position Sizing Calculator state
  const [capital, setCapital] = useState<number>(50000000); // 50 Juta Rupiah default
  const [riskPct, setRiskPct] = useState<number>(2.0); // 2% risk tolerance
  const [entryPrice, setEntryPrice] = useState<number>(selectedStock.tradingPlan.entryMax);
  const [slPrice, setSlPrice] = useState<number>(selectedStock.tradingPlan.stopLoss);
  const [tpPrice, setTpPrice] = useState<number>(selectedStock.tradingPlan.tp1);

  // Sync calculator when selectedStock changes
  React.useEffect(() => {
    setEntryPrice(selectedStock.tradingPlan.entryMax);
    setSlPrice(selectedStock.tradingPlan.stopLoss);
    setTpPrice(selectedStock.tradingPlan.tp1);
    setAiReport(null);
    setErrorAi(null);
  }, [selectedStock]);

  const sizingResult = calculatePositionSizing(capital, riskPct, entryPrice, slPrice, tpPrice);

  // Request Deep Gemini AI Analysis via server route
  const handleRequestAiAnalysis = async () => {
    setLoadingAi(true);
    setErrorAi(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: selectedStock })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memanggil server AI.');
      }

      setAiReport(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorAi(err.message || 'Terjadi kesalahan saat memproses analisa.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Stock Selector */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/40">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Annisa AI Engine</h2>
              <p className="text-xs text-slate-400">Analisa Kuantitatif & Rekomendasi Taktis Berbasis AI (Gemini 3.8 Flash)</p>
            </div>
          </div>
        </div>

        {/* Stock Selector Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Pilih Saham:</span>
          <select
            value={selectedStock.ticker}
            onChange={(e) => {
              const found = stocks.find(s => s.ticker === e.target.value);
              if (found) onSelectStock(found);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {stocks.map(s => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.name} ({s.changePct > 0 ? '+' : ''}{s.changePct}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Radar Score & Gemini AI Deep Dive */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quantitative Score Breakdown Card */}
          <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-white text-lg">
                  {selectedStock.ticker}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">{selectedStock.ticker}</h3>
                  <p className="text-xs text-slate-400">{selectedStock.name}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Skor Gabungan Annisa AI</span>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-black font-mono text-cyan-400">{selectedStock.aiScore}</span>
                  <span className="text-xs text-slate-500 font-mono">/100</span>
                </div>
              </div>
            </div>

            {/* 3 Core Pillar Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              {/* Technical Pillar */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">1. Indikator Teknikal</span>
                <span className="text-lg font-black font-mono text-white">
                  {selectedStock.aiScore >= 70 ? 'Sangat Kuat' : 'Moderat'}
                </span>
                <p className="text-[11px] text-slate-400">
                  RSI {selectedStock.technicals.rsi14} ({selectedStock.technicals.rsiStatus}) • RVOL {selectedStock.technicals.rvol}x
                </p>
              </div>

              {/* Fundamental Pillar */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">2. Kesehatan Fundamental</span>
                <span className="text-lg font-black font-mono text-white">
                  ROE {selectedStock.fundamentals.roe}%
                </span>
                <p className="text-[11px] text-slate-400">
                  PER {selectedStock.fundamentals.per}x • DER {selectedStock.fundamentals.der}x Sehat
                </p>
              </div>

              {/* Bandarmologi Pillar */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block">3. Smart Money & Asing</span>
                <span className="text-lg font-black font-mono text-white">
                  {selectedStock.bandar.score}/100
                </span>
                <p className="text-[11px] text-slate-400 truncate">
                  {selectedStock.bandar.status} • {selectedStock.bandar.wyckoffPhase.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* AI Generate Button */}
            <div className="pt-2">
              <button
                onClick={handleRequestAiAnalysis}
                disabled={loadingAi}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {loadingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Menganalisa Data Teknikal & Fundamental dengan Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Minta Bedah Analisa Mendalam AI untuk {selectedStock.ticker}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Report Card */}
          {(aiReport || loadingAi || errorAi) && (
            <div className="bg-[#10141e] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Hasil Analisa Annisa AI</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  Engine: Gemini 3.8 Flash
                </span>
              </div>

              {loadingAi && (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-sm text-slate-300 font-medium">Sedang memproses struktur teknikal, fraksi BEI, dan rasio fundamental...</p>
                </div>
              )}

              {errorAi && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorAi}
                </div>
              )}

              {aiReport && !loadingAi && (
                <div className="prose prose-invert prose-sm max-w-none space-y-3 text-slate-300 font-sans leading-relaxed text-xs sm:text-sm">
                  {aiReport.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('###') || paragraph.startsWith('##')) {
                      return (
                        <h4 key={idx} className="text-cyan-300 font-bold text-sm sm:text-base border-b border-slate-800/80 pb-1 mt-4">
                          {paragraph.replace(/#/g, '').trim()}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1 text-slate-300">
                          {paragraph.split('\n').map((line, lIdx) => (
                            <li key={lIdx}>{line.replace(/^[-*]\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} className="text-slate-300 leading-normal">{paragraph}</p>;
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Interactive Position Sizing & Money Management Calculator */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Kalkulator Lot & Manajemen Risiko (Fraksi BEI)
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              {/* Total Capital Input */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Total Modal Trading (IDR):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000000"
                    value={capital}
                    onChange={(e) => setCapital(Math.max(1000000, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]">Rupiah</span>
                </div>
              </div>

              {/* Risk Tolerance Toggle */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium block">Batas Risiko Per Transaksi (%):</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1.0, 1.5, 2.0, 3.0].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setRiskPct(pct)}
                      className={`py-1.5 rounded-lg border font-bold transition ${
                        riskPct === pct
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry, Stop Loss, Target Price */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-slate-400 block text-[10px]">Harga Beli (Entry)</label>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-rose-400 block text-[10px]">Cut Loss (SL)</label>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={(e) => setSlPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-rose-300 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-emerald-400 block text-[10px]">Target (TP)</label>
                  <input
                    type="number"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-300 font-bold"
                  />
                </div>
              </div>

              {/* Sizing Output Hero Cards */}
              <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Ukuran Posisi Direkomendasikan:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-cyan-400 font-mono">{sizingResult.lots} Lot</span>
                    <span className="text-[10px] text-slate-500 block">({sizingResult.shares.toLocaleString('id-ID')} lembar)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Total Modal Dibutuhkan:</span>
                  <span className="text-white font-bold">{formatIDR(sizingResult.totalInvestment)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Maksimal Risiko (1R):</span>
                  <span className="text-rose-400 font-bold">{formatIDR(sizingResult.potentialLoss)} ({sizingResult.riskPct}% modal)</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Estimasi Potensi Profit:</span>
                  <span className="text-emerald-400 font-bold">+{formatIDR(sizingResult.potentialGain)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Risk to Reward Ratio (RRR):</span>
                  <span className="text-cyan-300 font-bold text-sm">1 : {sizingResult.riskRewardRatio}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Fraksi Harga BEI Terpenuhi
                </p>
                <p>Harga order telah disesuaikan otomatis dengan tick size Rp {selectedStock.tickSize}. 1 Lot = 100 Lembar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
