import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Bell, 
  Mail, 
  Trash2, 
  CheckCircle2, 
  Play, 
  Volume2, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Send
} from 'lucide-react';
import { StockItem, StockAlert, AlertTriggerEvent } from '../types/stock';
import { ActiveTab } from './Header';

interface AlertsViewProps {
  stocks: StockItem[];
  alerts: StockAlert[];
  onAddAlert: (alert: Omit<StockAlert, 'id' | 'createdAt' | 'triggerCount'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  triggerEvents: AlertTriggerEvent[];
  onTriggerTestAlert: () => void;
  onSelectStock: (stock: StockItem) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  stocks,
  alerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  triggerEvents,
  onTriggerTestAlert,
  onSelectStock,
  setActiveTab
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Alert Form state
  const [selectedTicker, setSelectedTicker] = useState<string>(stocks[0]?.ticker || 'BBCA');
  const [technicalIndicator, setTechnicalIndicator] = useState<'RSI' | 'MACD' | 'PRICE' | 'EMA' | 'VOLUME'>('RSI');
  const [technicalComparator, setTechnicalComparator] = useState<'<' | '>' | 'CROSS_UP' | 'CROSS_DOWN'>('<');
  const [technicalValue, setTechnicalValue] = useState<number>(35);

  const [useFundamentalCondition, setUseFundamentalCondition] = useState<boolean>(true);
  const [fundamentalMetric, setFundamentalMetric] = useState<'PER' | 'PBV' | 'ROE' | 'DER'>('DER');
  const [fundamentalComparator, setFundamentalComparator] = useState<'<' | '>'>('<');
  const [fundamentalValue, setFundamentalValue] = useState<number>(1.0);

  const [notificationChannel, setNotificationChannel] = useState<'IN_APP' | 'EMAIL' | 'BOTH'>('BOTH');
  const [emailRecipient, setEmailRecipient] = useState<string>('trader.idx@gmail.com');
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = stocks.find(s => s.ticker === selectedTicker);
    if (!stock) return;

    let conditionDesc = `${technicalIndicator} ${technicalComparator} ${technicalValue}`;
    if (useFundamentalCondition) {
      conditionDesc += ` DAN ${fundamentalMetric} ${fundamentalComparator} ${fundamentalValue}`;
    }

    onAddAlert({
      ticker: stock.ticker,
      name: stock.name,
      active: true,
      conditionDescription: conditionDesc,
      technicalCondition: {
        indicator: technicalIndicator,
        comparator: technicalComparator,
        thresholdValue: technicalValue
      },
      fundamentalCondition: useFundamentalCondition ? {
        metric: fundamentalMetric,
        comparator: fundamentalComparator,
        thresholdValue: fundamentalValue
      } : undefined,
      notificationType: notificationChannel,
      emailRecipient: notificationChannel !== 'IN_APP' ? emailRecipient : undefined
    });

    setShowCreateModal(false);
  };

