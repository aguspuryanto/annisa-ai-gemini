import { StockItem, OHLCVBar, OrderBookLevel, Sector, WyckoffPhase, AccumulationStatus } from '../types/stock';
import { 
  getIdxTickSize, 
  getIdxAutoRejectionLimits, 
  calculateEMA, 
  calculateSMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands, 
  calculateATR, 
  calculateAnnisaAiScore,
  roundToIdxTick
} from '../utils/idxCalculations';

// Helper to generate realistic historical OHLCV data ending at the current price
function generateHistoricalBars(
  ticker: string, 
  currentPrice: number, 
  volatility: number, 
  trendBias: number, 
  days: number = 180
): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  const now = new Date();
  
  // Work backwards from currentPrice
  let tempPrice = currentPrice;
  const tempBars: { open: number; high: number; low: number; close: number; volume: number }[] = [];

  // Seeded random based on ticker string
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = (seed * 31 + ticker.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  for (let i = 0; i < days; i++) {
    const changePct = (pseudoRandom() - 0.485 + trendBias * 0.05) * volatility;
    const prevClose = tempPrice / (1 + changePct);
    const dayHigh = Math.max(tempPrice, prevClose) * (1 + pseudoRandom() * 0.015);
    const dayLow = Math.min(tempPrice, prevClose) * (1 - pseudoRandom() * 0.015);
    const dayOpen = prevClose * (1 + (pseudoRandom() - 0.5) * 0.01);
    const volume = Math.floor(1000000 + pseudoRandom() * 8000000);

    tempBars.unshift({
      open: roundToIdxTick(dayOpen),
      high: roundToIdxTick(dayHigh, 'up'),
      low: Math.max(50, roundToIdxTick(dayLow, 'down')),
      close: roundToIdxTick(tempPrice),
      volume
    });

    tempPrice = prevClose;
  }

  // Assign dates (skipping weekends)
  let dateCounter = new Date(now);
  dateCounter.setDate(dateCounter.getDate() - (days * 1.4));

  for (let i = 0; i < tempBars.length; i++) {
    while (dateCounter.getDay() === 0 || dateCounter.getDay() === 6) {
      dateCounter.setDate(dateCounter.getDate() + 1);
    }
    const isoDate = dateCounter.toISOString().split('T')[0];
    bars.push({
      time: isoDate,
      timestamp: dateCounter.getTime(),
      ...tempBars[i]
    });
    dateCounter.setDate(dateCounter.getDate() + 1);
  }

  // Force the last bar to match currentPrice
  if (bars.length > 0) {
    bars[bars.length - 1].close = currentPrice;
  }

  return bars;
}

// Generate realistic 10-level Bid-Offer Order Book
function generateOrderBook(currentPrice: number, tick: number): OrderBookLevel[] {
  const levels: OrderBookLevel[] = [];
  for (let i = 0; i < 10; i++) {
    const bidPrice = Math.max(50, currentPrice - (i * tick));
    const offerPrice = currentPrice + ((i + 1) * tick);
    
    // Deeper levels often have bigger walls
    const depthMultiplier = 1 + (i * 0.25);
    const bidVol = Math.floor((1500 + Math.random() * 4500) * depthMultiplier);
    const offerVol = Math.floor((1200 + Math.random() * 4200) * depthMultiplier);

    levels.push({
      price: bidPrice,
      bidVol,
      bidCount: Math.floor(25 + Math.random() * 80),
      offerVol,
      offerCount: Math.floor(20 + Math.random() * 75)
    });
  }
  return levels;
}

// Raw Stock Definition Prototype
interface StockSeed {
  ticker: string;
  name: string;
  sector: Sector;
  subSector: string;
  price: number;
  prevClose: number;
  volume: number;
  valueBillion: number;
  high52w: number;
  low52w: number;
  trendBias: number;
  volatility: number;
  // Fundamental
  per: number;
  pbv: number;
  roe: number;
  roa: number;
  der: number;
  eps: number;
  npm: number;
  opm: number;
  revGrowth: number;
  netGrowth: number;
  divYield: number;
  payout: number;
  marketCapT: number;
  freeFloat: number;
  fairValue: number;
  // Bandarmologi
  bandarScore: number;
  bandarStatus: AccumulationStatus;
  foreign1D: number;
  foreign5D: number;
  foreign20D: number;
  topBuyers: string[];
  topSellers: string[];
  wyckoff: WyckoffPhase;
}

