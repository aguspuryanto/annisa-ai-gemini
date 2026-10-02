import React from 'react';
import { X, Bell, ShieldAlert, Check, Trash2, ArrowRight } from 'lucide-react';
import { AlertTriggerEvent, StockItem } from '../types/stock';
import { ActiveTab } from './Header';

interface AlertNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: AlertTriggerEvent[];
  onMarkAllAsRead: () => void;
  onClearEvents: () => void;
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AlertNotificationDrawer: React.FC<AlertNotificationDrawerProps> = ({
  isOpen,
  onClose,
  events,
  onMarkAllAsRead,
  onClearEvents,
  stocks,
  onSelectStock,
  setActiveTab
}) => {
  if (!isOpen) return null;

  const unreadCount = events.filter(e => !e.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111622] border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#151c2c]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                Pusat Notifikasi Sinyal ({events.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action bar */}
          <div className="px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Belum dibaca: <strong className="text-cyan-400">{unreadCount}</strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onMarkAllAsRead}
                className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" /> Tandai Dibaca
              </button>
              <button
                onClick={onClearEvents}
                className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Bersihkan
              </button>
            </div>
          </div>

          {/* List of Triggered Notifications */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {events.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs font-mono">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p>Belum ada notifikasi sinyal terpicu.</p>
              </div>
            ) : (
              events.map((evt) => {
                const stock = stocks.find(s => s.ticker === evt.ticker);

                return (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition font-mono text-xs space-y-2 ${
                      !evt.read
                        ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="font-bold text-white text-sm">{evt.ticker}</span>
                        <span className="text-slate-400">Rp {evt.triggerPrice.toLocaleString('id-ID')}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                    </div>

                    <p className="text-cyan-200 font-sans text-xs leading-normal">{evt.message}</p>

                    {stock && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            onSelectStock(stock);
                            setActiveTab('dashboard');
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <span>Buka Saham</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
