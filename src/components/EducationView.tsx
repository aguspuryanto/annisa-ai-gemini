import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Calculator,
  Compass
} from 'lucide-react';
import { TECHNICAL_GUIDES, FUNDAMENTAL_GUIDES, KILLER_RECIPES, KillerRecipe } from '../utils/educationContent';
import { ActiveTab } from './Header';

interface EducationViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onApplyPresetToScreener: (recipe: KillerRecipe) => void;
}

export const EducationView: React.FC<EducationViewProps> = ({
  setActiveTab,
  onApplyPresetToScreener,
}) => {
  const [activeCategory, setActiveCategory] = useState<'RECIPES' | 'TECHNICAL' | 'FUNDAMENTAL' | 'RISK_RULES'>('RECIPES');

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Akademi Saham Annisa AI</h2>
                <p className="text-xs text-slate-400">
                  Panduan komprehensif indikator teknikal, rasio fundamental, manajemen risiko fraksi BEI, dan strategi kombinasi jitu.
                </p>
              </div>
            </div>
          </div>

          {/* Category Switcher Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            {[
              { id: 'RECIPES', label: '🎯 Resep Strategi Unggulan' },
              { id: 'TECHNICAL', label: '📈 Indikator Teknikal' },
              { id: 'FUNDAMENTAL', label: '💼 Metrik Fundamental' },
              { id: 'RISK_RULES', label: '💡 Risiko & Fraksi BEI' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category 1: Killer Recipes (Strategi Kombinasi) */}
      {activeCategory === 'RECIPES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider">
              Formula Strategi Unggulan (Killer Recipes)
            </span>
            <span>Siap diaplikasikan langsung ke filter Screener</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {KILLER_RECIPES.map((recipe) => (
              <div 
                key={recipe.id}
                className="bg-[#10141e] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 transition"
              >
                <div className="space-y-3">
                  {/* Badge & Target Trader */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase">
                      {recipe.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{recipe.targetTrader}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-mono tracking-tight">{recipe.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{recipe.description}</p>

                  {/* Criteria Grid */}
                  <div className="space-y-2 pt-2 text-xs font-mono">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-cyan-400 uppercase font-bold block">Kriteria Teknikal:</span>
                      <ul className="space-y-1 text-slate-300">
                        {recipe.criteriaTechnical.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Kriteria Fundamental:</span>
                      <ul className="space-y-1 text-slate-300">
                        {recipe.criteriaFundamental.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Entry & Exit Rules */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Aturan Beli (Entry):</span>
                      <p className="text-slate-300 mt-0.5">{recipe.entryRule}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">Aturan Jual (Exit):</span>
                      <p className="text-slate-300 mt-0.5">{recipe.exitRule}</p>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onApplyPresetToScreener(recipe);
                      setActiveTab('screener');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-slate-950 font-bold text-xs hover:opacity-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Terapkan Kriteria Ini di Screener</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category 2: Technical Indicators Encyclopedia */}
      {activeCategory === 'TECHNICAL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TECHNICAL_GUIDES.map((guide) => (
              <div key={guide.id} className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-base font-bold text-cyan-300 font-mono">{guide.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase font-mono">
                    Teknikal
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{guide.shortDesc}</p>

                {/* Formula */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Rumus Matematika:</span>
                  {guide.formula}
                </div>

                {/* Interpretation */}
                <div className="text-xs text-slate-400 font-sans leading-relaxed">
                  <strong className="text-slate-200 block mb-0.5 font-mono text-[11px]">Interpretasi Nilai:</strong>
                  {guide.interpretation}
                </div>

                {/* Bullish vs Bearish */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Sinyal Bullish:</span>
                    <p className="text-[11px] mt-0.5">{guide.bullishSignal}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Sinyal Bearish:</span>
                    <p className="text-[11px] mt-0.5">{guide.bearishSignal}</p>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                  <span className="text-[10px] text-amber-400 uppercase font-bold font-mono block">💡 Tips & Praktik Terbaik:</span>
                  <ul className="space-y-1 text-slate-300 font-sans text-xs">
                    {guide.bestPractices.map((bp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category 3: Fundamental Metrics Encyclopedia */}
      {activeCategory === 'FUNDAMENTAL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FUNDAMENTAL_GUIDES.map((guide) => (
              <div key={guide.id} className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-base font-bold text-emerald-400 font-mono">{guide.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase font-mono">
                    Fundamental
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{guide.shortDesc}</p>

                {/* Formula */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Rumus Perhitungan:</span>
                  {guide.formula}
                </div>

                {/* Interpretation */}
                <div className="text-xs text-slate-400 font-sans leading-relaxed">
                  <strong className="text-slate-200 block mb-0.5 font-mono text-[11px]">Interpretasi Rasio:</strong>
                  {guide.interpretation}
                </div>

                {/* Bullish vs Bearish */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Kondisi Sehat / Undervalued:</span>
                    <p className="text-[11px] mt-0.5">{guide.bullishSignal}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Tanda Bahaya (Red Flag):</span>
                    <p className="text-[11px] mt-0.5">{guide.bearishSignal}</p>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                  <span className="text-[10px] text-amber-400 uppercase font-bold font-mono block">💡 Tips Analisa Fundamental:</span>
                  <ul className="space-y-1 text-slate-300 font-sans text-xs">
                    {guide.bestPractices.map((bp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category 4: Risk Rules & IDX Tick Sizes */}
      {activeCategory === 'RISK_RULES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* IDX Tick Sizes Table Card */}
            <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Aturan Fraksi Harga Bursa Efek Indonesia (IDX)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Sesuai Surat Edaran Direksi PT BEI untuk menjaga keteraturan dan likuiditas perdagangan saham.
                </p>
              </div>

              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="py-2">Kelompok Harga</th>
                    <th className="py-2 text-center">Fraksi (Tick)</th>
                    <th className="py-2 text-right">Batas ARA/ARB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-semibold text-slate-200">{'<'} Rp 200</td>
                    <td className="py-2.5 text-center font-bold text-cyan-300">Rp 1</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">35% Simetris</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-semibold text-slate-200">Rp 200 - Rp 500</td>
                    <td className="py-2.5 text-center font-bold text-cyan-300">Rp 2</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">25% Simetris</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-semibold text-slate-200">Rp 500 - Rp 2.000</td>
                    <td className="py-2.5 text-center font-bold text-cyan-300">Rp 5</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">25% Simetris</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-semibold text-slate-200">Rp 2.000 - Rp 5.000</td>
                    <td className="py-2.5 text-center font-bold text-cyan-300">Rp 10</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">25% Simetris</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-semibold text-slate-200">{'>'} Rp 5.000</td>
                    <td className="py-2.5 text-center font-bold text-cyan-300">Rp 25</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">20% Simetris</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-bold text-slate-200">Catatan Order:</p>
                <p>Setiap order beli atau jual di luar fraksi harga kelipatan resmi akan ditolak otomatis oleh JATS (Jakarta Automated Trading System).</p>
              </div>
            </div>

            {/* The 1-2% Golden Rule of Capital Protection */}
            <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Aturan Emas 1-2% Pengendalian Risiko
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  Prinsip bertahan hidup trader profesional agar akun tidak pernah mengalami kehancuran modal (ruin).
                </p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Rumus Ukuran Posisi (Lot):</span>
                  <div className="text-sm font-black text-white">
                    Jumlah Lot = (Modal x Toleransi Risiko %) / ((Harga Beli - Cut Loss) x 100)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-slate-300 font-sans leading-relaxed">
                  <p>
                    <strong>Contoh Kasus:</strong> Jika total modal Anda Rp 50.000.000 dengan toleransi risiko 2% (Rp 1.000.000), dan Anda ingin membeli BBCA di Rp 9.800 dengan Stop Loss di Rp 9.400:
                  </p>
                  <ul className="list-disc pl-5 font-mono text-xs text-cyan-300 space-y-1">
                    <li>Risiko per lembar = Rp 9.800 - Rp 9.400 = Rp 400</li>
                    <li>Risiko per lot (100 lembar) = Rp 40.000</li>
                    <li>Maksimal lot aman = Rp 1.000.000 / Rp 40.000 = <strong>25 Lot</strong></li>
                  </ul>
                  <p className="text-[11px] text-slate-400">
                    Dengan metode ini, bahkan jika skenario terburuk terjadi dan harga menyentuh Stop Loss, kerugian Anda tetap terkunci presisi di 2% modal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
