import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  PieChart, 
  Compass, 
  ArrowUpRight, 
  BarChart3, 
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { StockItem, Sector } from '../types/stock';

interface SectorAnalysisSectionProps {
  stocks: StockItem[];
  currentStock: StockItem;
  onSelectStock: (stock: StockItem) => void;
}

interface SectorSummary {
  sector: Sector;
  avgChangePct: number;
  totalTurnoverBillion: number;
  stockCount: number;
  outperformingIHSG: boolean;
  alphaVsIHSG: number;
  status: 'OUTPERFORM' | 'MARKET_PERFORM' | 'UNDERPERFORM';
  topGainers: StockItem[];
  allStocks: StockItem[];
}

export const SectorAnalysisSection: React.FC<SectorAnalysisSectionProps> = ({
  stocks,
  currentStock,
  onSelectStock
}) => {
  // IHSG benchmark definition
  const ihsgBenchmark = {
    name: 'IHSG Composite',
    value: 7485.20,
    changePct: 0.68,
    turnoverTrillion: 14.85,
    advances: 312,
    declines: 198,
    unchanged: 174
  };

  const [sortBy, setSortBy] = useState<'PERFORMANCE' | 'TURNOVER' | 'ALPHA'>('PERFORMANCE');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<Sector | 'ALL'>('ALL');

  // Compute sector-by-sector real-time metrics
  const sectorSummaries: SectorSummary[] = useMemo(() => {
    const grouped = new Map<Sector, StockItem[]>();

    stocks.forEach(stock => {
      const existing = grouped.get(stock.sector) || [];
      existing.push(stock);
      grouped.set(stock.sector, existing);
    });

    const summaries: SectorSummary[] = [];

    grouped.forEach((sectorStocks, sector) => {
      const totalChange = sectorStocks.reduce((acc, s) => acc + s.changePct, 0);
      const avgChangePct = Number((totalChange / sectorStocks.length).toFixed(2));
      const totalTurnover = Number(sectorStocks.reduce((acc, s) => acc + s.value, 0).toFixed(1));
      const alphaVsIHSG = Number((avgChangePct - ihsgBenchmark.changePct).toFixed(2));

      let status: SectorSummary['status'] = 'MARKET_PERFORM';
      if (alphaVsIHSG > 0.25) {
        status = 'OUTPERFORM';
      } else if (alphaVsIHSG < -0.25) {
        status = 'UNDERPERFORM';
      }

      const sortedByChange = [...sectorStocks].sort((a, b) => b.changePct - a.changePct);

      summaries.push({
        sector,
        avgChangePct,
        totalTurnoverBillion: totalTurnover,
        stockCount: sectorStocks.length,
        outperformingIHSG: avgChangePct > ihsgBenchmark.changePct,
        alphaVsIHSG,
        status,
        topGainers: sortedByChange.slice(0, 3),
        allStocks: sortedByChange
      });
    });

    return summaries.sort((a, b) => {
      if (sortBy === 'PERFORMANCE') return b.avgChangePct - a.avgChangePct;
      if (sortBy === 'TURNOVER') return b.totalTurnoverBillion - a.totalTurnoverBillion;
      return b.alphaVsIHSG - a.alphaVsIHSG;
    });
  }, [stocks, sortBy]);

  const maxSectorTurnover = Math.max(...sectorSummaries.map(s => s.totalTurnoverBillion), 1);
  const maxAbsChange = Math.max(...sectorSummaries.map(s => Math.abs(s.avgChangePct)), 2);

  const getStatusBadge = (status: SectorSummary['status']) => {
    switch (status) {
      case 'OUTPERFORM':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
      case 'MARKET_PERFORM':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold';
      case 'UNDERPERFORM':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
    }
  };

  return (
    <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Title & IHSG Market Pulse Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                Analisa Sektoral & Komparasi Terhadap IHSG
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                Real-Time IDX
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Rotasi sektor, kekuatan relatif (*Relative Strength*), dan emiten penggerak utama (*leading movers*) per sektor.
            </p>
          </div>
        </div>

        {/* IHSG Benchmark Live Card */}
        <div className="flex items-center gap-3 font-mono text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/90">
          <div className="border-r border-slate-800 pr-3">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Benchmark IHSG</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-white">{ihsgBenchmark.value.toLocaleString('id-ID')}</span>
              <span className="text-emerald-400 font-bold flex items-center text-xs">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{ihsgBenchmark.changePct}%
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Turnover</span>
            <span className="text-slate-200 font-bold">Rp {ihsgBenchmark.turnoverTrillion} Triliun</span>
          </div>
        </div>
      </div>

      {/* Sorting & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold">Urutkan Sektor:</span>
          {(['PERFORMANCE', 'TURNOVER', 'ALPHA'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1 rounded-lg border transition ${
                sortBy === option
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {option === 'PERFORMANCE' ? 'Performa 1D %' : (option === 'TURNOVER' ? 'Nilai Transaksi' : 'Alpha vs IHSG')}
            </button>
          ))}
        </div>

        <div className="text-slate-400 text-[11px]">
          Emiten Anda saat ini: <strong className="text-cyan-300">{currentStock.ticker}</strong> ({currentStock.sector})
        </div>
      </div>

      {/* Relative Strength Visual Comparison Chart (Bar vs IHSG Benchmark Line) */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Grafik Kekuatan Relatif Sektor vs IHSG (+{ihsgBenchmark.changePct}%)
          </span>
          <span className="text-slate-400 text-[11px]">Garis putus-putus = Benchmark IHSG</span>
        </div>

        <div className="space-y-2.5 font-mono text-xs">
          {sectorSummaries.map((s) => {
            const isOutperforming = s.outperformingIHSG;
            const barWidthPct = Math.min(100, (Math.abs(s.avgChangePct) / (maxAbsChange * 1.2)) * 100);
            const isCurrentStockSector = s.sector === currentStock.sector;

            return (
              <div 
                key={s.sector} 
                className={`p-2.5 rounded-lg border transition ${
                  isCurrentStockSector 
                    ? 'bg-cyan-500/10 border-cyan-500/40' 
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{s.sector}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadge(s.status)}`}>
                      {s.status} ({s.alphaVsIHSG > 0 ? `+${s.alphaVsIHSG}%` : `${s.alphaVsIHSG}%`})
                    </span>
                    {isCurrentStockSector && (
                      <span className="text-[10px] text-cyan-400 font-semibold hidden sm:inline">
                        • Sektor {currentStock.ticker}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">Rp {s.totalTurnoverBillion.toFixed(0)} Miliar</span>
                    <span className={`font-bold ${s.avgChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.avgChangePct >= 0 ? '+' : ''}{s.avgChangePct}%
                    </span>
                  </div>
                </div>

                {/* Relative Performance Visual Bar */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden relative flex items-center">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      s.avgChangePct >= 0 
                        ? (isOutperforming ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-600') 
                        : 'bg-gradient-to-r from-rose-500 to-rose-700'
                    }`}
                    style={{ width: `${Math.max(4, barWidthPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sector Deep Dive & Leading Stock Movers */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-400" />
          Saham Penggerak Utama Per Sektor (Leading Movers)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectorSummaries.map((s) => (
            <div 
              key={`cards-${s.sector}`}
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 font-mono text-xs hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="font-bold text-slate-100 truncate pr-2">{s.sector}</span>
                <span className={`font-bold ${s.avgChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {s.avgChangePct >= 0 ? '+' : ''}{s.avgChangePct}%
                </span>
              </div>

              {/* Leading Stocks Pills */}
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Top Movers:</span>
                <div className="flex flex-wrap gap-1.5">
                  {s.topGainers.map((g) => (
                    <button
                      key={g.ticker}
                      onClick={() => onSelectStock(g)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition ${
                        currentStock.ticker === g.ticker
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                      title={`Klik untuk menganalisa ${g.ticker}`}
                    >
                      <span className="font-bold">{g.ticker}</span>
                      <span className={g.changePct >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {g.changePct >= 0 ? '+' : ''}{g.changePct}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
