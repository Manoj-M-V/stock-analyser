import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function BuySellSignals() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy/Sell Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Current Signal:</span>
            <Badge variant="outline" className="bg-green-100 text-green-800">Buy</Badge>
          </div>
          <div>
            <p className="font-semibold">Technical Indicators:</p>
            <ul className="list-disc list-inside">
              <li>RSI: 65 (Neutral)</li>
              <li>MACD: Bullish Crossover</li>
              <li>Moving Averages: Above 50-day MA</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

