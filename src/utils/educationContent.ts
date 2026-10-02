export interface IndicatorGuide {
  id: string;
  name: string;
  category: 'teknikal' | 'fundamental';
  shortDesc: string;
  formula: string;
  interpretation: string;
  bullishSignal: string;
  bearishSignal: string;
  bestPractices: string[];
}

export interface KillerRecipe {
  id: string;
  title: string;
  badge: string;
  targetTrader: string;
  description: string;
  criteriaTechnical: string[];
  criteriaFundamental: string[];
  howItWorks: string;
  entryRule: string;
  exitRule: string;
  filters: {
    rsiMin?: number;
    rsiMax?: number;
    rvolMin?: number;
    perMax?: number;
    roeMin?: number;
    derMax?: number;
    divYieldMin?: number;
    macdStatus?: string;
    emaTrend?: string;
    bandarStatus?: string;
  };
}

export const TECHNICAL_GUIDES: IndicatorGuide[] = [
  {
    id: 'rsi',
    name: 'RSI (Relative Strength Index)',
    category: 'teknikal',
    shortDesc: 'Osilator momentum yang mengukur kecepatan dan perubahan pergerakan harga saham dalam skala 0 sampai 100.',
    formula: 'RSI = 100 - [100 / (1 + (Rata-rata Keuntungan / Rata-rata Kerugian))] periode standar 14 hari.',
    interpretation: 'Level di bawah 30 menandakan kondisi Jenuh Jual (Oversold), sedangkan di atas 70 menandakan Jenuh Beli (Overbought). Pada uptrend kuat, zona 45-65 sering menjadi area pantulan (support momentum).',
    bullishSignal: 'Bullish Divergence (harga membuat lower low, RSI membuat higher low) atau saat RSI memotong ke atas level 50 mengonfirmasi transisi momentum positif.',
    bearishSignal: 'Bearish Divergence (harga membuat higher high, RSI membuat lower high) atau saat RSI menukik tembus ke bawah level 50.',
    bestPractices: [
      'Jangan langsung beli hanya karena RSI < 30 pada saham yang sedang downtrend parah, tunggu konfirmasi reversal candlestick.',
      'Kombinasikan dengan indikator Volume (RVOL) dan Trend EMA untuk menyaring false signal.',
      'Gunakan RSI untuk menentukan take profit bertahap ketika memasuki zona di atas 75.'
    ]
  },
  {
    id: 'macd',
    name: 'MACD (Moving Average Convergence Divergence)',
    category: 'teknikal',
    shortDesc: 'Indikator trend-following dan momentum yang menunjukkan hubungan antara dua rata-rata bergerak (EMA 12 dan EMA 26).',
    formula: 'MACD Line = EMA(12) - EMA(26); Signal Line = EMA(9) dari MACD Line; Histogram = MACD Line - Signal Line.',
    interpretation: 'Histogram positif (di atas garis nol) menandakan momentum buyer dominan, sedangkan histogram negatif menandakan tekanan seller. Crossover garis MACD dan Signal adalah pemicu sinyal utama.',
    bullishSignal: 'Golden Cross (garis MACD memotong ke atas garis Signal), terutama jika terjadi di dekat atau sedikit di bawah garis nol.',
    bearishSignal: 'Death Cross (garis MACD memotong ke bawah garis Signal) dengan histogram merah yang kian melebar.',
    bestPractices: [
      'Golden Cross yang terjadi di atas garis nol (zero-line) memiliki probabilitas keberhasilan lebih tinggi untuk swing trade.',
      'Histogram yang mulai mengecil (warna memudar) sering menjadi sinyal awal bahwa momentum mulai jenuh sebelum crossover terjadi.',
      'Sangat efektif dikombinasikan dengan breakout resistance horizontal.'
    ]
  },
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands (BB)',
    category: 'teknikal',
    shortDesc: 'Pita volatilitas statistik yang ditempatkan 2 standar deviasi di atas dan di bawah SMA 20 periode.',
    formula: 'Middle Band = SMA(20); Upper Band = SMA(20) + (2 x Standar Deviasi); Lower Band = SMA(20) - (2 x Standar Deviasi).',
    interpretation: 'Ketika pita menyempit (Bollinger Squeeze), menandakan volatilitas sedang sangat rendah dan sering mendahului ledakan harga besar (breakout). Sekitar 95% pergerakan harga berada di dalam pita.',
    bullishSignal: 'Harga memantul kuat dari Lower Band dengan pola candle bullish (Hammer/Engulfing) atau breakout menembus Upper Band diiringi lonjakan volume.',
    bearishSignal: 'Harga gagal menembus Upper Band dan berbalik menembus ke bawah Middle Band (SMA 20).',
    bestPractices: [
      'Gunakan Bandwidth % untuk mendeteksi saham yang sedang berkonsolidasi rapat menjelang lonjakan harga.',
      'Jangan anggap harga menyentuh Upper Band selalu sinyal jual; pada trend sangat kuat, harga bisa "berjalan di atas pita" (walking the bands).'
    ]
  },
  {
    id: 'moving_averages',
    name: 'Moving Averages (EMA 9, 20, 50, 200)',
    category: 'teknikal',
    shortDesc: 'Garis rata-rata pergerakan harga eksponensial yang memberi bobot lebih besar pada harga terbaru.',
    formula: 'EMA = (Harga Hari Ini x Pengali) + (EMA Kemarin x (1 - Pengali)), di mana Pengali = 2 / (Periode + 1).',
    interpretation: 'EMA 200 adalah penentu tren jangka panjang (di atas = Bull Market, di bawah = Bear Market). EMA 20 dan 50 adalah penopang tren menengah (swing), sedangkan EMA 9 adalah panduan momentum cepat.',
    bullishSignal: 'Golden Cross (EMA pendek memotong ke atas EMA panjang) dan susunan rapi berurutan: Harga > EMA 9 > EMA 20 > EMA 50 > EMA 200.',
    bearishSignal: 'Death Cross dan harga terlempar ke bawah EMA 50 atau EMA 200 yang berubah fungsi menjadi resistance tebal.',
    bestPractices: [
      'Gunakan EMA 20 sebagai level trailing stop dinamis untuk memaksimalkan keuntungan pada saham yang sedang trending kuat.',
      'Hindari mengambil posisi agresif jika harga berada jauh di bawah EMA 200.'
    ]
  },
  {
    id: 'rvol_volume',
    name: 'Volume & Relative Volume (RVOL)',
    category: 'teknikal',
    shortDesc: 'Bahan bakar dari setiap pergerakan harga saham di bursa. RVOL membandingkan volume hari ini dengan rata-rata volume 20 hari.',
    formula: 'RVOL = Volume Hari Ini / Rata-rata Volume 20 Hari Terakhir.',
    interpretation: 'Pergerakan harga tanpa volume adalah manipulasi atau ilusi. Kenaikan harga dengan RVOL > 1.5x menandakan partisipasi institusi besar (smart money), bukan hanya ritel.',
    bullishSignal: 'Breakout resistance penting dengan RVOL > 2.0x (Volume Spike terkonfirmasi).',
    bearishSignal: 'Harga naik tipis tetapi volume mengering (divergensi negatif volume) atau harga turun tajam dengan volume masif (distribusi).',
    bestPractices: [
      'Selalu cek apakah volume kenaikan lebih besar daripada volume saat koreksi/pullback.',
      'RVOL di atas 2.5x saat jam buka (sesi 1) sering menandakan saham berpotensi ARA (Auto Rejection Atas).'
    ]
  },
  {
    id: 'bandarmologi',
    name: 'Bandarmologi & Wyckoff Phase Flow',
    category: 'teknikal',
    shortDesc: 'Analisa jejak akumulasi dan distribusi dari pelaku pasar bermodal besar (institusi/asing/bandar) di Bursa Efek Indonesia.',
    formula: 'Dihitung dari rasio Top Buyer vs Top Seller broker summary, On-Balance Volume (OBV), dan pergerakan Foreign Net Flow.',
    interpretation: 'Siklus pasar dibagi menjadi 4 tahap Wyckoff: Akumulasi (Phase B/C), Markup Tren Naik (Phase D/E), Distribusi, dan Markdown Tren Turun.',
    bullishSignal: 'Status Big Accumulation di mana 3 broker teratas memborong lebih dari 60% total volume harian dan Asing konsisten Net Buy.',
    bearishSignal: 'Status Big Distribution di mana broker institusi melepas barang secara konsisten ke broker ritel (YP, XC, XL, PD).',
    bestPractices: [
      'Cari saham yang berada di Fase C (Spring) atau Fase D (Sign of Strength) untuk mendapatkan timing entry terbaik sebelum lonjakan harga.',
      'Perhatikan pergerakan broker asing (AK, BK, ZP, RX) pada saham bluechip LQ45.'
    ]
  }
];

