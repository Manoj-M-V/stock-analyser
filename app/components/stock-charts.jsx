'use client'

import { useRef, useState } from 'react'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { fetchStockData } from '@/actions/fetchStockData'
import { GeminiAnalysis } from './gemini-analysis'

export function StockChart() {
  const [symbol, setSymbol] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Reference to GeminiAnalysis component
  const geminiRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setData([])
    
    try {
      // Fetch stock data
      const stockData = await fetchStockData(symbol)
      if (stockData.length === 0) {
        setError('No data available for this symbol')
      } else {
        setData(stockData)
      }
      
      // Call Gemini analysis
      if (geminiRef.current) {
        await geminiRef.current.performAnalysis()
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex justify-center flex-col items-center'>
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Stock Price Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Data'}
          </Button>
        </form>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {data.length > 0 && (
          <ChartContainer
            config={{
              price: {
                label: "Price",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="var(--color-price)" name="Price" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
    <GeminiAnalysis ref={geminiRef} symbol={symbol} />
    </div>
  )
}