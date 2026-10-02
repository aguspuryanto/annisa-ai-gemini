import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';
import { StockItem } from '../types/stock';

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
}

export const StockSearchModal: React.FC<StockSearchModalProps> = ({
  isOpen,
  onClose,
  stocks,
  onSelectStock
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filtered = stocks.filter(s => 
    s.ticker.toLowerCase().includes(query.toLowerCase()) ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.sector.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      onSelectStock(filtered[selectedIndex]);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#161c2b]">
          <Search className="w-5 h-5 text-cyan-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari kode saham, nama emiten, atau sektor (misal: BBCA, Adaro, Banking)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none text-base"
          />
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Tags */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0e131d] border-b border-slate-800/60 overflow-x-auto text-xs text-slate-400">
          <span className="text-slate-500 font-medium shrink-0">Populer:</span>
          {['BBCA', 'BBRI', 'BMRI', 'BREN', 'ADRO', 'ANTM', 'AMMN', 'TLKM'].map(ticker => (
            <button
              key={ticker}
              onClick={() => setQuery(ticker)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono transition"
            >
              {ticker}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50 p-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">Tidak ditemukan saham untuk kata kunci "{query}"</p>
            </div>
          ) : (
            filtered.map((stock, index) => {
              const isSelected = index === selectedIndex;
              const isPositive = stock.changePct >= 0;

              return (
                <div
                  key={stock.ticker}
                  onClick={() => {
                    onSelectStock(stock);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition ${
                    isSelected ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono font-bold text-slate-100 text-sm shrink-0">
                      {stock.ticker.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 font-mono tracking-wide">{stock.ticker}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 truncate max-w-[140px]">
                          {stock.sector}
                        </span>
                        {stock.aiScore >= 80 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> Annisa Top
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{stock.name}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div className="font-mono font-semibold text-slate-100 text-sm">
                      Rp {stock.price.toLocaleString('id-ID')}
                    </div>
                    <div className={`text-xs font-mono font-medium flex items-center justify-end gap-1 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : ''}{stock.changePct}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#0e131d] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">↑↓</kbd> Navigasi</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Enter</kbd> Pilih Saham</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Esc</kbd> Tutup</span>
          </div>
          <span className="text-cyan-400/80 font-medium">Bursa Efek Indonesia (IDX)</span>
        </div>
      </div>
    </div>
  );
};
