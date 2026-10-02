import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI on the server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API: Annisa AI In-depth Stock Analysis via Gemini API
app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { stockData } = req.body;
    if (!stockData || !stockData.ticker) {
      return res.status(400).json({ error: 'Data saham diperlukan untuk analisa.' });
    }

    const prompt = `
Anda adalah "Annisa AI" (Analisa Teknikal Saham AI), seorang Analis Kuantitatif & Teknikal Senior Pasar Modal Bursa Efek Indonesia (IDX) dengan sertifikasi WMI, CSA, dan CTA.

Lakukan analisa komprehensif, tajam, dan objektif dalam bahasa Indonesia untuk saham berikut:
- Kode Saham: ${stockData.ticker} (${stockData.name})
- Sektor: ${stockData.sector} (${stockData.subSector})
- Harga Saat Ini: Rp ${stockData.price} (Perubahan: ${stockData.changePct > 0 ? '+' : ''}${stockData.changePct}%)
- Indikator Teknikal:
  * EMA 9: Rp ${stockData.technicals?.ema9}, EMA 20: Rp ${stockData.technicals?.ema20}, EMA 50: Rp ${stockData.technicals?.ema50}, EMA 200: Rp ${stockData.technicals?.ema200}
  * RSI 14: ${stockData.technicals?.rsi14} (${stockData.technicals?.rsiStatus})
  * MACD: Line ${stockData.technicals?.macdLine}, Signal ${stockData.technicals?.macdSignal}, Status ${stockData.technicals?.macdTrend}
  * Relative Volume (RVOL): ${stockData.technicals?.rvol}x rata-rata 20 hari
  * Support 1: Rp ${stockData.technicals?.support1}, Resistance 1: Rp ${stockData.technicals?.resistance1}
- Metrik Fundamental:
  * P/E Ratio (PER): ${stockData.fundamentals?.per}x
  * PBV: ${stockData.fundamentals?.pbv}x
  * ROE: ${stockData.fundamentals?.roe}%
  * DER: ${stockData.fundamentals?.der}x
  * Dividend Yield: ${stockData.fundamentals?.dividendYield}%
  * Nilai Wajar (Fair Value): Rp ${stockData.fundamentals?.fairValue}
- Bandarmologi:
  * Status Akumulasi: ${stockData.bandar?.status} (Skor: ${stockData.bandar?.score}/100)
  * Net Foreign Flow 5 Hari: Rp ${stockData.bandar?.foreignNet5D} Miliar
  * Fase Wyckoff: ${stockData.bandar?.wyckoffPhase}

Harap berikan respon terstruktur dengan format Markdown yang rapi dan elegan, mencakup:
1. 🎯 **Executive Verdict & Rekomendasi Aksi** (Pilih satu: STRONG BUY, BUY ON BREAKOUT, BUY AREA, WAIT / PULLBACK, atau AVOID, sertakan skor keyakinan 1-100%).
2. 📊 **Bedah Struktur Teknikal & Price Action** (Analisa tren EMA, momentum RSI/MACD, dan validitas volume).
3. 💼 **Kesehatan Fundamental & Kelayakan Valuasi** (Kualitas laba ROE, solvabilitas DER, dan margin of safety).
4. 🐋 **Jejak Smart Money (Bandarmologi & Asing)** (Korelasi akumulasi bandar terhadap potensi kenaikan).
5. 🛡️ **Rencana Trading Taktis (Actionable Trading Plan)**:
   - Area Beli Disarankan (Entry Range)
   - Target Profit 1 (Konservatif)
   - Target Profit 2 (Optimis)
   - Level Cut Loss / Invalidation
   - Risk to Reward Ratio
6. ⚠️ **Faktor Risiko & Skenario Pembatalan (Catalyst Watch)**.

Gunakan gaya bahasa profesional, lugas, data-driven, dan sertakan catatan manajemen risiko.
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response && response.text) {
          return res.json({
            success: true,
            source: 'gemini-3.8-flash',
            analysis: response.text,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to quantitative analysis:', geminiError);
      }
    }

    // Graceful fallback if GEMINI_API_KEY is not configured or model is busy
    const fallbackAnalysis = `
