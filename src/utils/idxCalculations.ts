import { OHLCVBar, TechnicalIndicators, FundamentalMetrics, BandarmologiData, SignalVerdict, StockItem, AiPriceProjection } from '../types/stock';

/**
 * Aturan Fraksi Harga Bursa Efek Indonesia (IDX Tick Size Rules)
 * Sesuai Surat Edaran Direksi PT Bursa Efek Indonesia
 */
export function getIdxTickSize(price: number): number {
  if (price < 200) return 1;
  if (price < 500) return 2;
  if (price < 2000) return 5;
  if (price < 5000) return 10;
  return 25;
}

/**
 * Membulatkan harga ke fraksi BEI terdekat
 */
export function roundToIdxTick(price: number, direction: 'nearest' | 'up' | 'down' = 'nearest'): number {
  if (price <= 50) return 50; // IDX floor limit
  const tick = getIdxTickSize(price);
  if (direction === 'up') {
    return Math.ceil(price / tick) * tick;
  }
  if (direction === 'down') {
    return Math.floor(price / tick) * tick;
  }
  return Math.round(price / tick) * tick;
}

/**
 * Hitung Batas Auto Rejection Atas (ARA) & Bawah (ARB) BEI
 * Simetris:
 * Rp 50 - Rp 200: ARA/ARB 35%
 * Rp 200 - Rp 5000: ARA/ARB 25%
 * > Rp 5000: ARA/ARB 20%
 */
export function getIdxAutoRejectionLimits(prevClose: number): { ara: number; arb: number } {
  let pct = 0.25;
  if (prevClose < 200) {
    pct = 0.35;
  } else if (prevClose <= 5000) {
    pct = 0.25;
  } else {
    pct = 0.20;
  }
  
  const rawAra = prevClose * (1 + pct);
  const rawArb = Math.max(50, prevClose * (1 - pct));

  return {
    ara: roundToIdxTick(rawAra, 'down'),
    arb: Math.max(50, roundToIdxTick(rawArb, 'up'))
  };
}

/**
 * Hitung Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(2));
}

/**
 * Hitung Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (data.length < period) return calculateSMA(data, data.length);
  const k = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(2));
}

/**
 * Hitung RSI (Relative Strength Index) 14 periode
 */
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(2));
}

/**
 * Hitung MACD (12, 26, 9)
 */
export function calculateMACD(closes: number[]): { macdLine: number; macdSignal: number; macdHistogram: number } {
  if (closes.length < 26) {
    return { macdLine: 0, macdSignal: 0, macdHistogram: 0 };
  }

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = Number((ema12 - ema26).toFixed(2));
  
  // Calculate series for signal line
  const macdSeries: number[] = [];
  for (let i = 26; i <= closes.length; i++) {
    const subCloses = closes.slice(0, i);
    const sub12 = calculateEMA(subCloses, 12);
    const sub26 = calculateEMA(subCloses, 26);
    macdSeries.push(sub12 - sub26);
  }

  const macdSignal = calculateEMA(macdSeries, 9);
  const macdHistogram = Number((macdLine - macdSignal).toFixed(2));

  return { macdLine, macdSignal, macdHistogram };
}

/**
 * Hitung Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(closes: number[], period: number = 20, multiplier: number = 2) {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 0;
    return { upper: last * 1.05, middle: last, lower: last * 0.95, bandwidth: 10 };
  }
  const slice = closes.slice(-period);
  const middle = calculateSMA(slice, period);
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = Number((middle + multiplier * stdDev).toFixed(2));
  const lower = Number(Math.max(50, middle - multiplier * stdDev).toFixed(2));
  const bandwidth = Number((((upper - lower) / middle) * 100).toFixed(2));
  return { upper, middle, lower, bandwidth };
}

/**
 * Hitung Average True Range (ATR 14)
 */
