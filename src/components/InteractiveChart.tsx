import React, { useState, useMemo } from 'react';
import { OHLCVBar, TechnicalIndicators } from '../types/stock';
import { calculateEMA, calculateSMA, calculateBollingerBands, calculateRSI, calculateMACD } from '../utils/idxCalculations';

interface InteractiveChartProps {
  ticker: string;
  history: OHLCVBar[];
  technicals: TechnicalIndicators;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  ticker,
  history,
  technicals,
}) => {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const [activeSubChart, setActiveSubChart] = useState<'RSI' | 'MACD'>('RSI');
  const [showEma9, setShowEma9] = useState(true);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(false);
  const [showEma200, setShowEma200] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter bars based on timeframe
  const bars = useMemo(() => {
    let count = 120;
    if (timeframe === '1M') count = 25;
    if (timeframe === '3M') count = 65;
    if (timeframe === '6M') count = 120;
    if (timeframe === '1Y') count = 240;
    return history.slice(-Math.min(history.length, count));
  }, [history, timeframe]);

  // Compute indicator series aligned with visible bars
  const series = useMemo(() => {
    const closes = bars.map(b => b.close);
    const ema9Series: (number | null)[] = [];
    const ema20Series: (number | null)[] = [];
    const ema50Series: (number | null)[] = [];
    const ema200Series: (number | null)[] = [];
    const bbUpperSeries: (number | null)[] = [];
    const bbLowerSeries: (number | null)[] = [];
    const rsiSeries: (number | null)[] = [];
    const macdHistSeries: (number | null)[] = [];
    const macdLineSeries: (number | null)[] = [];
    const macdSignalSeries: (number | null)[] = [];

    for (let i = 0; i < bars.length; i++) {
      const subCloses = closes.slice(0, i + 1);
      ema9Series.push(i >= 8 ? calculateEMA(subCloses, 9) : null);
      ema20Series.push(i >= 19 ? calculateEMA(subCloses, 20) : null);
      ema50Series.push(i >= 49 ? calculateEMA(subCloses, 50) : null);
      ema200Series.push(i >= 99 ? calculateEMA(subCloses, 200) : null);

      if (i >= 19) {
        const bb = calculateBollingerBands(subCloses, 20, 2);
        bbUpperSeries.push(bb.upper);
        bbLowerSeries.push(bb.lower);
      } else {
        bbUpperSeries.push(null);
        bbLowerSeries.push(null);
      }

      rsiSeries.push(i >= 14 ? calculateRSI(subCloses, 14) : null);
      if (i >= 26) {
        const macd = calculateMACD(subCloses);
        macdHistSeries.push(macd.macdHistogram);
        macdLineSeries.push(macd.macdLine);
        macdSignalSeries.push(macd.macdSignal);
      } else {
        macdHistSeries.push(null);
        macdLineSeries.push(null);
        macdSignalSeries.push(null);
      }
    }

    return {
      ema9: ema9Series,
      ema20: ema20Series,
      ema50: ema50Series,
      ema200: ema200Series,
      bbUpper: bbUpperSeries,
      bbLower: bbLowerSeries,
      rsi: rsiSeries,
      macdHist: macdHistSeries,
      macdLine: macdLineSeries,
      macdSignal: macdSignalSeries,
    };
  }, [bars]);

  // Chart dimensions
  const width = 800;
  const mainHeight = 320;
  const subHeight = 110;
  const padding = { top: 20, right: 65, bottom: 25, left: 10 };

  // Calculate scales
  const priceMin = Math.min(...bars.map(b => b.low)) * 0.985;
  const priceMax = Math.max(...bars.map(b => b.high)) * 1.015;
  const maxVol = Math.max(...bars.map(b => b.volume)) * 1.1;

  const barCount = bars.length;
  const chartAreaWidth = width - padding.left - padding.right;
  const barWidth = Math.max(2, (chartAreaWidth / barCount) * 0.7);
  const barSpacing = chartAreaWidth / barCount;

  const getX = (index: number) => padding.left + index * barSpacing + barSpacing / 2;
  const getY = (price: number) => padding.top + (1 - (price - priceMin) / (priceMax - priceMin)) * (mainHeight - padding.top - padding.bottom);
  const getVolY = (vol: number) => mainHeight - padding.bottom - (vol / maxVol) * 60;

  // Active bar for hover data
  const currentHoverBar = hoverIndex !== null && bars[hoverIndex] ? bars[hoverIndex] : bars[bars.length - 1];
  const currentHoverIndex = hoverIndex !== null ? hoverIndex : bars.length - 1;

  // Polyline path generator
  const createPath = (data: (number | null)[]) => {
    let path = '';
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      if (val !== null) {
        const x = getX(i);
        const y = getY(val);
        path += path === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
    }
    return path;
  };

  // Sub-chart scales
  const getSubY = (val: number, min: number, max: number) => {
    return (1 - (val - min) / (max - min)) * (subHeight - 20) + 10;
  };

  // Horizontal Grid Lines
  const gridSteps = 5;
  const gridPrices = Array.from({ length: gridSteps }, (_, i) => {
    return priceMin + (i / (gridSteps - 1)) * (priceMax - priceMin);
  });

  return (
    <div className="bg-[#10141e] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Left: Ticker & Timeframe */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-white">{ticker}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Candlestick (Daily)</span>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['1M', '3M', '6M', '1Y'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md transition ${
                  timeframe === tf ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Technical Overlays & Sub-chart Switch */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
            <button
              onClick={() => setShowEma9(!showEma9)}
              className={`px-1.5 py-0.5 rounded transition ${showEma9 ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-500 line-through'}`}
            >
              EMA9
            </button>
            <button
              onClick={() => setShowEma20(!showEma20)}
              className={`px-1.5 py-0.5 rounded transition ${showEma20 ? 'bg-cyan-400/20 text-cyan-300 font-bold' : 'text-slate-500 line-through'}`}
            >
              EMA20
            </button>
            <button
              onClick={() => setShowEma50(!showEma50)}
              className={`px-1.5 py-0.5 rounded transition ${showEma50 ? 'bg-purple-400/20 text-purple-300 font-bold' : 'text-slate-500 line-through'}`}
            >
              EMA50
            </button>
            <button
              onClick={() => setShowEma200(!showEma200)}
              className={`px-1.5 py-0.5 rounded transition ${showEma200 ? 'bg-emerald-400/20 text-emerald-300 font-bold' : 'text-slate-500 line-through'}`}
            >
              EMA200
            </button>
            <button
              onClick={() => setShowBB(!showBB)}
              className={`px-1.5 py-0.5 rounded transition ${showBB ? 'bg-rose-400/20 text-rose-300 font-bold' : 'text-slate-500 line-through'}`}
            >
              BB (20,2)
            </button>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 font-mono">
            <button
              onClick={() => setActiveSubChart('RSI')}
              className={`px-2.5 py-1 rounded-md transition ${activeSubChart === 'RSI' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setActiveSubChart('MACD')}
              className={`px-2.5 py-1 rounded-md transition ${activeSubChart === 'MACD' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              MACD
            </button>
          </div>
        </div>
      </div>

      {/* Hover Info Header */}
      {currentHoverBar && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
          <span className="text-slate-400">Tanggal: <strong className="text-white">{currentHoverBar.time}</strong></span>
          <span className="text-slate-400">O: <strong className="text-white">Rp {currentHoverBar.open.toLocaleString('id-ID')}</strong></span>
          <span className="text-slate-400">H: <strong className="text-white">Rp {currentHoverBar.high.toLocaleString('id-ID')}</strong></span>
          <span className="text-slate-400">L: <strong className="text-white">Rp {currentHoverBar.low.toLocaleString('id-ID')}</strong></span>
          <span className="text-slate-400">C: <strong className={currentHoverBar.close >= currentHoverBar.open ? 'text-emerald-400' : 'text-rose-400'}>
            Rp {currentHoverBar.close.toLocaleString('id-ID')}
          </strong></span>
          <span className="text-slate-400">Vol: <strong className="text-cyan-300">{(currentHoverBar.volume / 1000000).toFixed(2)}M</strong></span>
          {showEma9 && series.ema9[currentHoverIndex] && (
            <span className="text-amber-400 font-medium">EMA9: {Math.round(series.ema9[currentHoverIndex]!)}</span>
          )}
          {showEma20 && series.ema20[currentHoverIndex] && (
            <span className="text-cyan-400 font-medium">EMA20: {Math.round(series.ema20[currentHoverIndex]!)}</span>
          )}
        </div>
      )}

      {/* Main SVG Candlestick Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${mainHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;
            const index = Math.min(bars.length - 1, Math.max(0, Math.floor((mouseX - padding.left) / barSpacing)));
            setHoverIndex(index);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Background Grid Lines */}
          {gridPrices.map((price, i) => {
            const y = getY(price);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={width - padding.right + 6} y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace">
                  {Math.round(price)}
                </text>
              </g>
            );
          })}

          {/* Volume Bars (Translucent Bottom Overlay) */}
          {bars.map((bar, i) => {
            const x = getX(i);
            const y = getVolY(bar.volume);
            const height = mainHeight - padding.bottom - y;
            const isBullish = bar.close >= bar.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(1, height)}
                fill={isBullish ? '#10b981' : '#f43f5e'}
                opacity={0.25}
              />
            );
          })}

          {/* Bollinger Bands Overlay */}
          {showBB && (
            <>
              <path d={createPath(series.bbUpper)} fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" opacity={0.6} />
              <path d={createPath(series.bbLower)} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" opacity={0.6} />
            </>
          )}

          {/* EMA Curves */}
          {showEma200 && <path d={createPath(series.ema200)} fill="none" stroke="#10b981" strokeWidth="1.5" />}
          {showEma50 && <path d={createPath(series.ema50)} fill="none" stroke="#c084fc" strokeWidth="1.5" />}
          {showEma20 && <path d={createPath(series.ema20)} fill="none" stroke="#22d3ee" strokeWidth="1.5" />}
          {showEma9 && <path d={createPath(series.ema9)} fill="none" stroke="#fbbf24" strokeWidth="1.5" />}

          {/* Candlesticks */}
          {bars.map((bar, i) => {
            const x = getX(i);
            const openY = getY(bar.open);
            const closeY = getY(bar.close);
            const highY = getY(bar.high);
            const lowY = getY(bar.low);
            const isBullish = bar.close >= bar.open;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

            return (
              <g key={`candle-${i}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isBullish ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - barWidth / 2}
                  y={bodyTop}
                  width={barWidth}
                  height={bodyHeight}
                  fill={isBullish ? '#10b981' : '#f43f5e'}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Crosshair Cursor */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={mainHeight - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={getY(bars[hoverIndex].close)}
                x2={width - padding.right}
                y2={getY(bars[hoverIndex].close)}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={width - padding.right + 2}
                y={getY(bars[hoverIndex].close) - 9}
                width="58"
                height="18"
                fill="#0284c7"
                rx="3"
              />
              <text
                x={width - padding.right + 6}
                y={getY(bars[hoverIndex].close) + 3}
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {bars[hoverIndex].close}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Sub-chart: RSI or MACD */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1 px-1">
          <span className="font-semibold text-slate-300">
            {activeSubChart === 'RSI' ? 'RSI (14) Momentum Oscillator' : 'MACD (12, 26, 9)'}
          </span>
          {activeSubChart === 'RSI' && series.rsi[currentHoverIndex] && (
            <span className="text-cyan-400 font-bold">RSI: {series.rsi[currentHoverIndex]?.toFixed(1)}</span>
          )}
          {activeSubChart === 'MACD' && series.macdLine[currentHoverIndex] && (
            <span className="text-purple-400 font-bold">
              Hist: {series.macdHist[currentHoverIndex]?.toFixed(1)} | MACD: {series.macdLine[currentHoverIndex]?.toFixed(1)}
            </span>
          )}
        </div>

        <svg viewBox={`0 0 ${width} ${subHeight}`} className="w-full h-auto">
          {activeSubChart === 'RSI' ? (
            <>
              {/* RSI Threshold Lines */}
              <line x1={padding.left} y1={getSubY(70, 0, 100)} x2={width - padding.right} y2={getSubY(70, 0, 100)} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.6} />
              <text x={width - padding.right + 4} y={getSubY(70, 0, 100) + 3} fill="#f43f5e" fontSize="9" fontFamily="monospace">70 OB</text>

              <line x1={padding.left} y1={getSubY(50, 0, 100)} x2={width - padding.right} y2={getSubY(50, 0, 100)} stroke="#475569" strokeDasharray="2 2" opacity={0.5} />

              <line x1={padding.left} y1={getSubY(30, 0, 100)} x2={width - padding.right} y2={getSubY(30, 0, 100)} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
              <text x={width - padding.right + 4} y={getSubY(30, 0, 100) + 3} fill="#10b981" fontSize="9" fontFamily="monospace">30 OS</text>

              {/* RSI Curve */}
              {(() => {
                let path = '';
                for (let i = 0; i < series.rsi.length; i++) {
                  const val = series.rsi[i];
                  if (val !== null) {
                    const x = getX(i);
                    const y = getSubY(val, 0, 100);
                    path += path === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
                  }
                }
                return <path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.6" />;
              })()}
            </>
          ) : (
            <>
              {/* MACD Zero Line */}
              <line x1={padding.left} y1={subHeight / 2} x2={width - padding.right} y2={subHeight / 2} stroke="#475569" strokeDasharray="2 2" />

              {/* MACD Histogram */}
              {series.macdHist.map((val, i) => {
                if (val === null) return null;
                const x = getX(i);
                const zeroY = subHeight / 2;
                const clampedVal = Math.max(-50, Math.min(50, val));
                const barH = (clampedVal / 50) * (subHeight / 2 - 10);
                const isPositive = val >= 0;

                return (
                  <rect
                    key={`hist-${i}`}
                    x={x - barWidth / 2}
                    y={isPositive ? zeroY - barH : zeroY}
                    width={barWidth}
                    height={Math.max(1, Math.abs(barH))}
                    fill={isPositive ? '#10b981' : '#f43f5e'}
                    opacity={0.8}
                  />
                );
              })}
            </>
          )}

          {/* Sub-chart hover crosshair */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={5}
              x2={getX(hoverIndex)}
              y2={subHeight - 5}
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
