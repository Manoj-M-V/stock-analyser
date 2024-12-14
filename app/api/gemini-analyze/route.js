import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)

// Polygon.io API key
const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY

async function fetchNewsData(symbol) {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fromDate = twoWeeksAgo.toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];
  
  const newsUrl = `https://api.polygon.io/v2/reference/news?ticker=${symbol}&published_utc.gte=${fromDate}&published_utc.lte=${toDate}&limit=50&sort=published_utc&apiKey=${POLYGON_API_KEY}`;
  
  const response = await fetch(newsUrl);
  const data = await response.json();
  
  return data.results || [];
}

async function analyzeSentiment(text) {
  const positiveWords = new Set(['growth', 'profit', 'increase', 'up', 'higher', 'positive', 'success', 'strong', 'gain', 'improved']);
  const negativeWords = new Set(['loss', 'decline', 'decrease', 'down', 'lower', 'negative', 'weak', 'fail', 'poor', 'risk']);
  
  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return 'neutral';
  
  const score = (positiveCount - negativeCount) / total;
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

async function calculateNewsSentiment(newsArticles) {
  let sentimentScores = await Promise.all(
    newsArticles.map(article => analyzeSentiment(article.description + ' ' + article.title))
  );
  
  const sentimentCounts = sentimentScores.reduce((acc, sentiment) => {
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {});
  
  const total = sentimentScores.length;
  const positivePercentage = ((sentimentCounts.positive || 0) / total) * 100;
  const negativePercentage = ((sentimentCounts.negative || 0) / total) * 100;
  const neutralPercentage = ((sentimentCounts.neutral || 0) / total) * 100;
  
  return {
    overall: positivePercentage > negativePercentage + 10 ? 'positive' : 
            negativePercentage > positivePercentage + 10 ? 'negative' : 'neutral',
    details: {
      positive: positivePercentage.toFixed(1) + '%',
      negative: negativePercentage.toFixed(1) + '%',
      neutral: neutralPercentage.toFixed(1) + '%'
    }
  };
}

async function analyzeVolatility(symbol) {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate}?adjusted=true&sort=asc&limit=120&apiKey=${POLYGON_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.results || !data.results.length) {
    return { volatility: 'N/A', averageVolume: 'N/A' };
  }
  
  const dailyChanges = data.results.map((day, i, arr) => {
    if (i === 0) return 0;
    return Math.abs((day.c - arr[i-1].c) / arr[i-1].c * 100);
  }).slice(1);
  
  const avgVolatility = dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length;
  const avgVolume = data.results.reduce((sum, day) => sum + day.v, 0) / data.results.length;
  
  return {
    volatility: avgVolatility,
    averageVolume: avgVolume
  };
}

async function determineOptimalTradingStyle(stockData, volatilityData) {
  const factors = {
    intraday: 0,
    swing: 0
  };
  
  // Volatility analysis
  if (volatilityData.volatility !== 'N/A') {
    if (volatilityData.volatility > 2) {
      factors.intraday += 2;
    } else {
      factors.swing += 1;
    }
  }
  
  // Volume analysis
  if (volatilityData.averageVolume > 1000000) {
    factors.intraday += 1;
  }
  
  // RSI analysis
  if (stockData.rsi !== 'N/A') {
    const rsi = parseFloat(stockData.rsi);
    if (rsi < 30 || rsi > 70) {
      factors.intraday += 1;
    } else {
      factors.swing += 1;
    }
  }
  
  // MACD analysis
  if (stockData.macd.histogram !== 'N/A') {
    const histogram = Math.abs(stockData.macd.histogram);
    if (histogram > 0.5) {
      factors.intraday += 1;
    } else {
      factors.swing += 1;
    }
  }
  
  // Bollinger Bands analysis
  if (stockData.bbands.upper !== 'N/A' && stockData.bbands.lower !== 'N/A') {
    const bandWidth = ((stockData.bbands.upper - stockData.bbands.lower) / stockData.bbands.middle) * 100;
    if (bandWidth > 4) {
      factors.intraday += 1;
    } else {
      factors.swing += 1;
    }
  }
  
  // Sentiment analysis impact
  if (stockData.sentiment.newsSentiment.overall === stockData.sentiment.socialMediaSentiment.overall) {
    factors.swing += 1;
  } else {
    factors.intraday += 1;
  }
  
  return {
    recommendedStyle: factors.intraday > factors.swing ? 'intraday' : 'swing',
    confidence: Math.abs(factors.intraday - factors.swing) / (factors.intraday + factors.swing) * 100,
    factors: {
      intraday: factors.intraday,
      swing: factors.swing
    },
    reasoning: {
      volatility: volatilityData.volatility > 2 ? 'High volatility favors intraday trading' : 'Moderate volatility suits swing trading',
      volume: volatilityData.averageVolume > 1000000 ? 'High volume supports intraday trading' : 'Average volume better for swing trading',
      technicals: `Technical indicators suggest ${factors.intraday > factors.swing ? 'shorter' : 'longer'} holding periods`,
      sentiment: stockData.sentiment.newsSentiment.overall === stockData.sentiment.socialMediaSentiment.overall ? 
        'Consistent sentiment supports swing trading' : 'Mixed sentiment suggests intraday opportunities'
    }
  };
}

async function fetchStockData(symbol) {
  const urls = [
    `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`,
    `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=50&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`,
    `https://api.polygon.io/v1/indicators/rsi/${symbol}?timespan=day&adjusted=true&window=14&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`,
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`,
    `https://api.polygon.io/v1/indicators/macd/${symbol}?timespan=day&adjusted=true&short_window=12&long_window=26&signal_window=9&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`,
    `https://api.polygon.io/v1/indicators/bbands/${symbol}?timespan=day&adjusted=true&window=20&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`,
    `https://api.polygon.io/v1/indicators/ema/${symbol}?timespan=day&adjusted=true&window=20&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`,
  ];

  const responses = await Promise.all(urls.map(url => fetch(url)));
  
  const data = await Promise.all(
    responses.map(async (res, index) => {
      let text = '';
      try {
        text = await res.text();
        return JSON.parse(text);
      } catch (error) {
        console.error(`Error parsing JSON from API ${index + 1}:`, error);
        console.error(`Response text:`, text);
        return null;
      }
    })
  );

  const [details, sma, rsi, priceData, macd, bbands, ema] = data;

  if (!details || details.status !== 'OK' || !details.results) {
    throw new Error('Invalid stock symbol or API error');
  }

  // Fetch news data and calculate sentiment
  const newsArticles = await fetchNewsData(symbol);
  const newsSentiment = await calculateNewsSentiment(newsArticles);

  // Calculate social media sentiment
  const priceChange = priceData?.results?.[0]?.c - priceData?.results?.[0]?.o;
  const socialMediaSentiment = {
    overall: priceChange > 0 ? 
      (newsSentiment.overall === 'positive' ? 'very positive' : 'positive') :
      priceChange < 0 ? 
      (newsSentiment.overall === 'negative' ? 'very negative' : 'negative') :
      'neutral',
    details: {
      positive: (parseFloat(newsSentiment.details.positive) + (priceChange > 0 ? 10 : 0)).toFixed(1) + '%',
      negative: (parseFloat(newsSentiment.details.negative) + (priceChange < 0 ? 10 : 0)).toFixed(1) + '%',
      neutral: (100 - parseFloat(newsSentiment.details.positive) - parseFloat(newsSentiment.details.negative)).toFixed(1) + '%'
    }
  };

  const stockData = {
    symbol: symbol,
    name: details.results.name,
    description: details.results.description,
    marketCap: details.results.market_cap,
    employees: details.results.total_employees,
    sma50: sma?.results?.values[0]?.value ?? 'N/A',
    rsi: rsi?.results?.values[0]?.value ?? 'N/A',
    currentPrice: priceData?.results?.[0]?.c ?? 'N/A',
    macd: {
      macdLine: macd?.results?.values[0]?.MACD ?? 'N/A',
      signalLine: macd?.results?.values[0]?.signal ?? 'N/A',
      histogram: macd?.results?.values[0]?.histogram ?? 'N/A',
    },
    bbands: {
      upper: bbands?.results?.values[0]?.upper_band ?? 'N/A',
      middle: bbands?.results?.values[0]?.middle_band ?? 'N/A',
      lower: bbands?.results?.values[0]?.lower_band ?? 'N/A',
    },
    ema20: ema?.results?.values[0]?.value ?? 'N/A',
    sentiment: {
      newsSentiment: newsSentiment,
      socialMediaSentiment: socialMediaSentiment
    }
  };

  const volatilityData = await analyzeVolatility(symbol);
  const tradingStyle = await determineOptimalTradingStyle(stockData, volatilityData);

  return {
    ...stockData,
    volatility: volatilityData,
    tradingStyle: tradingStyle
  };
}

export async function POST(req) {
  try {
    const { symbol } = await req.json();
    const stockData = await fetchStockData(symbol);

    const prompt = `
    Analyze the following stock data and provide key insights:
    Symbol: \${stockData.symbol}
    Company Name: \${stockData.name}
    Current Price: $\${typeof stockData.currentPrice === 'number' ? stockData.currentPrice.toFixed(2) : stockData.currentPrice}
    Market Cap: $\${(stockData.marketCap / 1e9).toFixed(2)} billion
    
    Technical Indicators:
    - RSI (14-day): \${typeof stockData.rsi === 'number' ? stockData.rsi.toFixed(2) : stockData.rsi}
    - MACD Line: \${typeof stockData.macd.macdLine === 'number' ? stockData.macd.macdLine.toFixed(4) : stockData.macd.macdLine}
    - Average Daily Volume: \${stockData.volatility.averageVolume !== 'N/A' ? stockData.volatility.averageVolume.toLocaleString() : 'N/A'}
    - Support Level: $\${stockData.keyLevels.support}
    - Resistance Level: $\${stockData.keyLevels.resistance}
    
    Sentiment Analysis:
    - News Sentiment: \${stockData.sentiment.newsSentiment.overall}
    - Social Media Sentiment: \${stockData.sentiment.socialMediaSentiment.overall}
    
    Please provide analysis in the following HTML structure:
    
    <div class="max-w-4xl mx-auto p-4 space-y-6">
      <!-- Executive Summary Card -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Executive Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="font-semibold">Overall Recommendation</h3>
            [Overall bias: Strong Buy/Buy/Hold/Sell/Strong Sell]
          </div>
          <div>
            <h3 class="font-semibold">Market Bias</h3>
            [Bullish/Bearish with key reasons]
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold">Key Factors</h3>
          [Top 3-4 factors influencing the recommendation]
        </div>
      </div>
    
      <!-- Time Horizon Targets -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Time Horizon Analysis</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 class="font-semibold">Short-term (1-5 days)</h3>
            <p>Target: [Price target]</p>
            <p>Risk/Reward: [Ratio]</p>
            <div class="mt-2">
              <p class="text-green-600">Max Profit: [Maximum profit potential]</p>
              <p class="text-red-600">Min Loss: [Minimum loss threshold]</p>
            </div>
          </div>
          <div>
            <h3 class="font-semibold">Medium-term (1-4 weeks)</h3>
            <p>Target: [Price target]</p>
            <p>Risk/Reward: [Ratio]</p>
            <div class="mt-2">
              <p class="text-green-600">Max Profit: [Maximum profit potential]</p>
              <p class="text-red-600">Min Loss: [Minimum loss threshold]</p>
            </div>
          </div>
          <div>
            <h3 class="font-semibold">Long-term (1-6 months)</h3>
            <p>Target: [Price target]</p>
            <p>Risk/Reward: [Ratio]</p>
            <div class="mt-2">
              <p class="text-green-600">Max Profit: [Maximum profit potential]</p>
              <p class="text-red-600">Min Loss: [Minimum loss threshold]</p>
            </div>
          </div>
        </div>
      </div>
    
      <!-- Trading Styles Analysis -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Trading Style Analysis</h2>
        
        <!-- Intraday Trading -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold mb-3">Intraday Trading</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium">Key Levels</h4>
              <p>Support: [Support price levels]</p>
              <p>Resistance: [Resistance price levels]</p>
            </div>
            <div>
              <h4 class="font-medium">Risk/Reward Profile</h4>
              <p>Ratio: [Intraday R/R ratio]</p>
              <p>Stop Loss: [Stop loss level]</p>
              <p>Take Profit: [Take profit level]</p>
              <div class="mt-2">
                <p class="text-green-600">Max Profit Target: [Maximum profit potential]</p>
                <p class="text-red-600">Max Loss Limit: [Maximum loss threshold]</p>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <h4 class="font-medium">Strategy Recommendations</h4>
            [Specific intraday strategies]
          </div>
          <div class="mt-3 p-3 bg-gray-50 rounded">
            <h4 class="font-medium">Profit/Loss Guidelines</h4>
            <p>Suggested position size: [Position size]</p>
            <p>Maximum daily profit target: [Daily profit target]</p>
            <p>Maximum daily loss limit: [Daily loss limit]</p>
            <p>Per-trade profit target: [Per-trade target]</p>
            <p>Per-trade stop loss: [Per-trade stop]</p>
          </div>
        </div>
    
        <!-- Swing Trading -->
        <div>
          <h3 class="text-xl font-semibold mb-3">Swing Trading</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium">Key Levels</h4>
              <p>Support: [Support price levels]</p>
              <p>Resistance: [Resistance price levels]</p>
            </div>
            <div>
              <h4 class="font-medium">Risk/Reward Profile</h4>
              <p>Ratio: [Swing trading R/R ratio]</p>
              <p>Stop Loss: [Stop loss level]</p>
              <p>Take Profit: [Take profit level]</p>
              <div class="mt-2">
                <p class="text-green-600">Max Profit Target: [Maximum profit potential]</p>
                <p class="text-red-600">Max Loss Limit: [Maximum loss threshold]</p>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <h4 class="font-medium">Strategy Recommendations</h4>
            [Specific swing trading strategies]
          </div>
          <div class="mt-3 p-3 bg-gray-50 rounded">
            <h4 class="font-medium">Profit/Loss Guidelines</h4>
            <p>Suggested position size: [Position size]</p>
            <p>Maximum profit target: [Total profit target]</p>
            <p>Maximum loss limit: [Total loss limit]</p>
            <p>Per-trade profit target: [Per-trade target]</p>
            <p>Per-trade stop loss: [Per-trade stop]</p>
          </div>
        </div>
      </div>
    
      <!-- Sentiment Analysis -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Sentiment Analysis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="font-semibold">News Sentiment</h3>
            [Detailed news sentiment analysis]
          </div>
          <div>
            <h3 class="font-semibold">Social Media Sentiment</h3>
            [Detailed social media sentiment analysis]
          </div>
        </div>
        <div class="mt-4">
          <h3 class="font-semibold">Impact Assessment</h3>
          [How sentiment affects trading decisions]
        </div>
      </div>
    
      <!-- Risk Analysis -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">Risk Analysis</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold">Technical Risks</h3>
            [Technical risk factors]
          </div>
          <div>
            <h3 class="font-semibold">Sentiment Risks</h3>
            [Sentiment-based risk factors]
          </div>
          <div>
            <h3 class="font-semibold">Stop Loss Recommendations</h3>
            [Stop loss levels for different trading styles]
          </div>
        </div>
      </div>
    </div>
    
    Provide a comprehensive analysis using this structure, with detailed explanations for each section. Focus on actionable insights and clear reasoning for all recommendations. Include specific price targets, risk/reward ratios, and maximum profit/loss thresholds for each time horizon and trading style.
    `;

  // Generate content using Gemini AI
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const analysis = response.text();

  // Add error handling for empty or invalid responses
  if (!analysis || analysis.trim() === '') {
    throw new Error('Empty analysis received from Gemini');
  }

  // Return the analysis with additional metadata
  return NextResponse.json({
    analysis,
    timestamp: new Date().toISOString(),
    metadata: {
      symbol: stockData.symbol,
      name: stockData.name,
      lastPrice: stockData.currentPrice,
      overallSentiment: stockData.sentiment.newsSentiment.overall
    }
  });

} catch (error) {
  console.error('Error in stock analysis:', error);
  return NextResponse.json({ 
    error: 'Error performing analysis',
    details: error.message,
    timestamp: new Date().toISOString()
  }, { 
    status: 500 
  });
}
}