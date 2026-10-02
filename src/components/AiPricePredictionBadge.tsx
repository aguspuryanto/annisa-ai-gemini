import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldCheck, 
  Info, 
  ArrowUpRight,
  Brain,
  Zap,
  ChevronRight
} from 'lucide-react';
import { StockItem } from '../types/stock';
import { calculateAiPriceProjection } from '../utils/idxCalculations';

interface AiPricePredictionBadgeProps {
  stock: StockItem;
  variant?: 'compact' | 'detailed';
}

export const AiPricePredictionBadge: React.FC<AiPricePredictionBadgeProps> = ({
  stock,
  variant = 'compact'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const projection = calculateAiPriceProjection(stock);

  const getDirectionBadge = () => {
    switch (projection.direction) {
      case 'BULLISH':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
          label: 'Bullish Breakout',
          icon: TrendingUp,
          color: 'text-emerald-400'
        };
      case 'MODERATE_BULLISH':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10',
          label: 'Moderate Upside',
          icon: ArrowUpRight,
          color: 'text-cyan-400'
        };
      case 'PULLBACK':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10',
          label: 'Pullback Risk',
          icon: TrendingDown,
          color: 'text-amber-400'
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'Konsolidasi',
          icon: Target,
          color: 'text-slate-400'
        };
    }
  };

  const badgeConfig = getDirectionBadge();
  const Icon = badgeConfig.icon;

  if (variant === 'compact') {
    return (
      <div className="relative">
        <div 
          onClick={() => setShowDetails(!showDetails)}
          className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border cursor-pointer backdrop-blur-md transition-all duration-200 select-none ${badgeConfig.bg} shadow-lg hover:border-cyan-400/60`}
          title="Klik untuk melihat detail proyeksi harga AI"
        >
          {/* Pulsing AI Icon */}
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute" />
            <div className="w-6 h-6 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            </div>
          </div>

          {/* Core Content */}
          <div className="font-mono text-xs">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider">
              <span className="text-slate-400">Proyeksi AI ({projection.horizonDays}):</span>
              <span className={`flex items-center gap-0.5 ${badgeConfig.color}`}>
                <Icon className="w-3 h-3" />
                {badgeConfig.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2 font-bold text-white mt-0.5">
              <span className="text-sm tracking-tight">
                Rp {projection.minPrice.toLocaleString('id-ID')} — Rp {projection.maxPrice.toLocaleString('id-ID')}
              </span>
              <span className={`text-[11px] font-semibold ${projection.expectedChangeMaxPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({projection.expectedChangeMinPct > 0 ? '+' : ''}{projection.expectedChangeMinPct}% ~ +{projection.expectedChangeMaxPct}%)
              </span>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="hidden sm:flex flex-col items-end pl-2 border-l border-slate-700/60 font-mono text-[10px]">
            <span className="text-slate-400">Konfidensi</span>
            <span className="text-cyan-300 font-bold">{projection.confidencePct}%</span>
          </div>
        </div>

        {/* Floating Detail Popover */}
        {showDetails && (
          <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-[#121824] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Model Proyeksi Momentum AI</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Horizon Waktu:</span>
                <span className="text-white font-bold">{projection.horizonDays}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Nilai Median Target:</span>
                <span className="text-cyan-300 font-bold">Rp {projection.targetMid.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Skor Momentum:</span>
                <span className="text-emerald-400 font-bold">{projection.momentumScore} / 100</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Band Volatilitas:</span>
                <span className="text-slate-300">{projection.volatilityBand}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block">Faktor Pendorong Utama:</span>
              <p className="font-sans leading-relaxed">{projection.primaryDriver}</p>
            </div>

            <div className="text-[10px] text-slate-500 font-sans leading-tight">
              *Proyeksi dihasilkan secara algoritmik dari konvergensi ATR(14), RSI expansion, lonjakan RVOL, dan arus bandar. Dibulatkan ke fraksi harga BEI.
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed Standalone Card
  return (
    <div className={`p-4 rounded-2xl border ${badgeConfig.bg} space-y-3 font-mono text-xs shadow-xl relative overflow-hidden`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">AI Price Range Projection</span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
              {badgeConfig.label} ({projection.horizonDays})
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase block">Konfidensi AI</span>
          <span className="text-base font-black text-cyan-300">{projection.confidencePct}%</span>
        </div>
      </div>

      {/* Target Price Range Big Display */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">Rentang Target Harga</span>
          <span className="text-lg font-black text-white">
            Rp {projection.minPrice.toLocaleString('id-ID')} — Rp {projection.maxPrice.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase block">Potensi Return</span>
          <span className={`text-sm font-bold ${projection.expectedChangeMaxPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {projection.expectedChangeMinPct > 0 ? '+' : ''}{projection.expectedChangeMinPct}% ~ +{projection.expectedChangeMaxPct}%
          </span>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-300 space-y-1">
        <span className="text-[10px] text-cyan-400 uppercase font-bold block flex items-center gap-1">
          <Zap className="w-3 h-3" /> Pendorong Momentum:
        </span>
        <p className="font-sans leading-normal text-xs">{projection.primaryDriver}</p>
      </div>
    </div>
  );
};