export function calculateATR(bars: OHLCVBar[], period: number = 14): number {
  if (bars.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const current = bars[i];
    const prev = bars[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }
  return calculateSMA(trs, Math.min(period, trs.length));
}

/**
 * Annisa AI Algorithmic Scoring Engine
 * Menghitung skor terpadu 0 - 100 berdasarkan:
 * 1. Technical Score (40%): Trend EMA, RSI, MACD, RVOL, S/R breakout
 * 2. Fundamental Score (30%): PER, PBV, ROE, DER, Dividend, Growth
 * 3. Bandarmologi Score (30%): Accumulation flow, Foreign Net, Wyckoff phase
 */
export function calculateAnnisaAiScore(
  technicals: TechnicalIndicators,
  fundamentals: FundamentalMetrics,
  bandar: BandarmologiData,
  currentPrice: number
): { score: number; verdict: SignalVerdict; reasoning: string[] } {
  const reasons: string[] = [];
  let techScore = 0;
  let fundScore = 0;
  let bandarScore = bandar.score; // 0 - 100

  // 1. Technical Evaluation (40 pts max)
  // Trend MA200 & EMA alignment
  if (currentPrice > technicals.ema200) {
    techScore += 8;
    reasons.push('Harga di atas EMA200 (Major Uptrend)');
  }
  if (technicals.ema9 > technicals.ema20 && technicals.ema20 > technicals.ema50) {
    techScore += 8;
    reasons.push('Struktur EMA 9/20/50 Bullish Aligned');
  } else if (technicals.ema9 > technicals.ema20) {
    techScore += 4;
  }

  // RSI Momentum
  if (technicals.rsi14 >= 48 && technicals.rsi14 <= 68) {
    techScore += 8;
    reasons.push(`RSI ${technicals.rsi14} berada di zona golden momentum`);
  } else if (technicals.rsi14 < 35) {
    techScore += 6;
    reasons.push(`RSI ${technicals.rsi14} oversold (potensi technical rebound)`);
  } else if (technicals.rsi14 > 75) {
    techScore += 2;
    reasons.push(`RSI ${technicals.rsi14} overbought (waspada profit taking)`);
  }

  // MACD Bullishness
  if (technicals.macdTrend === 'Golden Cross' || technicals.macdHistogram > 0) {
    techScore += 8;
    reasons.push('MACD menunjukkan momentum akumulasi positif');
  }

  // RVOL (Volume Confirmation)
  if (technicals.rvol >= 1.5) {
    techScore += 8;
    reasons.push(`Volume transaksi melonjak ${technicals.rvol.toFixed(1)}x rata-rata`);
  } else if (technicals.rvol >= 1.0) {
    techScore += 4;
  }

  // 2. Fundamental Evaluation (30 pts max)
  // ROE
  if (fundamentals.roe >= 15) {
    fundScore += 8;
    reasons.push(`Profitabilitas superior (ROE ${fundamentals.roe.toFixed(1)}%)`);
  } else if (fundamentals.roe >= 10) {
    fundScore += 5;
  }

  // Solvabilitas (DER)
  if (fundamentals.der <= 0.8) {
    fundScore += 7;
    reasons.push(`Neraca sangat sehat (DER rendah ${fundamentals.der.toFixed(2)}x)`);
  } else if (fundamentals.der <= 1.5) {
    fundScore += 4;
  }

  // Valuasi & Margin
  if (fundamentals.per > 0 && fundamentals.per <= 15) {
    fundScore += 8;
    reasons.push(`Valuasi menarik (PER ${fundamentals.per.toFixed(1)}x)`);
  } else if (fundamentals.per <= 22) {
    fundScore += 4;
  }

  // Dividend & Growth
  if (fundamentals.dividendYield >= 3.5) {
    fundScore += 7;
    reasons.push(`Dividen royal (Yield ${fundamentals.dividendYield.toFixed(1)}%)`);
  } else if (fundamentals.netProfitGrowthYoY > 10) {
    fundScore += 5;
    reasons.push(`Laba bertumbuh +${fundamentals.netProfitGrowthYoY.toFixed(1)}% YoY`);
  }

  // 3. Bandarmologi Evaluation (30 pts max)
  let bandarComponent = Math.round((bandarScore / 100) * 30);
  if (bandar.foreignNet5D > 10) {
    reasons.push(`Asing mencatatkan Net Buy akumulatif Rp ${bandar.foreignNet5D.toFixed(1)} Miliar`);
  }

  const finalScore = Math.min(100, Math.max(0, techScore + fundScore + bandarComponent));

  // Determine Signal Verdict
  let verdict: SignalVerdict = 'WAIT / PULLBACK';
  if (finalScore >= 82 && technicals.rvol >= 1.2) {
    verdict = 'STRONG BUY';
  } else if (finalScore >= 70) {
    if (currentPrice >= technicals.resistance1 * 0.98) {
      verdict = 'BUY ON BREAKOUT';
    } else {
      verdict = 'BUY AREA';
    }
  } else if (finalScore >= 55) {
    verdict = 'WAIT / PULLBACK';
  } else if (technicals.rsi14 > 78) {
    verdict = 'TAKE PROFIT';
  } else {
    verdict = 'AVOID / NEUTRAL';
  }

  return { score: finalScore, verdict, reasoning: reasons };
}

/**
 * Risk Management & Position Sizing Calculator (Fraksi BEI compliant)
 */
export function calculatePositionSizing(
  totalCapital: number,
  riskTolerancePct: number, // e.g. 1% or 2%
  entryPrice: number,
  stopLossPrice: number,
  targetPrice: number
) {
  const tick = getIdxTickSize(entryPrice);
  const roundedEntry = roundToIdxTick(entryPrice, 'nearest');
  const roundedSL = Math.min(roundedEntry - tick, roundToIdxTick(stopLossPrice, 'down'));
  const roundedTP = Math.max(roundedEntry + tick, roundToIdxTick(targetPrice, 'up'));

  const maxRiskIDR = totalCapital * (riskTolerancePct / 100);
  const riskPerShare = Math.max(tick, roundedEntry - roundedSL);
  const riskPerLot = riskPerShare * 100; // 1 Lot = 100 Lembar di IDX

  let calculatedLots = Math.floor(maxRiskIDR / riskPerLot);
  // Max allocation limit 30% of total capital per position for safety
  const maxLotsByCapital = Math.floor((totalCapital * 0.35) / (roundedEntry * 100));
  const finalLots = Math.max(1, Math.min(calculatedLots, maxLotsByCapital));

  const totalInvestment = finalLots * 100 * roundedEntry;
  const potentialLoss = finalLots * 100 * (roundedEntry - roundedSL);
  const potentialGain = finalLots * 100 * (roundedTP - roundedEntry);
  const riskRewardRatio = Number(((roundedTP - roundedEntry) / (roundedEntry - roundedSL)).toFixed(2));

  return {
    entryPrice: roundedEntry,
    stopLossPrice: roundedSL,
    targetPrice: roundedTP,
    lots: finalLots,
    shares: finalLots * 100,
    totalInvestment,
    potentialLoss,
    potentialGain,
    riskRewardRatio,
    riskPct: Number(((potentialLoss / totalCapital) * 100).toFixed(2))
  };
}

/**
 * Format IDR Rupiah
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format Big Numbers (Miliar / Triliun)
 */
export function formatCompactIDR(valueInBillion: number): string {
  if (Math.abs(valueInBillion) >= 1000) {
    return `${(valueInBillion / 1000).toFixed(2)} T`;
  }
  return `${valueInBillion.toFixed(1)} M`;
}

/**
 * AI-Driven Short-Term Price Range Projection Engine
 * Memproyeksikan rentang target harga 5 - 10 hari bursa ke depan berbasis
 * momentum (RSI, MACD, RVOL, ATR, dan partisipasi smart money bandar).
 */
export function calculateAiPriceProjection(stock: StockItem): AiPriceProjection {
  const { price, technicals, bandar, araPrice, arbPrice } = stock;
  const tick = getIdxTickSize(price);
  const atr = Math.max(tick * 2, technicals.atr14);

  // Momentum factors (-1.0 to +1.0)
  let momentumFactor = 0;
  let driver = '';

  // 1. RSI Golden Momentum
  if (technicals.rsi14 >= 50 && technicals.rsi14 <= 68) {
    momentumFactor += 0.35;
    driver = `RSI (${technicals.rsi14}) di zona golden expansion momentum`;
  } else if (technicals.rsi14 > 75) {
    momentumFactor -= 0.15;
    driver = `RSI (${technicals.rsi14}) overbought, waspada profit taking`;
  } else if (technicals.rsi14 < 35) {
    momentumFactor += 0.25;
    driver = `RSI (${technicals.rsi14}) oversold, potensi technical mean-reversion`;
  }

  // 2. MACD Histogram Velocity
  if (technicals.macdHistogram > 0) {
    momentumFactor += 0.25;
  } else if (technicals.macdHistogram < 0) {
    momentumFactor -= 0.20;
  }

  // 3. Volume Spike (RVOL)
  if (technicals.rvol >= 1.4) {
    momentumFactor += 0.25;
    driver = `Lonjakan volume (${technicals.rvol.toFixed(1)}x) mengonfirmasi dorongan momentum`;
  }

  // 4. Bandarmologi Accumulation Support
  if (bandar.score >= 75) {
    momentumFactor += 0.25;
    driver = `Akumulasi smart money (${bandar.score}/100) menjaga struktur support`;
  } else if (bandar.score <= 45) {
    momentumFactor -= 0.25;
    driver = `Distribusi broker institusi menekan momentum jangka pendek`;
  }

  // Direction classification & multipliers
  let direction: AiPriceProjection['direction'] = 'NEUTRAL';
  let targetMultiplierUpside = 1.8;
  let targetMultiplierDownside = 1.0;
  let confidencePct = 78;

  if (momentumFactor >= 0.5) {
    direction = 'BULLISH';
    targetMultiplierUpside = 2.8;
    targetMultiplierDownside = 0.8;
    confidencePct = Math.min(94, Math.round(75 + stock.aiScore * 0.2));
  } else if (momentumFactor >= 0.15) {
    direction = 'MODERATE_BULLISH';
    targetMultiplierUpside = 2.0;
    targetMultiplierDownside = 1.0;
    confidencePct = Math.min(88, Math.round(72 + stock.aiScore * 0.16));
  } else if (momentumFactor <= -0.2) {
    direction = 'PULLBACK';
    targetMultiplierUpside = 0.8;
    targetMultiplierDownside = 2.2;
    confidencePct = 76;
  }

  const rawMin = Math.max(arbPrice, price - (atr * targetMultiplierDownside));
  const rawMax = Math.min(araPrice, price + (atr * targetMultiplierUpside));
  const minPrice = roundToIdxTick(rawMin, 'down');
  const maxPrice = roundToIdxTick(rawMax, 'up');
  const targetMid = roundToIdxTick((minPrice + maxPrice) / 2, 'nearest');

  const expectedChangeMinPct = Number((((minPrice - price) / price) * 100).toFixed(1));
  const expectedChangeMaxPct = Number((((maxPrice - price) / price) * 100).toFixed(1));
  const momentumScore = Math.min(100, Math.max(10, Math.round(50 + momentumFactor * 45)));

  return {
    minPrice,
    maxPrice,
    targetMid,
    direction,
    expectedChangeMinPct,
    expectedChangeMaxPct,
    confidencePct,
    horizonDays: '5 - 10 Hari Bursa',
    primaryDriver: driver || 'Kombinasi multi-faktor indikator teknikal & volume IDX',
    momentumScore,
    volatilityBand: `ATR(14) Rp ${atr}`
  };
}
