import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Coins, 
  ShieldCheck, 
  PieChart, 
  Users, 
  ArrowRight,
  Info,
  Compass
} from 'lucide-react';
import { StockItem, WyckoffPhase } from '../types/stock';

interface BandarmologiSectionProps {
  stock: StockItem;
}

export const BandarmologiSection: React.FC<BandarmologiSectionProps> = ({ stock }) => {
  const [foreignDays, setForeignDays] = useState<10 | 20>(20);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { bandar } = stock;
  const flowHistory = bandar.foreignFlowHistory.slice(-foreignDays);

  // SVG Chart Dimensions
  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 55, bottom: 25, left: 50 };

  // Calculate flow min/max
  const dailyVals = flowHistory.map(f => f.netForeignBillion);
  const cumVals = flowHistory.map(f => f.cumulativeBillion);
  const maxAbsDaily = Math.max(...dailyVals.map(Math.abs), 10);
  const minCum = Math.min(...cumVals, 0);
  const maxCum = Math.max(...cumVals, 10);

  const chartWidth = width - padding.left - padding.right;
  const barWidth = Math.max(4, (chartWidth / flowHistory.length) * 0.65);
  const barSpacing = chartWidth / flowHistory.length;

  const getX = (idx: number) => padding.left + idx * barSpacing + barSpacing / 2;
  const getDailyY = (val: number) => {
    // 0 is at middle
    const zeroY = height / 2;
    const scale = (height / 2 - padding.top);
    return zeroY - (val / maxAbsDaily) * scale;
  };
  const getCumY = (val: number) => {
    return padding.top + (1 - (val - minCum) / (maxCum - minCum || 1)) * (height - padding.top - padding.bottom);
  };

  // Cumulative Flow Line Path
  let cumPath = '';
  for (let i = 0; i < flowHistory.length; i++) {
    const x = getX(i);
    const y = getCumY(flowHistory[i].cumulativeBillion);
    cumPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  const activeHover = hoverIndex !== null && flowHistory[hoverIndex] ? flowHistory[hoverIndex] : flowHistory[flowHistory.length - 1];

  // Wyckoff phase tracker items
  const wyckoffStages: { id: WyckoffPhase; label: string; stage: string }[] = [
    { id: 'Phase A (Stopping Action)', label: 'Fase A', stage: 'Stopping Volume' },
    { id: 'Phase B (Building Cause / Accumulation)', label: 'Fase B', stage: 'Akumulasi Diam-diam' },
    { id: 'Phase C (Spring / Shakeout)', label: 'Fase C', stage: 'Spring / Shakeout Ritel' },
    { id: 'Phase D (Sign of Strength / Breakout)', label: 'Fase D', stage: 'Breakout Resistance (SOS)' },
    { id: 'Phase E (Markup / Trend Run)', label: 'Fase E', stage: 'Markup Tren Bullish' },
  ];

  // Max value among top brokers for scaling horizontal bars
  const maxBuyerVal = Math.max(...bandar.topBuyersList.map(b => Math.abs(b.netValBillion)), 1);
  const maxSellerVal = Math.max(...bandar.topSellersList.map(s => Math.abs(s.netValBillion)), 1);
  const maxBrokerVal = Math.max(maxBuyerVal, maxSellerVal);

  const getBrokerBadge = (type: 'ASING' | 'INSTITUSI' | 'RITEL') => {
    switch (type) {
      case 'ASING':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'INSTITUSI':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'RITEL':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Title & Bandar Score Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                Analisa Bandarmologi & Aliran Dana Asing (Foreign Flow)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                {bandar.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Pelacakan jejak akumulasi bandar (smart money), broker summary 5 besar, dan intervensi modal asing di saham {stock.ticker}.
            </p>
          </div>
        </div>

        {/* Quick Foreign Net Ribbon */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Foreign 1D</span>
            <span className={`font-bold ${bandar.foreignNet1D >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {bandar.foreignNet1D >= 0 ? '+' : ''}{bandar.foreignNet1D} M
            </span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Foreign 5D</span>
            <span className={`font-bold ${bandar.foreignNet5D >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {bandar.foreignNet5D >= 0 ? '+' : ''}{bandar.foreignNet5D} M
            </span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Foreign 20D</span>
            <span className={`font-bold ${bandar.foreignNet20D >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {bandar.foreignNet20D >= 0 ? '+' : ''}{bandar.foreignNet20D} M
            </span>
          </div>
        </div>
      </div>

      {/* Wyckoff Phase Lifecycle Tracker */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            Siklus Akumulasi Wyckoff Saat Ini:
          </span>
          <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
            {bandar.wyckoffPhase}
          </span>
        </div>

        {/* 5-Stage Visual Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
          {wyckoffStages.map((stg) => {
            const isCurrent = bandar.wyckoffPhase === stg.id;
            return (
              <div
                key={stg.id}
                className={`p-2 rounded-lg border text-center transition ${
                  isCurrent
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-md font-bold'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800/80'
                }`}
              >
                <div className="text-[10px] uppercase">{stg.label}</div>
                <div className="truncate text-slate-300 text-[10px] mt-0.5">{stg.stage}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Grid: Foreign Flow Chart (Left) + Broker Summary Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (6 cols): Foreign Net Buy / Sell Chart */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Grafik Aliran Dana Asing (Harian & Kumulatif)
              </span>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setForeignDays(10)}
                className={`px-2 py-0.5 rounded transition ${foreignDays === 10 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                10 Hari
              </button>
              <button
                onClick={() => setForeignDays(20)}
                className={`px-2 py-0.5 rounded transition ${foreignDays === 20 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                20 Hari
              </button>
            </div>
          </div>

          {/* Hover Meta Bar */}
          {activeHover && (
            <div className="flex items-center justify-between text-xs font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
              <span>Tgl: <strong className="text-white">{activeHover.date}</strong></span>
              <span>Net Harian: <strong className={activeHover.netForeignBillion >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {activeHover.netForeignBillion >= 0 ? '+' : ''}{activeHover.netForeignBillion} M
              </strong></span>
              <span>Kumulatif: <strong className="text-cyan-300">{activeHover.cumulativeBillion} M</strong></span>
            </div>
          )}

          {/* SVG Foreign Flow Dual-Axis Chart */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 relative overflow-hidden select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * width;
                const index = Math.min(flowHistory.length - 1, Math.max(0, Math.floor((mouseX - padding.left) / barSpacing)));
                setHoverIndex(index);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Zero Line */}
              <line
                x1={padding.left}
                y1={height / 2}
                x2={width - padding.right}
                y2={height / 2}
                stroke="#334155"
                strokeWidth="1"
              />
              <text x={padding.left - 6} y={height / 2 + 3} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="end">
                0
              </text>

              {/* Upper & Lower Limits */}
              <text x={padding.left - 6} y={padding.top + 5} fill="#10b981" fontSize="9" fontFamily="monospace" textAnchor="end">
                +{maxAbsDaily.toFixed(0)}M
              </text>
              <text x={padding.left - 6} y={height - padding.bottom} fill="#f43f5e" fontSize="9" fontFamily="monospace" textAnchor="end">
                -{maxAbsDaily.toFixed(0)}M
              </text>

              {/* Daily Flow Histogram Bars */}
              {flowHistory.map((f, i) => {
                const x = getX(i);
                const y = getDailyY(f.netForeignBillion);
                const isBuy = f.netForeignBillion >= 0;
                const zeroY = height / 2;
                const barH = Math.max(1, Math.abs(zeroY - y));

                return (
                  <rect
                    key={`ff-bar-${i}`}
                    x={x - barWidth / 2}
                    y={isBuy ? y : zeroY}
                    width={barWidth}
                    height={barH}
                    fill={isBuy ? '#10b981' : '#f43f5e'}
                    rx="1.5"
                    opacity={0.85}
                  />
                );
              })}

              {/* Cumulative Flow Line Overlay */}
              <path
                d={cumPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Hover Cursor */}
              {hoverIndex !== null && (
                <line
                  x1={getX(hoverIndex)}
                  y1={padding.top}
                  x2={getX(hoverIndex)}
                  y2={height - padding.bottom}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Net Buy Asing
              <span className="w-2.5 h-2.5 rounded bg-rose-500 ml-2" /> Net Sell Asing
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-4 h-0.5 bg-cyan-400 inline-block" /> Garis Kumulatif
            </span>
          </div>
        </div>

        {/* Right Column (6 cols): Broker Summary Buyer vs Seller Visualizer */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              Broker Summary (Top 5 Buyer vs Top 5 Seller)
            </span>
            <span className="text-[11px] text-slate-400">Total Transaksi Hari Ini</span>
          </div>

          {/* Concentration Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Top 1 Konsentrasi</span>
              <span className="font-bold text-cyan-300">{bandar.top1ConcentrationPct}%</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Top 3 Konsentrasi</span>
              <span className="font-bold text-purple-300">{bandar.top3ConcentrationPct}%</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Partisipasi Ritel</span>
              <span className="font-bold text-amber-300">{bandar.retailParticipationPct}%</span>
            </div>
          </div>

          {/* Top 5 Buyers vs Top 5 Sellers Comparison Rows */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Top Buyers */}
            <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block pb-1 border-b border-slate-800">
                Top 5 Pembeli Bersih (Net Buy)
              </span>

              {bandar.topBuyersList.map((buyer, idx) => {
                const barWidthPct = (Math.abs(buyer.netValBillion) / maxBrokerVal) * 100;

                return (
                  <div key={buyer.code} className="space-y-0.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{buyer.code}</span>
                        <span className={`text-[9px] px-1 rounded border font-semibold ${getBrokerBadge(buyer.type)}`}>
                          {buyer.type[0]}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-400">+{buyer.netValBillion} M</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Sellers */}
            <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-rose-400 font-bold uppercase block pb-1 border-b border-slate-800">
                Top 5 Penjual Bersih (Net Sell)
              </span>

              {bandar.topSellersList.map((seller, idx) => {
                const barWidthPct = (Math.abs(seller.netValBillion) / maxBrokerVal) * 100;

                return (
                  <div key={seller.code} className="space-y-0.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{seller.code}</span>
                        <span className={`text-[9px] px-1 rounded border font-semibold ${getBrokerBadge(seller.type)}`}>
                          {seller.type[0]}
                        </span>
                      </div>
                      <span className="font-bold text-rose-400">{seller.netValBillion} M</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-400 rounded-full transition-all"
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
