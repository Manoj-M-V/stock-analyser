'use server'

export async function fetchStockData(symbol) {
  const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY is not set')
  }

  // Get dates for last week
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 100)

  // Format dates as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${formatDate(startDate)}/${formatDate(endDate)}?adjusted=true&sort=asc&limit=20&apiKey=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch stock data')
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No data available for this symbol')
    }

    // Transform the data to match your frontend's expected format
    return data.results.map(result => ({
      date: new Date(result.t).toISOString().split('T')[0],
      price: result.c // Using closing price
    }))
  } catch (error) {
    console.error('Error fetching stock data:', error)
    throw new Error(`Failed to fetch stock data: ${error.message}`)
  }
}