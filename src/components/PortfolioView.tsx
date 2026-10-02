import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  PieChart, 
  DollarSign, 
  Target, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  LineChart, 
  Layers, 
  Calendar,
  X,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { StockItem, PortfolioPosition } from '../types/stock';
import { formatIDR, getIdxTickSize, roundToIdxTick } from '../utils/idxCalculations';
import { ActiveTab } from './Header';

interface PortfolioViewProps {
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

const DEFAULT_POSITIONS: PortfolioPosition[] = [
  {
    id: 'POS-1',
    ticker: 'BBCA',
    buyPrice: 9650,
    lots: 25,
    buyDate: '2026-09-15',
    notes: 'Akumulasi swing di area support EMA50'
  },
  {
    id: 'POS-2',
    ticker: 'BBRI',
    buyPrice: 4700,
    lots: 50,
    buyDate: '2026-09-20',
    notes: 'Rebound support double bottom'
  },
  {
    id: 'POS-3',
    ticker: 'ADRO',
    buyPrice: 3450,
    lots: 40,
    buyDate: '2026-09-28',
    notes: 'Katalis dividen yield jumbo & momentum batubara'
  },
  {
    id: 'POS-4',
    ticker: 'BREN',
    buyPrice: 6600,
    lots: 15,
    buyDate: '2026-10-01',
    notes: 'Breakout resistance didukung volume institusi'
  }
];

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  stocks,
  onSelectStock,
  setActiveTab
}) => {
  // Load saved positions or fallback to defaults
  const [positions, setPositions] = useState<PortfolioPosition[]>(() => {
    try {
      const saved = localStorage.getItem('annisa_ai_portfolio');
      return saved ? JSON.parse(saved) : DEFAULT_POSITIONS;
    } catch {
      return DEFAULT_POSITIONS;
    }
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PortfolioPosition | null>(null);

  // Form Inputs
  const [formTicker, setFormTicker] = useState('BBCA');
  const [formBuyPrice, setFormBuyPrice] = useState<number>(9825);
  const [formLots, setFormLots] = useState<number>(10);
  const [formBuyDate, setFormBuyDate] = useState('2026-10-02');
  const [formNotes, setFormNotes] = useState('');

  // Persist to localStorage
  const savePositions = (newPositions: PortfolioPosition[]) => {
    setPositions(newPositions);
    try {
      localStorage.setItem('annisa_ai_portfolio', JSON.stringify(newPositions));
    } catch (e) {
      console.error('Failed to save portfolio', e);
    }
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingPosition(null);
    const initialStock = stocks.find(s => s.ticker === 'BBCA') || stocks[0];
    setFormTicker(initialStock.ticker);
    setFormBuyPrice(initialStock.price);
    setFormLots(10);
    setFormBuyDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (pos: PortfolioPosition) => {
    setEditingPosition(pos);
    setFormTicker(pos.ticker);
    setFormBuyPrice(pos.buyPrice);
    setFormLots(pos.lots);
    setFormBuyDate(pos.buyDate);
    setFormNotes(pos.notes || '');
    setIsModalOpen(true);
  };

  // Handle ticker change in form
  const handleTickerChange = (ticker: string) => {
    setFormTicker(ticker);
    const stock = stocks.find(s => s.ticker === ticker);
    if (stock) {
      setFormBuyPrice(stock.price);
    }
  };

  // Save / Submit form
  const handleSubmitPosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTicker || formLots <= 0 || formBuyPrice <= 0) return;

    if (editingPosition) {
      const updated = positions.map(p => 
        p.id === editingPosition.id 
          ? {
              ...p,
              ticker: formTicker,
              buyPrice: Number(formBuyPrice),
              lots: Number(formLots),
              buyDate: formBuyDate,
              notes: formNotes
            }
          : p
      );
      savePositions(updated);
    } else {
      const newPos: PortfolioPosition = {
        id: `POS-${Date.now()}`,
        ticker: formTicker,
        buyPrice: Number(formBuyPrice),
        lots: Number(formLots),
        buyDate: formBuyDate,
        notes: formNotes
      };
      savePositions([newPos, ...positions]);
    }
    setIsModalOpen(false);
  };

  // Delete position
  const handleDeletePosition = (id: string) => {
    const updated = positions.filter(p => p.id !== id);
    savePositions(updated);
  };

  // Reset to default sample
  const handleResetDefaults = () => {
    if (window.confirm('Reset portofolio ke contoh posisi default?')) {
      savePositions(DEFAULT_POSITIONS);
    }
  };

  // Map positions with real-time stock data
  const positionDetails = useMemo(() => {
    return positions.map(pos => {
      const stock = stocks.find(s => s.ticker === pos.ticker);
      const currentPrice = stock ? stock.price : pos.buyPrice;
      const shares = pos.lots * 100;
      const totalCost = pos.buyPrice * shares;
      const currentValue = currentPrice * shares;
      const pnlIDR = currentValue - totalCost;
      const pnlPct = totalCost > 0 ? Number(((pnlIDR / totalCost) * 100).toFixed(2)) : 0;
      const dailyChangePerShare = stock ? stock.change : 0;
      const dailyPnlIDR = dailyChangePerShare * shares;

      return {
        ...pos,
        stock,
        currentPrice,
        shares,
        totalCost,
        currentValue,
        pnlIDR,
        pnlPct,
        dailyPnlIDR
      };
    });
  }, [positions, stocks]);

  // Aggregate Portfolio Totals
  const portfolioSummary = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalDailyPnl = 0;
    let greenCount = 0;

    positionDetails.forEach(p => {
      totalValue += p.currentValue;
      totalCost += p.totalCost;
      totalDailyPnl += p.dailyPnlIDR;
      if (p.pnlIDR > 0) greenCount++;
    });

    const totalPnlIDR = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? Number(((totalPnlIDR / totalCost) * 100).toFixed(2)) : 0;
    const dailyPnlPct = totalCost > 0 ? Number(((totalDailyPnl / totalCost) * 100).toFixed(2)) : 0;
    const winRate = positionDetails.length > 0 ? Math.round((greenCount / positionDetails.length) * 100) : 0;

    return {
      totalValue,
      totalCost,
      totalPnlIDR,
      totalPnlPct,
      totalDailyPnl,
      dailyPnlPct,
      winRate,
      greenCount,
      positionCount: positionDetails.length
    };
  }, [positionDetails]);

  // Sector Allocation breakdown
  const sectorAllocation = useMemo(() => {
    const map = new Map<string, number>();
    positionDetails.forEach(p => {
      const sector = p.stock?.sector || 'Lainnya';
      map.set(sector, (map.get(sector) || 0) + p.currentValue);
    });

    const totalVal = Math.max(1, portfolioSummary.totalValue);
    const sectors: { name: string; value: number; pct: number }[] = [];

    map.forEach((val, name) => {
      sectors.push({
        name,
        value: val,
        pct: Number(((val / totalVal) * 100).toFixed(1))
      });
    });

    return sectors.sort((a, b) => b.value - a.value);
  }, [positionDetails, portfolioSummary.totalValue]);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-mono tracking-tight">Portfolio Tracker Real-Time</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase">
                Live IDX P&L
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Pantau posisi saham, modal beli, dan untung/rugi (P&L) mengambang secara otomatis mengikuti harga bursa terkini.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition"
            title="Reset ke Posisi Default"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Posisi</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Posisi Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Nilai Portofolio */}
        <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Nilai Portofolio Saat Ini</span>
            <Wallet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatIDR(portfolioSummary.totalValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Modal: {formatIDR(portfolioSummary.totalCost)}</span>
            <span className="text-slate-500 font-semibold">{portfolioSummary.positionCount} Emiten</span>
          </div>
        </div>

        {/* Total Floating P&L */}
        <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Total Floating P&L</span>
            {portfolioSummary.totalPnlIDR >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-2xl font-black tracking-tight ${portfolioSummary.totalPnlIDR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {portfolioSummary.totalPnlIDR >= 0 ? '+' : ''}{formatIDR(portfolioSummary.totalPnlIDR)}
          </div>
          <div className="text-[11px] font-bold mt-1">
            <span className={portfolioSummary.totalPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {portfolioSummary.totalPnlPct >= 0 ? '+' : ''}{portfolioSummary.totalPnlPct}% dari total modal
            </span>
          </div>
        </div>

        {/* P&L Hari Ini (Daily Performance) */}
        <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>P&L Hari Ini (1D Change)</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${portfolioSummary.totalDailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {portfolioSummary.totalDailyPnl >= 0 ? '+' : ''}{formatIDR(portfolioSummary.totalDailyPnl)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className={portfolioSummary.dailyPnlPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {portfolioSummary.dailyPnlPct >= 0 ? '+' : ''}{portfolioSummary.dailyPnlPct}%
            </span>
            <span className="text-slate-500 ml-1">fluktuasi harian</span>
          </div>
        </div>

        {/* Win Rate / Posisi Hijau */}
        <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl font-mono relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1">
            <span>Rasio Posisi Profit (Win Rate)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 tracking-tight">
            {portfolioSummary.winRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-bold">{portfolioSummary.greenCount} Posisi Untung</span>
            <span className="text-slate-500"> / {portfolioSummary.positionCount} Posisi</span>
          </div>
        </div>
      </div>

      {/* Sector Allocation Segmented Bar */}
      {sectorAllocation.length > 0 && (
        <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Diversifikasi Sektoral Portofolio
            </span>
            <span className="text-slate-400 text-[11px]">{sectorAllocation.length} Sektor Aktif</span>
          </div>

          {/* Segmented bar */}
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
            {sectorAllocation.map((sec, idx) => {
              const colors = [
                'bg-cyan-500',
                'bg-emerald-500',
                'bg-purple-500',
                'bg-amber-500',
                'bg-rose-500',
                'bg-blue-500'
              ];
              const colorClass = colors[idx % colors.length];

              return (
                <div
                  key={sec.name}
                  className={`h-full ${colorClass} hover:opacity-80 transition cursor-pointer`}
                  style={{ width: `${sec.pct}%` }}
                  title={`${sec.name}: ${sec.pct}% (${formatIDR(sec.value)})`}
                />
              );
            })}
          </div>

          {/* Sector badges list */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {sectorAllocation.map((sec, idx) => {
              const dotColors = [
                'bg-cyan-400',
                'bg-emerald-400',
                'bg-purple-400',
                'bg-amber-400',
                'bg-rose-400',
                'bg-blue-400'
              ];
              return (
                <div key={sec.name} className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800">
                  <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                  <span>{sec.name}:</span>
                  <strong className="text-white">{sec.pct}%</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Holdings Table */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white text-sm uppercase tracking-wider">
              Daftar Posisi Saham Portofolio ({positions.length})
            </span>
          </div>
          <span className="text-slate-500 text-xs font-mono">
            Klik emiten untuk membuka Chart & Bedah AI
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-12 text-center font-mono space-y-3">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-slate-300 font-bold">Portofolio Anda Masih Kosong</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Belum ada saham yang ditambahkan. Masukkan emiten yang Anda miliki beserta harga beli dan jumlah lot untuk mulai melacak performa keuntungan real-time.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Saham Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-900/70 border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-4">Saham & Sektor</th>
                  <th className="py-3 px-3">Jumlah Lot</th>
                  <th className="py-3 px-3">Harga Beli</th>
                  <th className="py-3 px-3">Harga Sekarang</th>
                  <th className="py-3 px-3">Modal Pembelian</th>
                  <th className="py-3 px-3">Nilai Sekarang</th>
                  <th className="py-3 px-3">Floating P&L</th>
                  <th className="py-3 px-3">Sinyal AI</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positionDetails.map(pos => {
                  const isProfit = pos.pnlIDR >= 0;
                  const stock = pos.stock;

                  return (
                    <tr 
                      key={pos.id} 
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Ticker & Sector */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => {
                            if (stock) {
                              onSelectStock(stock);
                              setActiveTab('dashboard');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition">
                              {pos.ticker}
                            </span>
                            {stock && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${stock.changePct >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {stock?.name || pos.ticker}
                          </div>
                          {pos.notes && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                              "{pos.notes}"
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{pos.lots} Lot</div>
                        <div className="text-[10px] text-slate-500">
                          {pos.shares.toLocaleString('id-ID')} lembar
                        </div>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3 px-3 text-slate-300 font-semibold">
                        Rp {pos.buyPrice.toLocaleString('id-ID')}
                        <div className="text-[10px] text-slate-500">{pos.buyDate}</div>
                      </td>

                      {/* Current Price */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">
                          Rp {pos.currentPrice.toLocaleString('id-ID')}
                        </div>
                        {stock && (
                          <div className={`text-[10px] ${stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change} (1D)
                          </div>
                        )}
                      </td>

                      {/* Total Cost */}
                      <td className="py-3 px-3 text-slate-300">
                        {formatIDR(pos.totalCost)}
                      </td>

                      {/* Current Market Value */}
                      <td className="py-3 px-3 font-bold text-white">
                        {formatIDR(pos.currentValue)}
                      </td>

                      {/* Floating P&L */}
                      <td className="py-3 px-3">
                        <div className={`font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isProfit ? '+' : ''}{formatIDR(pos.pnlIDR)}</span>
                        </div>
                        <div className={`text-[11px] font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{pos.pnlPct}%
                        </div>
                      </td>

                      {/* Annisa AI Signal */}
                      <td className="py-3 px-3">
                        {stock ? (
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 block w-fit">
                              {stock.verdict}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              TP1: Rp {stock.tradingPlan.tp1.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {stock && (
                            <button
                              onClick={() => {
                                onSelectStock(stock);
                                setActiveTab('dashboard');
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 transition"
                              title="Buka di Dashboard"
                            >
                              <LineChart className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(pos)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            title="Edit Posisi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeletePosition(pos.id)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition"
                            title="Hapus / Jual Posisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Position Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121824] border border-cyan-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">
                  {editingPosition ? 'Edit Posisi Saham' : 'Tambah Saham ke Portofolio'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPosition} className="space-y-3.5 text-xs">
              {/* Ticker Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Pilih Emiten (Ticker IDX):</label>
                <select
                  value={formTicker}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400"
                >
                  {stocks.map(s => (
                    <option key={s.ticker} value={s.ticker}>
                      {s.ticker} - {s.name} (Rp {s.price.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Buy Price & Quick Tick helper */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] text-slate-400">Harga Beli Rata-Rata (IDR / Lembar):</label>
                  {stocks.find(s => s.ticker === formTicker) && (
                    <button
                      type="button"
                      onClick={() => {
                        const s = stocks.find(st => st.ticker === formTicker);
                        if (s) setFormBuyPrice(s.price);
                      }}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Gunakan Harga Pasar Terkini (Rp {stocks.find(s => s.ticker === formTicker)?.price.toLocaleString('id-ID')})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={formBuyPrice}
                  onChange={(e) => setFormBuyPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400"
                  placeholder="Contoh: 9800"
                />
              </div>

              {/* Lots Input & Quick Lot Buttons */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Jumlah Lot (1 Lot = 100 Lembar):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formLots}
                  onChange={(e) => setFormLots(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400"
                  placeholder="Contoh: 10"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[5, 10, 25, 50, 100].map(lot => (
                    <button
                      key={lot}
                      type="button"
                      onClick={() => setFormLots(lot)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[10px] transition"
                    >
                      +{lot} Lot
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy Date */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tanggal Transaksi Pembelian:</label>
                <input
                  type="date"
                  value={formBuyDate}
                  onChange={(e) => setFormBuyDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Trading Notes */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Catatan Alasan Beli (Opsional):</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Contoh: Beli saat pullback EMA 20, Target TP 10.200"
                />
              </div>

              {/* Real-time Calculation Preview Card */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Total Lembar Saham:</span>
                  <span className="text-white font-bold">{(formLots * 100).toLocaleString('id-ID')} Lembar</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimasi Total Modal:</span>
                  <span className="text-cyan-300 font-bold">{formatIDR(formBuyPrice * formLots * 100)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
                >
                  {editingPosition ? 'Perbarui Posisi' : 'Simpan ke Portofolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