### 🎯 Executive Verdict: ${stockData.verdict} (Keyakinan: ${stockData.aiScore}%)
Berdasarkan algoritma kuantitatif Annisa AI, **${stockData.ticker}** saat ini menunjukkan ${stockData.aiScore >= 75 ? 'kekuatan momentum yang sangat solid dengan dukungan partisipasi akumulasi bandar' : 'fase konsolidasi menunggu konfirmasi volume lanjutan'}.

---

### 📊 Bedah Struktur Teknikal & Price Action
- **Struktur Tren:** Harga saat ini di Rp ${stockData.price} berada ${stockData.price > stockData.technicals.ema200 ? 'di atas EMA 200 (Major Bullish Uptrend)' : 'di bawah EMA 200 (Fase Transisi/Konsolidasi Bawah)'}.
- **Momentum:** RSI 14 berada di level **${stockData.technicals.rsi14}**, mengindikasikan momentum ${stockData.technicals.rsiStatus}.
- **Konfirmasi Volume:** Relative Volume tercatat **${stockData.technicals.rvol}x** dari rata-rata 20 hari, ${stockData.technicals.rvol > 1.3 ? 'mengonfirmasi adanya akumulasi aktif oleh institusi' : 'menunjukkan likuiditas moderat'}.

---

### 💼 Kesehatan Fundamental & Kelayakan Valuasi
- **Profitabilitas:** ROE sebesar **${stockData.fundamentals.roe}%** mencerminkan tingkat efisiensi bisnis yang ${stockData.fundamentals.roe > 15 ? 'sangat prima di atas rata-rata industri' : 'cukup stabil'}.
- **Solvabilitas:** Debt-to-Equity Ratio (DER) sebesar **${stockData.fundamentals.der}x** tergolong ${stockData.fundamentals.der < 1.0 ? 'sangat sehat dengan beban utang bunga rendah' : 'perlu dipantau seiring siklus suku bunga'}.
- **Margin of Safety:** Diperdagangkan pada PER **${stockData.fundamentals.per}x** dengan estimasi Nilai Wajar di **Rp ${stockData.fundamentals.fairValue}** (Potensi Upside: ${stockData.fundamentals.undervaluedPct}%).

---

### 🐋 Jejak Smart Money & Bandarmologi
- **Status:** **${stockData.bandar.status}** (Skor Bandarmologi: ${stockData.bandar.score}/100).
- **Arus Asing:** Net foreign 5 hari terakhir tercatat akumulasi **Rp ${stockData.bandar.foreignNet5D} Miliar**.
- **Fase Siklus:** Berada pada **${stockData.bandar.wyckoffPhase}**.

---

### 🛡️ Rencana Trading Taktis (Actionable Plan)
- **Area Beli (Entry Range):** Rp ${stockData.tradingPlan.entryMin} - Rp ${stockData.tradingPlan.entryMax}
- **Target Profit 1 (TP1):** Rp ${stockData.tradingPlan.tp1}
- **Target Profit 2 (TP2):** Rp ${stockData.tradingPlan.tp2}
- **Stop Loss (SL):** Rp ${stockData.tradingPlan.stopLoss} (Ketat)
- **Risk to Reward Ratio:** 1 : ${stockData.tradingPlan.riskRewardRatio}

---

### ⚠️ Faktor Risiko & Katalis
Waspadai jika harga menembus ke bawah level support Rp ${stockData.technicals.support2} dengan lonjakan volume jual, yang dapat membatalkan skenario bullish jangka pendek.
`;

    return res.json({
      success: true,
      source: 'annisa-engine-fallback',
      analysis: fallbackAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error generating AI analysis:', err);
    return res.status(500).json({
      error: 'Gagal menghasilkan analisa AI.',
      details: err.message || String(err),
    });
  }
});

// API: Simulated Email Alert Dispatch
app.post('/api/alerts/test-email', async (req: Request, res: Response) => {
  const { recipientEmail, alertTitle, stockTicker, triggerPrice, condition } = req.body;
  
  if (!recipientEmail || !stockTicker) {
    return res.status(400).json({ error: 'Email penerima dan ticker diperlukan.' });
  }

  // Simulate instant email sending confirmation
  return res.json({
    success: true,
    message: `Notifikasi email peringatan dini berhasil dikirim ke ${recipientEmail}`,
    alertSummary: {
      ticker: stockTicker,
      price: triggerPrice,
      condition,
      dispatchedAt: new Date().toISOString(),
    },
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Annisa AI Server running on port ${PORT}`);
  });
}

startServer();