  // Test Email dispatch via server route
  const handleTestEmailDispatch = async (ticker: string) => {
    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      const stock = stocks.find(s => s.ticker === ticker) || stocks[0];
      const res = await fetch('/api/alerts/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          stockTicker: stock.ticker,
          triggerPrice: stock.price,
          condition: `RSI(14) Oversold (<35) & DER < 1.0`
        })
      });
      const data = await res.json();
      setEmailStatusMsg(data.message || 'Email notifikasi berhasil dikirim!');
    } catch (err: any) {
      setEmailStatusMsg('Gagal mengirimkan simulasi email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Sistem Peringatan Dini (Early Warning System)</h2>
                <p className="text-xs text-slate-400">
                  Pantau kombinasi indikator teknikal & rasio fundamental secara otomatis dengan notifikasi in-app dan email.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onTriggerTestAlert}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition"
              title="Uji coba trigger audio & notifikasi visual"
            >
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Tes Sinyal Masuk</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:opacity-95 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Peringatan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Active Alerts (Left) + Triggered Events Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Active Alerts List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider">
              Daftar Aturan Peringatan Aktif ({alerts.length})
            </span>
            <span>Otomatis discan tiap tick harga baru</span>
          </div>

          {emailStatusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <span>{emailStatusMsg}</span>
              <button onClick={() => setEmailStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {alerts.length === 0 ? (
            <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-sans">Belum ada peringatan kustom yang dibuat.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold"
              >
                + Tambah Peringatan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-[#10141e] border rounded-2xl p-4 shadow-xl transition ${
                    alert.active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-white">
                        {alert.ticker}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{alert.ticker}</span>
                          <span className="text-xs text-slate-400 font-sans">{alert.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Dibuat: {alert.createdAt}</span>
                      </div>
                    </div>

                    {/* Status Toggle & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleAlert(alert.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                          alert.active 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {alert.active ? 'Aktif' : 'Dijeda'}
                      </button>

                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Hapus Peringatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Condition Details & Channels */}
                  <div className="pt-3 space-y-2 text-xs font-mono">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Kondisi Pemicu:</span>
                      <p className="text-cyan-300 font-semibold mt-0.5">{alert.conditionDescription}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>Saluran:</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          {(alert.notificationType === 'IN_APP' || alert.notificationType === 'BOTH') && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                              <Bell className="w-3 h-3" /> In-App
                            </span>
                          )}
                          {(alert.notificationType === 'EMAIL' || alert.notificationType === 'BOTH') && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Email ({alert.emailRecipient || 'aktif'})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Terpicu: <strong>{alert.triggerCount}x</strong></span>
                        {alert.notificationType !== 'IN_APP' && (
                          <button
                            onClick={() => handleTestEmailDispatch(alert.ticker)}
                            disabled={isSendingEmail}
                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <Send className="w-3 h-3" /> Tes Email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Triggered Alerts Feed Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Log Sinyal Terpicu (Live Event Feed)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Terakhir diperbarui</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {triggerEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  Belum ada sinyal yang terpicu hari ini.
                </div>
              ) : (
                triggerEvents.map((evt) => {
                  const stock = stocks.find(s => s.ticker === evt.ticker);

                  return (
                    <div 
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-sm">{evt.ticker}</span>
                          <span className="text-slate-400">Rp {evt.triggerPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{evt.timestamp}</span>
                      </div>

                      <p className="text-cyan-300 font-sans text-xs">{evt.message}</p>

                      {stock && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => {
                              onSelectStock(stock);
                              setActiveTab('dashboard');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <span>Buka Chart & Analisa</span>
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

      {/* Modal: Buat Peringatan Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#121722] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-800 bg-[#161c2b] flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Atur Peringatan Kustom Multi-Indikator</span>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="p-5 space-y-4 text-xs font-mono">
              {/* Ticker Selector */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Pilih Saham Target:</label>
                <select
                  value={selectedTicker}
                  onChange={(e) => setSelectedTicker(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  {stocks.map(s => (
                    <option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Technical Rule */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider block">
                  1. Kondisi Indikator Teknikal
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={technicalIndicator}
                    onChange={(e) => setTechnicalIndicator(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="RSI">RSI (14)</option>
                    <option value="MACD">MACD Line</option>
                    <option value="EMA">EMA Trend (9 & 20)</option>
                    <option value="VOLUME">Relative Volume (RVOL)</option>
                    <option value="PRICE">Harga Saham (IDR)</option>
                  </select>

                  <select
                    value={technicalComparator}
                    onChange={(e) => setTechnicalComparator(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="<">Kurang Dari (&lt;)</option>
                    <option value=">">Lebih Dari (&gt;)</option>
                    <option value="CROSS_UP">Cross Up (Golden Cross)</option>
                    <option value="CROSS_DOWN">Cross Down (Death Cross)</option>
                  </select>

                  <input
                    type="number"
                    value={technicalValue}
                    onChange={(e) => setTechnicalValue(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    placeholder="Nilai Ambang"
                  />
                </div>
              </div>

              {/* Fundamental Rule Combination */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                    2. Filter Fundamental (Opsional)
                  </span>
                  <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useFundamentalCondition}
                      onChange={(e) => setUseFundamentalCondition(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500"
                    />
                    <span>Aktifkan Kombinasi</span>
                  </label>
                </div>

                {useFundamentalCondition && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <select
                      value={fundamentalMetric}
                      onChange={(e) => setFundamentalMetric(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                    >
                      <option value="DER">Debt to Equity (DER)</option>
                      <option value="PER">P/E Ratio (PER)</option>
                      <option value="ROE">Return on Equity (ROE)</option>
                      <option value="PBV">Price to Book (PBV)</option>
                    </select>

                    <select
                      value={fundamentalComparator}
                      onChange={(e) => setFundamentalComparator(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                    >
                      <option value="<">Kurang Dari (&lt;)</option>
                      <option value=">">Lebih Dari (&gt;)</option>
                    </select>

                    <input
                      type="number"
                      step="0.1"
                      value={fundamentalValue}
                      onChange={(e) => setFundamentalValue(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Notification Channel */}
              <div className="space-y-2 pt-1">
                <label className="text-slate-400 font-semibold block">Saluran Pengiriman Notifikasi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'IN_APP', label: 'In-App Toast', icon: Bell },
                    { id: 'EMAIL', label: 'Email Saham', icon: Mail },
                    { id: 'BOTH', label: 'Keduanya (Rekomendasi)', icon: ShieldAlert },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <button
                        type="button"
                        key={ch.id}
                        onClick={() => setNotificationChannel(ch.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          notificationChannel === ch.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>

                {notificationChannel !== 'IN_APP' && (
                  <div className="pt-1 space-y-1">
                    <label className="text-slate-400 text-[10px] block">Alamat Email Penerima Notifikasi:</label>
                    <input
                      type="email"
                      required
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                      placeholder="contoh: trader@gmail.com"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:opacity-95 shadow-md shadow-amber-500/20"
                >
                  Simpan & Aktifkan Peringatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