export const FUNDAMENTAL_GUIDES: IndicatorGuide[] = [
  {
    id: 'per',
    name: 'P/E Ratio (Price to Earnings)',
    category: 'fundamental',
    shortDesc: 'Rasio valuasi yang membandingkan harga pasar saham saat ini dengan laba bersih per lembar saham (EPS).',
    formula: 'PER = Harga Saham / Laba Bersih Per Saham (EPS).',
    interpretation: 'Menunjukkan berapa rupiah yang rela dibayar investor untuk setiap 1 rupiah laba perusahaan. PER rendah (< 12x) mengindikasikan valuasi murah, asalkan diiringi pertumbuhan laba yang stabil.',
    bullishSignal: 'Saham dengan fundamental kuat dan pertumbuhan laba double-digit yang diperdagangkan pada PER di bawah rata-rata historis 5 tahunnya.',
    bearishSignal: 'PER melonjak tinggi (> 40x) tanpa diimbangi pertumbuhan laba yang memadai, menandakan harga sudah overvalued.',
    bestPractices: [
      'Bandingkan PER dengan emiten sejenis di sektor yang sama (peer comparison), bukan lintas sektor.',
      'Waspadai PER yang tampak sangat rendah karena adanya laba non-operasional satu kali (one-off gain) seperti penjualan aset.'
    ]
  },
  {
    id: 'pbv',
    name: 'PBV (Price to Book Value)',
    category: 'fundamental',
    shortDesc: 'Rasio yang membandingkan nilai pasar saham dengan nilai buku ekuitas per lembar saham.',
    formula: 'PBV = Harga Saham / (Total Ekuitas / Jumlah Saham Beredar).',
    interpretation: 'PBV < 1.0 berarti saham diperdagangkan di bawah nilai aset bersihnya jika perusahaan dilikuidasi. Sangat krusial untuk menganalisa sektor perbankan, properti, dan manufaktur.',
    bullishSignal: 'Emiten sehat dengan ROE tinggi (> 15%) namun masih dihargai pada PBV wajar (< 1.5x).',
    bearishSignal: 'PBV sangat tinggi (> 5x) pada perusahaan dengan aset fisik besar dan perolehan laba yang stagnan.',
    bestPractices: [
      'PBV di bawah 1x tidak otomatis menjadi "bargain" jika perusahaan terus merugi dan mengikis nilai bukunya (Value Trap).',
      'Untuk perbankan, rasio PBV berbanding lurus dengan kemampuan mencetak ROE.'
    ]
  },
  {
    id: 'roe',
    name: 'ROE (Return on Equity)',
    category: 'fundamental',
    shortDesc: 'Metrik profitabilitas paling penting yang mengukur efisiensi manajemen dalam menghasilkan laba dari modal pemegang saham.',
    formula: 'ROE (%) = (Laba Bersih / Total Ekuitas) x 100%.',
    interpretation: 'Standar emas investor Warren Buffett. Emiten dengan ROE konsisten di atas 15% menunjukkan keunggulan kompetitif yang kuat (Economic Moat).',
    bullishSignal: 'ROE konsisten > 15-20% selama minimal 3-5 tahun berturut-turut dengan rasio utang (DER) yang terkendali.',
    bearishSignal: 'ROE mengalami tren penurunan tajam YoY atau bernilai negatif karena kerugian operasional.',
    bestPractices: [
      'Cek apakah ROE tinggi disebabkan oleh laba operasional riil atau karena utang yang terlalu besar (financial leverage tinggi).',
      'Kombinasikan emiten ROE tinggi dengan timing entri teknikal saat harga sedang terkoreksi ke support kuat.'
    ]
  },
  {
    id: 'der',
    name: 'DER (Debt to Equity Ratio)',
    category: 'fundamental',
    shortDesc: 'Rasio solvabilitas yang membandingkan total liabilitas/utang berbunga dengan modal bersih perusahaan.',
    formula: 'DER = Total Utang / Total Ekuitas.',
    interpretation: 'Mengukur tingkat risiko keuangan perusahaan. DER < 1.0x menandakan posisi keuangan yang sangat aman dan tahan terhadap guncangan kenaikan suku bunga.',
    bullishSignal: 'DER rendah (< 0.8x) disertai rasio kas yang melimpah, menjamin kelangsungan dividen dan ekspansi tanpa beban bunga berat.',
    bearishSignal: 'DER > 2.0x (di luar sektor perbankan/keuangan) yang menandakan risiko gagal bayar jika terjadi perlambatan ekonomi.',
    bestPractices: [
      'Untuk perbankan, DER biasanya tinggi karena dana pihak ketiga (tabungan/deposito nasabah) dicatat sebagai liabilitas; gunakan rasio CAR dan NPL untuk bank.',
      'Selalu filter DER < 1.0x saat menyeleksi saham untuk swing atau investasi jangka menengah.'
    ]
  },
  {
    id: 'dividend_yield',
    name: 'Dividend Yield & Payout Ratio',
    category: 'fundamental',
    shortDesc: 'Persentase dividen tahunan per lembar saham dibagi dengan harga saham saat ini.',
    formula: 'Dividend Yield (%) = (Dividen Tunai Per Lembar / Harga Saham) x 100%.',
    interpretation: 'Memberikan arus kas pasif (passive cash flow). Yield di atas suku bunga deposito (misal > 5-7% di Indonesia) bertindak sebagai bantalan penahan penurunan harga saham.',
    bullishSignal: 'Emiten bluechip dengan track record pembagian dividen rutin 5 tahun berturut-turut dan Dividend Yield > 5%.',
    bearishSignal: 'Dividend Payout Ratio > 100% yang berarti perusahaan membagikan dividen melebihi laba bersih tahun berjalannya (menguras kas internal).',
    bestPractices: [
      'Waspadai "Dividend Trap", yaitu saham yang turun tajam setelah ex-date melebihi persentase dividen yang dibagikan.',
      'Beli saham dividen beberapa minggu sebelum RUPS untuk memanfaatkan kenaikan harga menjelang cum-date.'
    ]
  }
];

