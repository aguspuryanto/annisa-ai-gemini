export type MarketSession = 'PRE_OPENING' | 'SESSION_1' | 'BREAK' | 'SESSION_2' | 'POST_CLOSING' | 'CLOSED';

export interface OHLCVBar {
  time: string; // YYYY-MM-DD or HH:mm
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Sector = 
  | 'Financials'
  | 'Energy'
  | 'Consumer Non-Cyclicals'
  | 'Consumer Cyclicals'
  | 'Basic Materials'
  | 'Infrastructures'
  | 'Technology'
  | 'Healthcare'
  | 'Properties & Real Estate'
  | 'Transportation';

export type WyckoffPhase = 
  | 'Phase A (Stopping Action)'
  | 'Phase B (Building Cause / Accumulation)'
  | 'Phase C (Spring / Shakeout)'
  | 'Phase D (Sign of Strength / Breakout)'
  | 'Phase E (Markup / Trend Run)'
  | 'Distribution';

export type AccumulationStatus = 
  | 'Big Accumulation'
  | 'Normal Accumulation'
  | 'Neutral'
  | 'Normal Distribution'
  | 'Big Distribution';

export type SignalVerdict = 'STRONG BUY' | 'BUY AREA' | 'BUY ON BREAKOUT' | 'WAIT / PULLBACK' | 'AVOID / NEUTRAL' | 'TAKE PROFIT';

export interface TechnicalIndicators {
  ma5: number;
  ma20: number;
  ma50: number;
  ma200: number;
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  rsiStatus: 'Oversold' | 'Bullish' | 'Neutral' | 'Overbought';
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  macdTrend: 'Golden Cross' | 'Bullish' | 'Death Cross' | 'Bearish';
  stochK: number;
  stochD: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbBandwidth: number;
  atr14: number;
  rvol: number; // Relative Volume vs 20-day MA
  obv: number;
  obvTrend: 'Upward' | 'Flat' | 'Downward';
  vwap: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
}

export interface FundamentalMetrics {
  per: number; // Price to Earnings
  pbv: number; // Price to Book Value
  roe: number; // Return on Equity (%)
  roa: number; // Return on Assets (%)
  der: number; // Debt to Equity Ratio
  eps: number; // Earnings Per Share (IDR)
  npm: number; // Net Profit Margin (%)
  opm: number; // Operating Profit Margin (%)
  revenueGrowthYoY: number; // %
  netProfitGrowthYoY: number; // %
  dividendYield: number; // %
  dividendPayoutRatio: number; // %
  marketCap: number; // in IDR Trillion
  freeFloat: number; // %
  fairValue: number; // IDR estimate
  undervaluedPct: number; // % gap to fair value
}

export interface BrokerEntry {
  code: string;
  name: string;
  type: 'ASING' | 'INSTITUSI' | 'RITEL';
  buyVol: number; // in lots
  buyAvg: number; // IDR
  sellVol: number; // in lots
  sellAvg: number; // IDR
  netValBillion: number; // in IDR Billion (+ is net buy, - is net sell)
}

export interface ForeignFlowPoint {
  date: string;
  netForeignBillion: number; // in IDR Billion
  cumulativeBillion: number;
  closePrice: number;
}

export interface BandarmologiData {
  status: AccumulationStatus;
  score: number; // 0 - 100
  foreignNet1D: number; // in IDR Billion (positive = buy, negative = sell)
  foreignNet5D: number; // in IDR Billion
  foreignNet20D: number; // in IDR Billion
  top3BuyerBroker: string[];
  top3SellerBroker: string[];
  topBuyerVolumePct: number;
  topSellerVolumePct: number;
  wyckoffPhase: WyckoffPhase;
  topBuyersList: BrokerEntry[];
  topSellersList: BrokerEntry[];
  foreignFlowHistory: ForeignFlowPoint[];
  top1ConcentrationPct: number;
  top3ConcentrationPct: number;
  top5ConcentrationPct: number;
  retailParticipationPct: number;
}

export interface OrderBookLevel {
  price: number;
  bidVol: number;
  bidCount: number;
  offerVol: number;
  offerCount: number;
}

export interface StockItem {
  ticker: string;
  name: string;
  sector: Sector;
  subSector: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number; // shares
  value: number; // IDR Billion
  frequency: number;
  high52w: number;
  low52w: number;
  araPrice: number;
  arbPrice: number;
  tickSize: number;
  technicals: TechnicalIndicators;
  fundamentals: FundamentalMetrics;
  bandar: BandarmologiData;
  orderBook: OrderBookLevel[];
  history: OHLCVBar[];
  aiScore: number; // 0 - 100
  verdict: SignalVerdict;
  tradingPlan: {
    entryMin: number;
    entryMax: number;
    tp1: number;
    tp2: number;
    tp3: number;
    stopLoss: number;
    riskRewardRatio: number;
    recommendedLots: number;
  };
}

export interface BacktestRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'technical' | 'fundamental';
  description: string;
  evaluator: (bar: OHLCVBar, prevBar: OHLCVBar, indicators: TechnicalIndicators, fundamentals: FundamentalMetrics) => boolean;
}

export interface BacktestConfig {
  ticker: string;
  timeframeDays: number; // 90, 180, 365, 730
  initialCapital: number;
  riskPerTradePct: number; // e.g. 2%
  tpPct: number; // Take Profit %
  slPct: number; // Stop Loss %
  useTrailingStop: boolean;
  trailingStopPct?: number;
  entryRules: {
    rsiOversold: boolean;
    rsiThreshold: number;
    rsiCrossAbove50: boolean;
    emaGoldenCross9_20: boolean;
    emaTrend20_50: boolean;
    priceAboveMa200: boolean;
    macdBullishCross: boolean;
    volumeBreakout: boolean;
    rvolThreshold: number;
    bandarAccumulation: boolean;
    perMax: number | null;
    roeMin: number | null;
    derMax: number | null;
    divYieldMin: number | null;
  };
  exitRules: {
    targetProfitPct: number;
    stopLossPct: number;
    macdDeathCross: boolean;
    rsiOverbought: boolean;
  };
}

export interface TradeRecord {
  id: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  investedAmount: number;
  pnlAmount: number;
  pnlPct: number;
  holdingDays: number;
  reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'INDICATOR_EXIT' | 'TIMEFRAME_END';
  win: boolean;
}

export interface BacktestResult {
  ticker: string;
  periodText: string;
  totalBars: number;
  initialCapital: number;
  finalCapital: number;
  totalReturnPct: number;
  benchmarkReturnPct: number; // Buy and Hold
  maxDrawdownPct: number;
  winRatePct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  avgWinPct: number;
  avgLossPct: number;
  equityCurve: { date: string; equity: number; price: number }[];
  trades: TradeRecord[];
}

export interface StockAlert {
  id: string;
  createdAt: string;
  ticker: string;
  name: string;
  active: boolean;
  conditionDescription: string;
  technicalCondition?: {
    indicator: 'RSI' | 'MACD' | 'PRICE' | 'EMA' | 'VOLUME';
    comparator: '<' | '>' | 'CROSS_UP' | 'CROSS_DOWN';
    thresholdValue: number;
  };
  fundamentalCondition?: {
    metric: 'PER' | 'PBV' | 'ROE' | 'DER';
    comparator: '<' | '>';
    thresholdValue: number;
  };
  notificationType: 'IN_APP' | 'EMAIL' | 'BOTH';
  emailRecipient?: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface AlertTriggerEvent {
  id: string;
  alertId: string;
  ticker: string;
  timestamp: string;
  triggerPrice: number;
  message: string;
  read: boolean;
}
