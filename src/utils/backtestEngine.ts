import { StockItem, BacktestConfig, BacktestResult, TradeRecord, OHLCVBar } from '../types/stock';
import { calculateEMA, calculateSMA, calculateRSI, calculateMACD, roundToIdxTick } from './idxCalculations';

export function runBacktest(stock: StockItem, config: BacktestConfig): BacktestResult {
  const allBars = stock.history;
  const barsCount = Math.min(allBars.length, config.timeframeDays);
  const bars = allBars.slice(-barsCount);

  if (bars.length < 30) {
    throw new Error('Data historis tidak mencukupi untuk periode yang dipilih (minimal 30 hari perdagangan).');
  }

  let capital = config.initialCapital;
  const initialCapital = config.initialCapital;
  let inPosition = false;
  let currentPosition: {
    entryDate: string;
    entryPrice: number;
    shares: number;
    investedAmount: number;
    highestPriceSinceEntry: number;
    entryBarIndex: number;
  } | null = null;

  const trades: TradeRecord[] = [];
  const equityCurve: { date: string; equity: number; price: number }[] = [];
  let peakEquity = capital;
  let maxDrawdownPct = 0;

  // Track initial price for Buy & Hold benchmark
  const initialPrice = bars[0].close;

  // Iterate bar by bar
  for (let i = 26; i < bars.length; i++) {
    const currentBar = bars[i];
    const historicalSlice = bars.slice(0, i + 1);
    const closes = historicalSlice.map(b => b.close);

    // Dynamic indicators at step i
    const ema9 = calculateEMA(closes, 9);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ma200 = calculateSMA(closes, Math.min(200, closes.length));
    const rsi = calculateRSI(closes, 14);
    const { macdLine, macdSignal, macdHistogram } = calculateMACD(closes);

    // Prev bar indicators for crossover detection
    const prevCloses = historicalSlice.slice(0, -1).map(b => b.close);
    const prevEma9 = calculateEMA(prevCloses, 9);
    const prevEma20 = calculateEMA(prevCloses, 20);
    const prevRsi = calculateRSI(prevCloses, 14);
    const prevMacd = calculateMACD(prevCloses);

    // Volume comparison
    const vol20 = calculateSMA(historicalSlice.slice(-21, -1).map(b => b.volume), 20);
    const rvol = vol20 > 0 ? currentBar.volume / vol20 : 1;

    // Check in-position management
    if (inPosition && currentPosition) {
      const currentPrice = currentBar.close;
      if (currentPrice > currentPosition.highestPriceSinceEntry) {
        currentPosition.highestPriceSinceEntry = currentPrice;
      }

      const pnlPct = ((currentPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100;
      let shouldExit = false;
      let exitReason: TradeRecord['reason'] = 'TAKE_PROFIT';

      // 1. Take Profit Target
      if (pnlPct >= config.exitRules.targetProfitPct) {
        shouldExit = true;
        exitReason = 'TAKE_PROFIT';
      }
      // 2. Stop Loss Target
      else if (pnlPct <= -config.exitRules.stopLossPct) {
        shouldExit = true;
        exitReason = 'STOP_LOSS';
      }
      // 3. Trailing Stop
      else if (config.useTrailingStop && config.trailingStopPct) {
        const dropFromPeak = ((currentPosition.highestPriceSinceEntry - currentPrice) / currentPosition.highestPriceSinceEntry) * 100;
        if (dropFromPeak >= config.trailingStopPct && pnlPct > 1.5) {
          shouldExit = true;
          exitReason = 'INDICATOR_EXIT';
        }
      }
      // 4. Indicator Exits
      else if (config.exitRules.macdDeathCross && macdLine < macdSignal && prevMacd.macdLine >= prevMacd.macdSignal) {
        shouldExit = true;
        exitReason = 'INDICATOR_EXIT';
      } else if (config.exitRules.rsiOverbought && rsi > 72) {
        shouldExit = true;
        exitReason = 'INDICATOR_EXIT';
      }
      // 5. End of backtest period
      else if (i === bars.length - 1) {
        shouldExit = true;
        exitReason = 'TIMEFRAME_END';
      }

      if (shouldExit) {
        const exitPrice = currentBar.close;
        const pnlAmount = currentPosition.shares * (exitPrice - currentPosition.entryPrice);
        const finalPnlPct = Number((((exitPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 100).toFixed(2));
        capital += currentPosition.investedAmount + pnlAmount;

        trades.push({
          id: `TR-${trades.length + 1}-${currentBar.time}`,
          entryDate: currentPosition.entryDate,
          exitDate: currentBar.time,
          entryPrice: currentPosition.entryPrice,
          exitPrice,
          shares: currentPosition.shares,
          investedAmount: currentPosition.investedAmount,
          pnlAmount: Math.round(pnlAmount),
          pnlPct: finalPnlPct,
          holdingDays: i - currentPosition.entryBarIndex,
          reason: exitReason,
          win: pnlAmount > 0
        });

        inPosition = false;
        currentPosition = null;
      }
    }

    // Check entry rules if not in position
    if (!inPosition && i < bars.length - 1) {
      let conditionsMet = true;

      // Technical entry rules
      if (config.entryRules.rsiOversold) {
        if (rsi > config.entryRules.rsiThreshold) conditionsMet = false;
      }

      if (config.entryRules.rsiCrossAbove50) {
        if (!(prevRsi <= 50 && rsi > 50)) conditionsMet = false;
      }

      if (config.entryRules.emaGoldenCross9_20) {
        if (!(prevEma9 <= prevEma20 && ema9 > ema20)) conditionsMet = false;
      }

      if (config.entryRules.emaTrend20_50) {
        if (!(ema20 > ema50)) conditionsMet = false;
      }

      if (config.entryRules.priceAboveMa200) {
        if (currentBar.close < ma200) conditionsMet = false;
      }

      if (config.entryRules.macdBullishCross) {
        if (!(prevMacd.macdLine <= prevMacd.macdSignal && macdLine > macdSignal)) conditionsMet = false;
      }

      if (config.entryRules.volumeBreakout) {
        if (rvol < config.entryRules.rvolThreshold) conditionsMet = false;
      }

      // Fundamental entry rules
      if (config.entryRules.perMax !== null && config.entryRules.perMax > 0) {
        if (stock.fundamentals.per <= 0 || stock.fundamentals.per > config.entryRules.perMax) conditionsMet = false;
      }

      if (config.entryRules.roeMin !== null && config.entryRules.roeMin > 0) {
        if (stock.fundamentals.roe < config.entryRules.roeMin) conditionsMet = false;
      }

      if (config.entryRules.derMax !== null && config.entryRules.derMax > 0) {
        if (stock.fundamentals.der > config.entryRules.derMax) conditionsMet = false;
      }

      if (config.entryRules.divYieldMin !== null && config.entryRules.divYieldMin > 0) {
        if (stock.fundamentals.dividendYield < config.entryRules.divYieldMin) conditionsMet = false;
      }

      if (conditionsMet) {
        // Execute position sizing
        const entryPrice = currentBar.close;
        const maxRiskAmount = capital * (config.riskPerTradePct / 100);
        const stopLossDistance = entryPrice * (config.exitRules.stopLossPct / 100);
        const calculatedShares = Math.floor(maxRiskAmount / Math.max(1, stopLossDistance));
        const lots = Math.max(1, Math.min(Math.floor(calculatedShares / 100), Math.floor((capital * 0.4) / (entryPrice * 100))));
        const shares = lots * 100;
        const invested = shares * entryPrice;

        if (invested <= capital && invested > 0) {
          capital -= invested;
          inPosition = true;
          currentPosition = {
            entryDate: currentBar.time,
            entryPrice,
            shares,
            investedAmount: invested,
            highestPriceSinceEntry: entryPrice,
            entryBarIndex: i
          };
        }
      }
    }

    // Compute current mark-to-market equity
    let currentEquity = capital;
    if (inPosition && currentPosition) {
      currentEquity += currentPosition.shares * currentBar.close;
    }

    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const currentDrawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
    if (currentDrawdown > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdown;
    }

    equityCurve.push({
      date: currentBar.time,
      equity: Math.round(currentEquity),
      price: currentBar.close
    });
  }

  // Calculate summary metrics
  const finalCapital = equityCurve[equityCurve.length - 1]?.equity || capital;
  const totalReturnPct = Number((((finalCapital - initialCapital) / initialCapital) * 100).toFixed(2));
  const finalPrice = bars[bars.length - 1].close;
  const benchmarkReturnPct = Number((((finalPrice - initialPrice) / initialPrice) * 100).toFixed(2));

  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.win).length;
  const losingTrades = totalTrades - winningTrades;
  const winRatePct = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const totalGains = trades.filter(t => t.win).reduce((sum, t) => sum + t.pnlAmount, 0);
  const totalLosses = Math.abs(trades.filter(t => !t.win).reduce((sum, t) => sum + t.pnlAmount, 0));
  const profitFactor = totalLosses > 0 ? Number((totalGains / totalLosses).toFixed(2)) : (totalGains > 0 ? 99 : 0);

  const winningPcts = trades.filter(t => t.win).map(t => t.pnlPct);
  const avgWinPct = winningPcts.length > 0 ? Number((winningPcts.reduce((a, b) => a + b, 0) / winningPcts.length).toFixed(2)) : 0;

  const losingPcts = trades.filter(t => !t.win).map(t => t.pnlPct);
  const avgLossPct = losingPcts.length > 0 ? Number((losingPcts.reduce((a, b) => a + b, 0) / losingPcts.length).toFixed(2)) : 0;

  let periodText = '6 Bulan';
  if (config.timeframeDays <= 90) periodText = '3 Bulan';
  else if (config.timeframeDays <= 180) periodText = '6 Bulan';
  else if (config.timeframeDays <= 365) periodText = '1 Tahun';
  else periodText = '2 Tahun';

  return {
    ticker: stock.ticker,
    periodText,
    totalBars: bars.length,
    initialCapital,
    finalCapital,
    totalReturnPct,
    benchmarkReturnPct,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    winRatePct,
    totalTrades,
    winningTrades,
    losingTrades,
    profitFactor,
    avgWinPct,
    avgLossPct,
    equityCurve,
    trades
  };
}