export const KILLER_RECIPES: KillerRecipe[] = [
  {
    id: 'momentum_breakout',
    title: 'Swing Trader Momentum Breakout',
    badge: 'Paling Populer',
    targetTrader: 'Swing Trader (Holding 3 hari - 4 minggu)',
    description: 'Menyaring saham-saham berfundamental sehat yang sedang mematahkan fase konsolidasi dengan dorongan volume besar dan momentum tren yang sangat kuat.',
    criteriaTechnical: [
      'EMA 20 > EMA 50 (Struktur Bullish Trend)',
      'RSI 14 berada di rentang Golden Momentum 52 - 68',
      'Relative Volume (RVOL) > 1.5x (Konfirmasi Lonjakan Transaksi)',
      'MACD Trend Golden Cross atau Histogram Positif'
    ],
    criteriaFundamental: [
      'DER < 1.2x (Neraca Sehat, Beban Utang Rendah)',
      'ROE > 12.0% (Perusahaan Menguntungkan)',
      'PER < 25x (Valuasi Masih Rasional)'
    ],
    howItWorks: 'Dengan memadukan tren EMA menengah dan ledakan volume di atas rata-rata 20 hari, Anda terhindar dari saham "tidur". Syarat DER dan ROE memastikan bahwa emiten bukan saham gorengan yang rentan dibanting secara tiba-tiba.',
    entryRule: 'Beli saat harga menembus Resistance 1 atau saat pullback sehat mendekati EMA 9 / EMA 20.',
    exitRule: 'Take Profit bertahap di TP1 (+5% sd +8%) dan TP2 (+12% sd +18%). Pasang Stop Loss ketat di 1 tick di bawah swing low atau maksimal 4-5% dari harga beli.',
    filters: {
      rsiMin: 50,
      rsiMax: 68,
      rvolMin: 1.5,
      roeMin: 12,
      derMax: 1.2,
      perMax: 25,
      emaTrend: 'Bullish'
    }
  },
  {
    id: 'value_reversal',
    title: 'Value Investing with Bullish Reversal',
    badge: 'Low Risk - High Reward',
    targetTrader: 'Position Trader / Investor Jangka Menengah (3 - 12 bulan)',
    description: 'Mencari "Mutiara Terpendam" — saham berfundamental luar biasa dengan valuasi sangat murah (undervalued) yang baru saja menyelesaikan fase jenuh jual dan mulai berbalik arah naik.',
    criteriaTechnical: [
      'RSI 14 di bawah 38 atau Bullish Divergence terkonfirmasi',
      'Harga mendekati Support Kuat / Bollinger Band Bawah',
      'Wyckoff Phase C (Spring / Shakeout) atau Phase B Accumulation'
    ],
    criteriaFundamental: [
      'P/E Ratio (PER) < 12.0x',
      'PBV < 1.5x (Murah secara nilai buku)',
      'ROE > 14.0% (Efisiensi laba tinggi)',
      'Dividend Yield > 4.0% (Bantalan dividen royal)'
    ],
    howItWorks: 'Strategi ini melindungi modal Anda melalui Margin of Safety yang lebar dari sisi valuasi dan dividen. Anda masuk tepat ketika kepanikan pasar mereda dan pembalikan arah mulai terbentuk.',
    entryRule: 'Beli bertahap (Dollar Cost Averaging / Piramida) di area Support 1 & 2 saat muncul candlestick Hammer atau Bullish Engulfing.',
    exitRule: 'Target take profit di Fair Value saham (potensi upside 20% - 40%). Stop loss diletakkan jika harga menembus support breakdown lebih dari 6%.',
    filters: {
      rsiMin: 20,
      rsiMax: 45,
      perMax: 12,
      roeMin: 14,
      divYieldMin: 4.0,
      derMax: 1.0
    }
  },
  {
    id: 'bandar_detector',
    title: 'Early Smart Money & Bandar Accumulation',
    badge: 'Follow The Giant',
    targetTrader: 'Swing & Trend Follower',
    description: 'Mendeteksi saham yang sedang dikoleksi secara diam-diam oleh institusi dan investor asing sebelum harga diledakkan ke publik.',
    criteriaTechnical: [
      'Status Bandarmologi "Big Accumulation" atau "Normal Accumulation"',
      'On-Balance Volume (OBV) naik stabil saat harga sideways',
      'Bandwidth Bollinger Bands menyempit (< 12%) menandakan konsolidasi rapat'
    ],
    criteriaFundamental: [
      'Market Cap > Rp 10 Triliun (Saham berkapitalisasi likuid)',
      'Laba bersih bertumbuh YoY positif'
    ],
    howItWorks: 'Institusi besar tidak bisa membeli saham sekaligus tanpa mengerek harga. Mereka melakukan akumulasi bertahap dalam rentang harga sempit. Indikator OBV dan Broker Summary mengungkap aktivitas ini.',
    entryRule: 'Beli saat harga berkonsolidasi di dekat batas bawah sideways sebelum terjadi breakout volume.',
    exitRule: 'Hold selama status akumulasi bertahan. Jual jika muncul sinyal distribusi masif atau target kenaikan 15-25% tercapai.',
    filters: {
      bandarStatus: 'Big Accumulation',
      rvolMin: 1.1,
      rsiMin: 45,
      rsiMax: 65
    }
  },
  {
    id: 'ara_hunter',
    title: 'ARA Hunter & Fast Scalper',
    badge: 'High Volatility',
    targetTrader: 'Day Trader & Scalper (Intraday s/d 2 hari)',
    description: 'Menemukan saham dengan lonjakan volume fantastis dan dorongan momentum ekstrem yang berpeluang mengunci harga di batas Auto Rejection Atas (ARA 20%-35%).',
    criteriaTechnical: [
      'RVOL > 2.5x rata-rata 20 hari',
      'Harga berada di atas Intraday VWAP',
      'MACD Histogram hijau menjulang tinggi',
      'Stochastic %K memotong ke atas %D di atas level 60'
    ],
    criteriaFundamental: [
      'Free Float > 15% (Likuiditas perdagangan lancar)'
    ],
    howItWorks: 'Memanfaatkan euforia pembeli dan dorongan likuiditas masif pada sesi pagi bursa. Saham yang mampu bertahan di atas VWAP dengan volume raksasa memiliki probabilitas tinggi untuk terus diangkat hingga sesi sore.',
    entryRule: 'Entry cepat pada saat penembusan High sesi 1 atau breakout resistance terdekat.',
    exitRule: 'Jual saat harga menyentuh ARA atau pasang trailing stop 2-3 tick di bawah fraksi harga berjalan.',
    filters: {
      rvolMin: 2.5,
      rsiMin: 60,
      rsiMax: 85
    }
  }
];
