import { StockChart } from './components/stock-charts'
import { 
  LineChart, 
  BarChart3, 
  Activity, 
  Sparkles,
  ArrowUpCircle,
  Bot,
  TrendingUp
} from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white overflow-hidden">
      {/* Background gradient effect - reduced opacity */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/10 to-cyan-900/10" />
      
      {/* Animated gradient orbs - reduced opacity and blur */}
      <div className="fixed top-0 -left-20 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-[120px] animate-pulse" />
      <div className="fixed -bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-[120px] animate-pulse" />

      <div className="relative container mx-auto px-6 py-12">
        {/* Header Section - increased contrast */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-blue-300" />
            <h1 className="text-5xl font-bold text-white">
              AI Stock Analysis
            </h1>
          </div>
          <p className="text-gray-200 text-lg ml-11">
            Powered by ✨ Gemini AI
          </p>
        </div>

        {/* Stats Grid - improved contrast and visibility */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              icon: <Activity className="w-5 h-5" />, 
              label: "Market Status", 
              value: "Active", 
              color: "text-green-300",
            },
            { 
              icon: <BarChart3 className="w-5 h-5" />, 
              label: "Trading Volume", 
              value: "2.4M", 
              color: "text-purple-300",
            },
            { 
              icon: <TrendingUp className="w-5 h-5" />, 
              label: "AI Signals", 
              value: "Bullish", 
              color: "text-blue-300",
            },
            { 
              icon: <ArrowUpCircle className="w-5 h-5" />, 
              label: "Trend", 
              value: "+2.4%", 
              color: "text-cyan-300",
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                <p className="text-gray-100 text-sm font-medium">{stat.label}</p>
              </div>
              <p className={`text-xl font-semibold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Chart Area - improved visibility */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
          <StockChart />
        </div>

        {/* Footer - improved contrast */}
        <div className="mt-8 text-center text-sm text-gray-200">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
            <span className="font-medium">Real-time Market Data • Advanced AI Analytics • Smart Predictions</span>
            <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}