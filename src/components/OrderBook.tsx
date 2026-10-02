import React from 'react';
import { StockItem } from '../types/stock';

interface OrderBookProps {
  stock: StockItem;
}

export const OrderBook: React.FC<OrderBookProps> = ({ stock }) => {
  const { orderBook, araPrice, arbPrice, price, prevClose } = stock;

  const totalBidVol = orderBook.reduce((acc, curr) => acc + curr.bidVol, 0);
  const totalOfferVol = orderBook.reduce((acc, curr) => acc + curr.offerVol, 0);
  const maxLevelVol = Math.max(...orderBook.flatMap(o => [o.bidVol, o.offerVol]));

  const bidRatio = Number(((totalBidVol / (totalBidVol + totalOfferVol || 1)) * 100).toFixed(1));
  const offerRatio = Number((100 - bidRatio).toFixed(1));

  return (
    <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header: Title & ARA/ARB */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Order Book & Kedalaman Pasar (BEI)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Fraksi: <strong className="text-cyan-300">Rp {stock.tickSize}</strong> / tick
          </p>
        </div>

        {/* ARA & ARB Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-right">
            <span className="text-[9px] uppercase tracking-wider block text-emerald-500 font-bold">ARA</span>
            Rp {araPrice.toLocaleString('id-ID')}
          </div>
          <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-right">
            <span className="text-[9px] uppercase tracking-wider block text-rose-500 font-bold">ARB</span>
            Rp {arbPrice.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Bid vs Offer Power Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono font-semibold">
          <span className="text-emerald-400">Total Beli: {(totalBidVol / 1000).toFixed(1)}k Lot ({bidRatio}%)</span>
          <span className="text-rose-400">Total Jual: {(totalOfferVol / 1000).toFixed(1)}k Lot ({offerRatio}%)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
            style={{ width: `${bidRatio}%` }}
          />
          <div 
            className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300"
            style={{ width: `${offerRatio}%` }}
          />
        </div>
      </div>

      {/* 10-Level Order Book Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
              <th className="py-1 text-left font-semibold">Lot Beli</th>
              <th className="py-1 text-right font-semibold text-emerald-400">Bid (Beli)</th>
              <th className="py-1 text-center font-semibold text-slate-500">|</th>
              <th className="py-1 text-left font-semibold text-rose-400">Offer (Jual)</th>
              <th className="py-1 text-right font-semibold">Lot Jual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {orderBook.map((level, idx) => {
              const bidWidthPct = (level.bidVol / maxLevelVol) * 100;
              const offerWidthPct = (level.offerVol / maxLevelVol) * 100;

              return (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  {/* Bid Lot + Visual Bar */}
                  <td className="py-1 relative text-slate-300">
                    <div 
                      className="absolute inset-y-0 right-0 bg-emerald-500/15 rounded-l transition-all pointer-events-none"
                      style={{ width: `${bidWidthPct}%` }}
                    />
                    <span className="relative z-10 font-medium pl-1">
                      {(level.bidVol).toLocaleString('id-ID')}
                    </span>
                  </td>

                  {/* Bid Price */}
                  <td className="py-1 text-right font-bold text-emerald-400 pr-2">
                    {level.price.toLocaleString('id-ID')}
                  </td>

                  {/* Divider */}
                  <td className="py-1 text-center text-slate-700">|</td>

                  {/* Offer Price */}
                  <td className="py-1 text-left font-bold text-rose-400 pl-2">
                    {(level.price + stock.tickSize * (idx + 1)).toLocaleString('id-ID')}
                  </td>

                  {/* Offer Lot + Visual Bar */}
                  <td className="py-1 relative text-right text-slate-300 pr-1">
                    <div 
                      className="absolute inset-y-0 left-0 bg-rose-500/15 rounded-r transition-all pointer-events-none"
                      style={{ width: `${offerWidthPct}%` }}
                    />
                    <span className="relative z-10 font-medium">
                      {(level.offerVol).toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Foreign & Broker Quick Stat */}
      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-500 block text-[10px]">Foreign Net 1D</span>
          <span className={`font-bold ${stock.bandar.foreignNet1D >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stock.bandar.foreignNet1D >= 0 ? '+' : ''}{stock.bandar.foreignNet1D} Miliar
          </span>
        </div>
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-500 block text-[10px]">Status Bandar</span>
          <span className="font-bold text-cyan-300 truncate block">
            {stock.bandar.status}
          </span>
        </div>
      </div>
    </div>
  );
};