const STOCK_SEEDS: StockSeed[] = [
  {
    ticker: 'BBCA',
    name: 'Bank Central Asia Tbk.',
    sector: 'Financials',
    subSector: 'Banks',
    price: 9850,
    prevClose: 9750,
    volume: 85200000,
    valueBillion: 835.4,
    high52w: 10450,
    low52w: 8800,
    trendBias: 0.08,
    volatility: 0.016,
    per: 21.2,
    pbv: 4.6,
    roe: 23.4,
    roa: 3.8,
    der: 0.15,
    eps: 464,
    npm: 42.1,
    opm: 54.3,
    revGrowth: 11.2,
    netGrowth: 14.8,
    divYield: 2.8,
    payout: 60.0,
    marketCapT: 1214.2,
    freeFloat: 45.2,
    fairValue: 10800,
    bandarScore: 88,
    bandarStatus: 'Big Accumulation',
    foreign1D: 245.8,
    foreign5D: 812.4,
    foreign20D: 2150.0,
    topBuyers: ['ZP (Maybank)', 'AK (UBS)', 'CS (Credit Suisse)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'NI (BNI Sekuritas)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'BBRI',
    name: 'Bank Rakyat Indonesia (Persero) Tbk.',
    sector: 'Financials',
    subSector: 'Banks',
    price: 4880,
    prevClose: 4800,
    volume: 142000000,
    valueBillion: 692.9,
    high52w: 6350,
    low52w: 4620,
    trendBias: 0.02,
    volatility: 0.022,
    per: 11.8,
    pbv: 2.3,
    roe: 20.8,
    roa: 3.1,
    der: 0.22,
    eps: 413,
    npm: 32.5,
    opm: 44.0,
    revGrowth: 9.8,
    netGrowth: 12.1,
    divYield: 6.8,
    payout: 80.0,
    marketCapT: 739.5,
    freeFloat: 46.8,
    fairValue: 5600,
    bandarScore: 82,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 128.5,
    foreign5D: 430.2,
    foreign20D: 940.0,
    topBuyers: ['RX (Macquarie)', 'KZ (CLSA)', 'BK (JPMorgan)'],
    topSellers: ['CC (Mandiri)', 'XC (Ajaib)', 'XL (Stockbit)'],
    wyckoff: 'Phase C (Spring / Shakeout)'
  },
  {
    ticker: 'BMRI',
    name: 'Bank Mandiri (Persero) Tbk.',
    sector: 'Financials',
    subSector: 'Banks',
    price: 6525,
    prevClose: 6425,
    volume: 98000000,
    valueBillion: 639.4,
    high52w: 7450,
    low52w: 5750,
    trendBias: 0.06,
    volatility: 0.018,
    per: 10.4,
    pbv: 2.1,
    roe: 21.6,
    roa: 2.9,
    der: 0.18,
    eps: 627,
    npm: 36.4,
    opm: 48.2,
    revGrowth: 12.5,
    netGrowth: 16.3,
    divYield: 5.4,
    payout: 60.0,
    marketCapT: 609.0,
    freeFloat: 40.0,
    fairValue: 7400,
    bandarScore: 85,
    bandarStatus: 'Big Accumulation',
    foreign1D: 185.0,
    foreign5D: 590.0,
    foreign20D: 1420.0,
    topBuyers: ['AK (UBS)', 'ZP (Maybank)', 'BK (JPMorgan)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'LG (Trimegah)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'BBNI',
    name: 'Bank Negara Indonesia (Persero) Tbk.',
    sector: 'Financials',
    subSector: 'Banks',
    price: 5200,
    prevClose: 5125,
    volume: 64000000,
    valueBillion: 332.8,
    high52w: 6150,
    low52w: 4500,
    trendBias: 0.04,
    volatility: 0.021,
    per: 8.9,
    pbv: 1.25,
    roe: 15.2,
    roa: 2.1,
    der: 0.28,
    eps: 584,
    npm: 29.8,
    opm: 39.5,
    revGrowth: 8.4,
    netGrowth: 11.2,
    divYield: 5.6,
    payout: 50.0,
    marketCapT: 193.9,
    freeFloat: 40.0,
    fairValue: 6200,
    bandarScore: 78,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 72.4,
    foreign5D: 210.0,
    foreign20D: 540.0,
    topBuyers: ['CS (Credit Suisse)', 'RX (Macquarie)', 'KZ (CLSA)'],
    topSellers: ['CC (Mandiri)', 'YP (Mirae)', 'XC (Ajaib)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'ASII',
    name: 'Astra International Tbk.',
    sector: 'Consumer Cyclicals',
    subSector: 'Automotive & Heavy Equipment',
    price: 5050,
    prevClose: 4980,
    volume: 72000000,
    valueBillion: 363.6,
    high52w: 5900,
    low52w: 4400,
    trendBias: 0.01,
    volatility: 0.019,
    per: 6.8,
    pbv: 0.98,
    roe: 16.5,
    roa: 8.2,
    der: 0.42,
    eps: 742,
    npm: 10.2,
    opm: 13.8,
    revGrowth: 6.1,
    netGrowth: 8.9,
    divYield: 8.4,
    payout: 58.0,
    marketCapT: 204.4,
    freeFloat: 49.8,
    fairValue: 6100,
    bandarScore: 74,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 48.2,
    foreign5D: 185.0,
    foreign20D: 410.0,
    topBuyers: ['ZP (Maybank)', 'BK (JPMorgan)', 'AK (UBS)'],
    topSellers: ['PD (Indo Premier)', 'YP (Mirae)', 'NI (BNI)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'TLKM',
    name: 'Telkom Indonesia (Persero) Tbk.',
    sector: 'Infrastructures',
    subSector: 'Telecommunication Services',
    price: 2920,
    prevClose: 2880,
    volume: 110000000,
    valueBillion: 321.2,
    high52w: 4050,
    low52w: 2720,
    trendBias: -0.01,
    volatility: 0.024,
    per: 12.1,
    pbv: 2.1,
    roe: 17.8,
    roa: 8.5,
    der: 0.88,
    eps: 241,
    npm: 16.8,
    opm: 31.5,
    revGrowth: 4.2,
    netGrowth: 5.8,
    divYield: 5.9,
    payout: 75.0,
    marketCapT: 289.2,
    freeFloat: 47.9,
    fairValue: 3500,
    bandarScore: 71,
    bandarStatus: 'Neutral',
    foreign1D: 34.0,
    foreign5D: 95.0,
    foreign20D: -120.0,
    topBuyers: ['RX (Macquarie)', 'KZ (CLSA)', 'ZP (Maybank)'],
    topSellers: ['BK (JPMorgan)', 'YP (Mirae)', 'CC (Mandiri)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'ADRO',
    name: 'Adaro Energy Indonesia Tbk.',
    sector: 'Energy',
    subSector: 'Thermal Coal',
    price: 3720,
    prevClose: 3620,
    volume: 135000000,
    valueBillion: 502.2,
    high52w: 3990,
    low52w: 2350,
    trendBias: 0.09,
    volatility: 0.026,
    per: 4.2,
    pbv: 0.95,
    roe: 24.2,
    roa: 16.5,
    der: 0.25,
    eps: 885,
    npm: 28.5,
    opm: 38.2,
    revGrowth: -3.5,
    netGrowth: 4.1,
    divYield: 14.5,
    payout: 65.0,
    marketCapT: 118.9,
    freeFloat: 43.5,
    fairValue: 4300,
    bandarScore: 91,
    bandarStatus: 'Big Accumulation',
    foreign1D: 195.4,
    foreign5D: 640.0,
    foreign20D: 1820.0,
    topBuyers: ['BK (JPMorgan)', 'AK (UBS)', 'ZP (Maybank)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'XC (Ajaib)'],
    wyckoff: 'Phase E (Markup / Trend Run)'
  },
  {
    ticker: 'PTBA',
    name: 'Bukit Asam Tbk.',
    sector: 'Energy',
    subSector: 'Thermal Coal',
    price: 2860,
    prevClose: 2810,
    volume: 48000000,
    valueBillion: 137.2,
    high52w: 3150,
    low52w: 2320,
    trendBias: 0.03,
    volatility: 0.022,
    per: 6.2,
    pbv: 1.48,
    roe: 23.5,
    roa: 14.8,
    der: 0.38,
    eps: 461,
    npm: 22.4,
    opm: 29.8,
    revGrowth: 5.1,
    netGrowth: 7.2,
    divYield: 12.8,
    payout: 85.0,
    marketCapT: 32.9,
    freeFloat: 34.1,
    fairValue: 3300,
    bandarScore: 80,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 28.5,
    foreign5D: 110.0,
    foreign20D: 280.0,
    topBuyers: ['RX (Macquarie)', 'KZ (CLSA)', 'CC (Mandiri)'],
    topSellers: ['YP (Mirae)', 'XL (Stockbit)', 'PD (Indo Premier)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'BREN',
    name: 'Barito Renewables Energy Tbk.',
    sector: 'Infrastructures',
    subSector: 'Renewable Electricity',
    price: 6950,
    prevClose: 6700,
    volume: 165000000,
    valueBillion: 1146.7,
    high52w: 12100,
    low52w: 4800,
    trendBias: 0.12,
    volatility: 0.048,
    per: 245.0,
    pbv: 95.0,
    roe: 38.5,
    roa: 9.8,
    der: 2.10,
    eps: 28,
    npm: 34.0,
    opm: 52.0,
    revGrowth: 18.5,
    netGrowth: 22.0,
    divYield: 0.4,
    payout: 40.0,
    marketCapT: 930.0,
    freeFloat: 11.5,
    fairValue: 3500,
    bandarScore: 89,
    bandarStatus: 'Big Accumulation',
    foreign1D: 310.0,
    foreign5D: 950.0,
    foreign20D: 2400.0,
    topBuyers: ['BK (JPMorgan)', 'AK (UBS)', 'CS (Credit Suisse)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'CC (Mandiri)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'AMMN',
    name: 'Amman Mineral Internasional Tbk.',
    sector: 'Basic Materials',
    subSector: 'Copper & Gold Mining',
    price: 8950,
    prevClose: 8750,
    volume: 52000000,
    valueBillion: 465.4,
    high52w: 14500,
    low52w: 6800,
    trendBias: 0.05,
    volatility: 0.035,
    per: 42.0,
    pbv: 8.5,
    roe: 22.0,
    roa: 11.5,
    der: 0.95,
    eps: 213,
    npm: 26.5,
    opm: 41.0,
    revGrowth: 28.5,
    netGrowth: 35.0,
    divYield: 0.8,
    payout: 35.0,
    marketCapT: 649.0,
    freeFloat: 17.5,
    fairValue: 9500,
    bandarScore: 83,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 85.0,
    foreign5D: 290.0,
    foreign20D: 850.0,
    topBuyers: ['ZP (Maybank)', 'RX (Macquarie)', 'AK (UBS)'],
    topSellers: ['YP (Mirae)', 'XC (Ajaib)', 'PD (Indo Premier)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'ANTM',
    name: 'Aneka Tambang Tbk.',
    sector: 'Basic Materials',
    subSector: 'Precious Metals & Minerals',
    price: 1545,
    prevClose: 1510,
    volume: 185000000,
    valueBillion: 285.8,
    high52w: 1850,
    low52w: 1220,
    trendBias: 0.07,
    volatility: 0.032,
    per: 13.5,
    pbv: 1.45,
    roe: 11.2,
    roa: 7.8,
    der: 0.35,
    eps: 114,
    npm: 6.8,
    opm: 11.2,
    revGrowth: 15.2,
    netGrowth: 18.0,
    divYield: 4.8,
    payout: 65.0,
    marketCapT: 37.1,
    freeFloat: 35.0,
    fairValue: 1850,
    bandarScore: 86,
    bandarStatus: 'Big Accumulation',
    foreign1D: 64.2,
    foreign5D: 225.0,
    foreign20D: 680.0,
    topBuyers: ['AK (UBS)', 'KZ (CLSA)', 'ZP (Maybank)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'XL (Stockbit)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'ICBP',
    name: 'Indofood CBP Sukses Makmur Tbk.',
    sector: 'Consumer Non-Cyclicals',
    subSector: 'Packaged Foods & Meats',
    price: 11850,
    prevClose: 11725,
    volume: 18500000,
    valueBillion: 219.2,
    high52w: 12650,
    low52w: 10100,
    trendBias: 0.04,
    volatility: 0.015,
    per: 14.8,
    pbv: 2.8,
    roe: 19.5,
    roa: 8.9,
    der: 0.82,
    eps: 800,
    npm: 13.5,
    opm: 21.0,
    revGrowth: 7.8,
    netGrowth: 12.5,
    divYield: 3.8,
    payout: 50.0,
    marketCapT: 138.2,
    freeFloat: 19.5,
    fairValue: 13200,
    bandarScore: 84,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 42.0,
    foreign5D: 165.0,
    foreign20D: 520.0,
    topBuyers: ['BK (JPMorgan)', 'ZP (Maybank)', 'CS (Credit Suisse)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'CC (Mandiri)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'INDF',
    name: 'Indofood Sukses Makmur Tbk.',
    sector: 'Consumer Non-Cyclicals',
    subSector: 'Agricultural Products & Food',
    price: 7125,
    prevClose: 7025,
    volume: 24000000,
    valueBillion: 171.0,
    high52w: 7550,
    low52w: 6050,
    trendBias: 0.03,
    volatility: 0.016,
    per: 6.8,
    pbv: 0.95,
    roe: 14.2,
    roa: 6.5,
    der: 0.98,
    eps: 1047,
    npm: 8.8,
    opm: 16.5,
    revGrowth: 6.2,
    netGrowth: 9.8,
    divYield: 4.2,
    payout: 40.0,
    marketCapT: 62.6,
    freeFloat: 49.9,
    fairValue: 8400,
    bandarScore: 79,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 24.5,
    foreign5D: 85.0,
    foreign20D: 290.0,
    topBuyers: ['RX (Macquarie)', 'AK (UBS)', 'KZ (CLSA)'],
    topSellers: ['PD (Indo Premier)', 'YP (Mirae)', 'XL (Stockbit)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'UNVR',
    name: 'Unilever Indonesia Tbk.',
    sector: 'Consumer Non-Cyclicals',
    subSector: 'Personal Care & Household Products',
    price: 2420,
    prevClose: 2460,
    volume: 52000000,
    valueBillion: 125.8,
    high52w: 3950,
    low52w: 2280,
    trendBias: -0.06,
    volatility: 0.023,
    per: 18.5,
    pbv: 24.0,
    roe: 125.0,
    roa: 26.5,
    der: 4.10,
    eps: 130,
    npm: 12.8,
    opm: 18.2,
    revGrowth: -3.8,
    netGrowth: -8.5,
    divYield: 5.2,
    payout: 99.0,
    marketCapT: 92.3,
    freeFloat: 15.0,
    fairValue: 2200,
    bandarScore: 42,
    bandarStatus: 'Normal Distribution',
    foreign1D: -18.5,
    foreign5D: -75.0,
    foreign20D: -260.0,
    topBuyers: ['YP (Mirae)', 'XC (Ajaib)', 'XL (Stockbit)'],
    topSellers: ['AK (UBS)', 'BK (JPMorgan)', 'ZP (Maybank)'],
    wyckoff: 'Distribution'
  },
  {
    ticker: 'GOTO',
    name: 'GoTo Gojek Tokopedia Tbk.',
    sector: 'Technology',
    subSector: 'Internet & Direct Marketing Retail',
    price: 68,
    prevClose: 65,
    volume: 2450000000,
    valueBillion: 166.6,
    high52w: 96,
    low52w: 50,
    trendBias: 0.08,
    volatility: 0.052,
    per: -8.5,
    pbv: 1.15,
    roe: -14.2,
    roa: -9.5,
    der: 0.12,
    eps: -8,
    npm: -24.0,
    opm: -18.5,
    revGrowth: 21.0,
    netGrowth: 45.0,
    divYield: 0.0,
    payout: 0.0,
    marketCapT: 81.6,
    freeFloat: 72.5,
    fairValue: 85,
    bandarScore: 81,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 35.8,
    foreign5D: 140.0,
    foreign20D: 380.0,
    topBuyers: ['CS (Credit Suisse)', 'RX (Macquarie)', 'AK (UBS)'],
    topSellers: ['YP (Mirae)', 'XC (Ajaib)', 'PD (Indo Premier)'],
    wyckoff: 'Phase C (Spring / Shakeout)'
  },
  {
    ticker: 'BRIS',
    name: 'Bank Syariah Indonesia Tbk.',
    sector: 'Financials',
    subSector: 'Islamic Banking',
    price: 3040,
    prevClose: 2950,
    volume: 68000000,
    valueBillion: 206.7,
    high52w: 3250,
    low52w: 1550,
    trendBias: 0.11,
    volatility: 0.028,
    per: 19.5,
    pbv: 3.2,
    roe: 17.5,
    roa: 2.2,
    der: 0.14,
    eps: 156,
    npm: 24.5,
    opm: 35.0,
    revGrowth: 16.8,
    netGrowth: 28.5,
    divYield: 0.9,
    payout: 20.0,
    marketCapT: 140.2,
    freeFloat: 24.5,
    fairValue: 3400,
    bandarScore: 92,
    bandarStatus: 'Big Accumulation',
    foreign1D: 88.0,
    foreign5D: 295.0,
    foreign20D: 780.0,
    topBuyers: ['AK (UBS)', 'BK (JPMorgan)', 'ZP (Maybank)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'NI (BNI)'],
    wyckoff: 'Phase E (Markup / Trend Run)'
  },
  {
    ticker: 'KLBF',
    name: 'Kalbe Farma Tbk.',
    sector: 'Healthcare',
    subSector: 'Pharmaceuticals',
    price: 1510,
    prevClose: 1485,
    volume: 45000000,
    valueBillion: 67.9,
    high52w: 1820,
    low52w: 1390,
    trendBias: 0.02,
    volatility: 0.018,
    per: 21.0,
    pbv: 3.4,
    roe: 16.8,
    roa: 12.5,
    der: 0.22,
    eps: 72,
    npm: 10.8,
    opm: 14.5,
    revGrowth: 6.8,
    netGrowth: 8.5,
    divYield: 2.6,
    payout: 50.0,
    marketCapT: 70.8,
    freeFloat: 42.0,
    fairValue: 1750,
    bandarScore: 76,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 14.2,
    foreign5D: 52.0,
    foreign20D: 180.0,
    topBuyers: ['KZ (CLSA)', 'RX (Macquarie)', 'ZP (Maybank)'],
    topSellers: ['YP (Mirae)', 'XL (Stockbit)', 'PD (Indo Premier)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'MEDC',
    name: 'Medco Energi Internasional Tbk.',
    sector: 'Energy',
    subSector: 'Oil & Gas Exploration',
    price: 1285,
    prevClose: 1240,
    volume: 120000000,
    valueBillion: 154.2,
    high52w: 1650,
    low52w: 1080,
    trendBias: 0.06,
    volatility: 0.038,
    per: 5.8,
    pbv: 1.15,
    roe: 21.0,
    roa: 6.5,
    der: 1.85,
    eps: 221,
    npm: 15.2,
    opm: 35.8,
    revGrowth: 14.5,
    netGrowth: 18.2,
    divYield: 5.5,
    payout: 30.0,
    marketCapT: 32.3,
    freeFloat: 48.0,
    fairValue: 1550,
    bandarScore: 85,
    bandarStatus: 'Big Accumulation',
    foreign1D: 52.0,
    foreign5D: 180.0,
    foreign20D: 490.0,
    topBuyers: ['AK (UBS)', 'CS (Credit Suisse)', 'BK (JPMorgan)'],
    topSellers: ['YP (Mirae)', 'XC (Ajaib)', 'PD (Indo Premier)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'PGAS',
    name: 'Perusahaan Gas Negara Tbk.',
    sector: 'Energy',
    subSector: 'Gas Utilities',
    price: 1560,
    prevClose: 1535,
    volume: 85000000,
    valueBillion: 132.6,
    high52w: 1720,
    low52w: 1050,
    trendBias: 0.04,
    volatility: 0.024,
    per: 7.5,
    pbv: 0.88,
    roe: 12.5,
    roa: 5.2,
    der: 0.72,
    eps: 208,
    npm: 8.5,
    opm: 14.2,
    revGrowth: 8.2,
    netGrowth: 15.0,
    divYield: 9.8,
    payout: 80.0,
    marketCapT: 37.8,
    freeFloat: 43.0,
    fairValue: 1800,
    bandarScore: 82,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 38.5,
    foreign5D: 140.0,
    foreign20D: 360.0,
    topBuyers: ['RX (Macquarie)', 'ZP (Maybank)', 'KZ (CLSA)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'CC (Mandiri)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'SMGR',
    name: 'Semen Indonesia (Persero) Tbk.',
    sector: 'Basic Materials',
    subSector: 'Cement & Building Materials',
    price: 3850,
    prevClose: 3890,
    volume: 28000000,
    valueBillion: 107.8,
    high52w: 6700,
    low52w: 3600,
    trendBias: -0.04,
    volatility: 0.022,
    per: 13.2,
    pbv: 0.58,
    roe: 4.8,
    roa: 2.5,
    der: 0.85,
    eps: 291,
    npm: 5.4,
    opm: 10.2,
    revGrowth: 2.1,
    netGrowth: -15.0,
    divYield: 4.2,
    payout: 55.0,
    marketCapT: 25.9,
    freeFloat: 48.9,
    fairValue: 4600,
    bandarScore: 56,
    bandarStatus: 'Neutral',
    foreign1D: -8.5,
    foreign5D: -25.0,
    foreign20D: -80.0,
    topBuyers: ['YP (Mirae)', 'PD (Indo Premier)', 'CC (Mandiri)'],
    topSellers: ['AK (UBS)', 'BK (JPMorgan)', 'RX (Macquarie)'],
    wyckoff: 'Phase A (Stopping Action)'
  },
  {
    ticker: 'INKP',
    name: 'Indah Kiat Pulp & Paper Tbk.',
    sector: 'Basic Materials',
    subSector: 'Paper & Forest Products',
    price: 8125,
    prevClose: 7950,
    volume: 22000000,
    valueBillion: 178.7,
    high52w: 9950,
    low52w: 7100,
    trendBias: 0.05,
    volatility: 0.026,
    per: 6.4,
    pbv: 0.52,
    roe: 8.8,
    roa: 4.8,
    der: 1.15,
    eps: 1269,
    npm: 12.5,
    opm: 20.1,
    revGrowth: 5.5,
    netGrowth: 14.2,
    divYield: 1.2,
    payout: 10.0,
    marketCapT: 44.4,
    freeFloat: 46.0,
    fairValue: 10500,
    bandarScore: 84,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 45.0,
    foreign5D: 160.0,
    foreign20D: 410.0,
    topBuyers: ['AK (UBS)', 'ZP (Maybank)', 'CS (Credit Suisse)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'XL (Stockbit)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'AMRT',
    name: 'Sumber Alfaria Trijaya Tbk.',
    sector: 'Consumer Cyclicals',
    subSector: 'Convenience Stores & Retail',
    price: 3240,
    prevClose: 3180,
    volume: 42000000,
    valueBillion: 136.0,
    high52w: 3380,
    low52w: 2600,
    trendBias: 0.08,
    volatility: 0.017,
    per: 36.5,
    pbv: 9.8,
    roe: 28.5,
    roa: 11.2,
    der: 1.25,
    eps: 88,
    npm: 3.4,
    opm: 4.8,
    revGrowth: 11.5,
    netGrowth: 15.2,
    divYield: 1.5,
    payout: 50.0,
    marketCapT: 134.5,
    freeFloat: 47.0,
    fairValue: 3500,
    bandarScore: 87,
    bandarStatus: 'Big Accumulation',
    foreign1D: 62.0,
    foreign5D: 210.0,
    foreign20D: 590.0,
    topBuyers: ['BK (JPMorgan)', 'ZP (Maybank)', 'AK (UBS)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'CC (Mandiri)'],
    wyckoff: 'Phase E (Markup / Trend Run)'
  },
  {
    ticker: 'CPIN',
    name: 'Charoen Pokphand Indonesia Tbk.',
    sector: 'Consumer Non-Cyclicals',
    subSector: 'Poultry & Animal Feed',
    price: 4950,
    prevClose: 4850,
    volume: 32000000,
    valueBillion: 158.4,
    high52w: 5650,
    low52w: 4300,
    trendBias: 0.04,
    volatility: 0.021,
    per: 24.0,
    pbv: 2.8,
    roe: 12.2,
    roa: 7.5,
    der: 0.55,
    eps: 206,
    npm: 5.6,
    opm: 8.5,
    revGrowth: 9.5,
    netGrowth: 28.0,
    divYield: 2.4,
    payout: 55.0,
    marketCapT: 81.2,
    freeFloat: 44.5,
    fairValue: 5400,
    bandarScore: 81,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 35.0,
    foreign5D: 125.0,
    foreign20D: 340.0,
    topBuyers: ['RX (Macquarie)', 'KZ (CLSA)', 'AK (UBS)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'XL (Stockbit)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  },
  {
    ticker: 'JSMR',
    name: 'Jasa Marga (Persero) Tbk.',
    sector: 'Infrastructures',
    subSector: 'Toll Roads',
    price: 4820,
    prevClose: 4760,
    volume: 21000000,
    valueBillion: 101.2,
    high52w: 5600,
    low52w: 4350,
    trendBias: 0.03,
    volatility: 0.019,
    per: 5.4,
    pbv: 1.15,
    roe: 22.0,
    roa: 5.8,
    der: 2.85,
    eps: 892,
    npm: 28.0,
    opm: 45.0,
    revGrowth: 14.0,
    netGrowth: 110.0,
    divYield: 3.5,
    payout: 25.0,
    marketCapT: 34.9,
    freeFloat: 30.0,
    fairValue: 5800,
    bandarScore: 80,
    bandarStatus: 'Normal Accumulation',
    foreign1D: 22.0,
    foreign5D: 78.0,
    foreign20D: 210.0,
    topBuyers: ['ZP (Maybank)', 'KZ (CLSA)', 'BK (JPMorgan)'],
    topSellers: ['CC (Mandiri)', 'YP (Mirae)', 'XC (Ajaib)'],
    wyckoff: 'Phase B (Building Cause / Accumulation)'
  },
  {
    ticker: 'ISAT',
    name: 'Indosat Ooredoo Hutchison Tbk.',
    sector: 'Infrastructures',
    subSector: 'Telecommunication Services',
    price: 2480,
    prevClose: 2420,
    volume: 58000000,
    valueBillion: 143.8,
    high52w: 2950,
    low52w: 1850,
    trendBias: 0.06,
    volatility: 0.025,
    per: 18.2,
    pbv: 2.6,
    roe: 15.2,
    roa: 5.8,
    der: 1.95,
    eps: 136,
    npm: 9.8,
    opm: 24.5,
    revGrowth: 11.8,
    netGrowth: 32.5,
    divYield: 3.2,
    payout: 50.0,
    marketCapT: 79.9,
    freeFloat: 16.5,
    fairValue: 2800,
    bandarScore: 85,
    bandarStatus: 'Big Accumulation',
    foreign1D: 48.0,
    foreign5D: 175.0,
    foreign20D: 460.0,
    topBuyers: ['AK (UBS)', 'BK (JPMorgan)', 'ZP (Maybank)'],
    topSellers: ['YP (Mirae)', 'PD (Indo Premier)', 'NI (BNI)'],
    wyckoff: 'Phase D (Sign of Strength / Breakout)'
  }
];

function generateBrokerSummary(price: number, isAcc: boolean) {
  const buyerCodes = isAcc 
    ? [
        { code: 'AK', name: 'UBS Sekuritas', type: 'ASING' as const },
        { code: 'ZP', name: 'Maybank Sekuritas', type: 'ASING' as const },
        { code: 'BK', name: 'JPMorgan Sekuritas', type: 'ASING' as const },
        { code: 'RX', name: 'Macquarie Sekuritas', type: 'ASING' as const },
        { code: 'CS', name: 'Credit Suisse', type: 'ASING' as const }
      ]
    : [
        { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'RITEL' as const },
        { code: 'XC', name: 'Ajaib Sekuritas', type: 'RITEL' as const },
        { code: 'XL', name: 'Stockbit Sekuritas', type: 'RITEL' as const },
        { code: 'PD', name: 'Indo Premier Sekuritas', type: 'RITEL' as const },
        { code: 'CC', name: 'Mandiri Sekuritas', type: 'INSTITUSI' as const }
      ];

  const sellerCodes = isAcc
    ? [
        { code: 'YP', name: 'Mirae Asset Sekuritas', type: 'RITEL' as const },
        { code: 'PD', name: 'Indo Premier Sekuritas', type: 'RITEL' as const },
        { code: 'XC', name: 'Ajaib Sekuritas', type: 'RITEL' as const },
        { code: 'XL', name: 'Stockbit Sekuritas', type: 'RITEL' as const },
        { code: 'NI', name: 'BNI Sekuritas', type: 'INSTITUSI' as const }
      ]
    : [
        { code: 'AK', name: 'UBS Sekuritas', type: 'ASING' as const },
        { code: 'BK', name: 'JPMorgan Sekuritas', type: 'ASING' as const },
        { code: 'ZP', name: 'Maybank Sekuritas', type: 'ASING' as const },
        { code: 'CS', name: 'Credit Suisse', type: 'ASING' as const },
        { code: 'RX', name: 'Macquarie Sekuritas', type: 'ASING' as const }
      ];

  const topBuyersList = buyerCodes.map((b, idx) => {
    const mult = 1 - (idx * 0.16);
    const buyVol = Math.floor((45000 + Math.random() * 25000) * mult);
    const buyAvg = roundToIdxTick(price * (1 - 0.003 * (idx + 1)));
    const sellVol = Math.floor(buyVol * (isAcc ? 0.25 : 0.7));
    const sellAvg = roundToIdxTick(price * (1 + 0.002 * idx));
    const netValBillion = Number((((buyVol - sellVol) * 100 * price) / 1000000000).toFixed(1));
    return {
      code: b.code,
      name: b.name,
      type: b.type,
      buyVol,
      buyAvg,
      sellVol,
      sellAvg,
      netValBillion
    };
  });

  const topSellersList = sellerCodes.map((s, idx) => {
    const mult = 1 - (idx * 0.16);
    const sellVol = Math.floor((40000 + Math.random() * 20000) * mult);
    const sellAvg = roundToIdxTick(price * (1 + 0.003 * idx));
    const buyVol = Math.floor(sellVol * (isAcc ? 0.3 : 0.8));
    const buyAvg = roundToIdxTick(price * (1 - 0.002 * (idx + 1)));
    const netValBillion = Number((((sellVol - buyVol) * 100 * price) / 1000000000).toFixed(1));
    return {
      code: s.code,
      name: s.name,
      type: s.type,
      buyVol,
      buyAvg,
      sellVol,
      sellAvg,
      netValBillion: -netValBillion
    };
  });

  return { topBuyersList, topSellersList };
}

function generateForeignFlowHistory(history: OHLCVBar[], foreign1D: number, foreign20D: number) {
  const points = [];
  const recentBars = history.slice(-20);
  let cum = 0;

  for (let i = 0; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const isLast = i === recentBars.length - 1;
    const baseStep = foreign20D / 20;
    const netDaily = isLast ? foreign1D : Number((baseStep + Math.sin(i * 1.4) * Math.abs(foreign1D * 0.4)).toFixed(1));
    cum += netDaily;
    points.push({
      date: bar.time,
      netForeignBillion: netDaily,
      cumulativeBillion: Number(cum.toFixed(1)),
      closePrice: bar.close
    });
  }
  return points;
}

export const INITIAL_STOCKS: StockItem[] = STOCK_SEEDS.map((seed) => {
  const tick = getIdxTickSize(seed.price);
  const { ara, arb } = getIdxAutoRejectionLimits(seed.prevClose);
  const history = generateHistoricalBars(seed.ticker, seed.price, seed.volatility, seed.trendBias, 180);
  const closes = history.map(b => b.close);

  const ema9 = calculateEMA(closes, 9);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  const ma5 = calculateSMA(closes, 5);
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const ma200 = calculateSMA(closes, 200);
  const rsi14 = calculateRSI(closes, 14);
  const { macdLine, macdSignal, macdHistogram } = calculateMACD(closes);
  const bb = calculateBollingerBands(closes, 20, 2);
  const atr14 = calculateATR(history, 14);

  // RVOL calculation (last bar volume vs avg volume of last 20 bars)
  const vol20Slice = history.slice(-21, -1).map(b => b.volume);
  const avgVol20 = vol20Slice.length > 0 ? vol20Slice.reduce((a, b) => a + b, 0) / vol20Slice.length : seed.volume;
  const rvol = Number((seed.volume / Math.max(1, avgVol20)).toFixed(2));

  // Support & Resistance levels based on pivot and ATR
  const s1 = roundToIdxTick(seed.price - atr14 * 1.5, 'down');
  const s2 = roundToIdxTick(seed.price - atr14 * 3.0, 'down');
  const r1 = roundToIdxTick(seed.price + atr14 * 1.8, 'up');
  const r2 = roundToIdxTick(seed.price + atr14 * 3.5, 'up');

  let rsiStatus: 'Oversold' | 'Bullish' | 'Neutral' | 'Overbought' = 'Neutral';
  if (rsi14 < 35) rsiStatus = 'Oversold';
  else if (rsi14 > 70) rsiStatus = 'Overbought';
  else if (rsi14 >= 50) rsiStatus = 'Bullish';

  let macdTrend: 'Golden Cross' | 'Bullish' | 'Death Cross' | 'Bearish' = 'Neutral' as any;
  if (macdLine > macdSignal && macdHistogram > 0) {
    macdTrend = macdHistogram > 2 ? 'Bullish' : 'Golden Cross';
  } else {
    macdTrend = macdHistogram < -2 ? 'Bearish' : 'Death Cross';
  }

  const technicals = {
    ma5,
    ma20,
    ma50,
    ma200,
    ema9,
    ema20,
    ema50,
    ema200,
    rsi14,
    rsiStatus,
    macdLine,
    macdSignal,
    macdHistogram,
    macdTrend,
    stochK: Math.min(95, Math.max(10, Math.round(rsi14 + (Math.random() - 0.5) * 10))),
    stochD: Math.min(95, Math.max(10, Math.round(rsi14 - 3 + (Math.random() - 0.5) * 8))),
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    bbBandwidth: bb.bandwidth,
    atr14: Math.round(atr14),
    rvol,
    obv: Math.round(seed.volume * 4.2),
    obvTrend: rvol > 1.2 ? 'Upward' : (rvol < 0.8 ? 'Downward' : 'Flat') as any,
    vwap: roundToIdxTick(seed.price * 0.995),
    support1: s1,
    support2: s2,
    resistance1: r1,
    resistance2: r2
  };

  const fundamentals = {
    per: seed.per,
    pbv: seed.pbv,
    roe: seed.roe,
    roa: seed.roa,
    der: seed.der,
    eps: seed.eps,
    npm: seed.npm,
    opm: seed.opm,
    revenueGrowthYoY: seed.revGrowth,
    netProfitGrowthYoY: seed.netGrowth,
    dividendYield: seed.divYield,
    dividendPayoutRatio: seed.payout,
    marketCap: seed.marketCapT,
    freeFloat: seed.freeFloat,
    fairValue: seed.fairValue,
    undervaluedPct: Number((((seed.fairValue - seed.price) / seed.price) * 100).toFixed(1))
  };

  const isAcc = seed.bandarStatus.includes('Accumulation');
  const { topBuyersList, topSellersList } = generateBrokerSummary(seed.price, isAcc);
  const foreignFlowHistory = generateForeignFlowHistory(history, seed.foreign1D, seed.foreign20D);

  const totalBuyVol = topBuyersList.reduce((acc, b) => acc + b.buyVol, 0);
  const top1ConcentrationPct = Number(((topBuyersList[0].buyVol / Math.max(1, totalBuyVol)) * 100).toFixed(1));
  const top3ConcentrationPct = Number((((topBuyersList[0].buyVol + topBuyersList[1].buyVol + topBuyersList[2].buyVol) / Math.max(1, totalBuyVol)) * 100).toFixed(1));
  const top5ConcentrationPct = 100;
  const retailParticipationPct = isAcc ? 26.5 : 58.2;

  const bandar = {
    status: seed.bandarStatus,
    score: seed.bandarScore,
    foreignNet1D: seed.foreign1D,
    foreignNet5D: seed.foreign5D,
    foreignNet20D: seed.foreign20D,
    top3BuyerBroker: seed.topBuyers,
    top3SellerBroker: seed.topSellers,
    topBuyerVolumePct: isAcc ? 64.5 : 42.0,
    topSellerVolumePct: isAcc ? 35.5 : 58.0,
    wyckoffPhase: seed.wyckoff,
    topBuyersList,
    topSellersList,
    foreignFlowHistory,
    top1ConcentrationPct,
    top3ConcentrationPct,
    top5ConcentrationPct,
    retailParticipationPct
  };

  const { score: aiScore, verdict } = calculateAnnisaAiScore(technicals, fundamentals, bandar, seed.price);

  // Trading plan targets
  const entryMin = roundToIdxTick(Math.min(seed.price, s1 + tick), 'nearest');
  const entryMax = roundToIdxTick(Math.max(seed.price, entryMin + tick * 2), 'nearest');
  const tp1 = r1;
  const tp2 = r2;
  const tp3 = roundToIdxTick(seed.price * 1.15, 'up');
  const stopLoss = Math.min(s1 - tick, roundToIdxTick(entryMin * 0.95, 'down'));
  const rrr = Number(((tp1 - entryMax) / Math.max(tick, entryMax - stopLoss)).toFixed(2));

  return {
    ticker: seed.ticker,
    name: seed.name,
    sector: seed.sector,
    subSector: seed.subSector,
    price: seed.price,
    prevClose: seed.prevClose,
    change: seed.price - seed.prevClose,
    changePct: Number((((seed.price - seed.prevClose) / seed.prevClose) * 100).toFixed(2)),
    open: roundToIdxTick(seed.prevClose * (1 + (Math.random() - 0.45) * 0.01)),
    high: Math.max(seed.price, roundToIdxTick(seed.price * 1.018, 'up')),
    low: Math.min(seed.price, roundToIdxTick(seed.price * 0.985, 'down')),
    volume: seed.volume,
    value: seed.valueBillion,
    frequency: Math.floor(seed.volume / 850),
    high52w: seed.high52w,
    low52w: seed.low52w,
    araPrice: ara,
    arbPrice: arb,
    tickSize: tick,
    technicals,
    fundamentals,
    bandar,
    orderBook: generateOrderBook(seed.price, tick),
    history,
    aiScore,
    verdict,
    tradingPlan: {
      entryMin,
      entryMax,
      tp1,
      tp2,
      tp3,
      stopLoss,
      riskRewardRatio: Math.max(1.2, rrr),
      recommendedLots: 50
    }
  };
});
