import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StockInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Symbol:</p>
            <p>EXAMPLE</p>
          </div>
          <div>
            <p className="font-semibold">Current Price:</p>
            <p>₹160.00</p>
          </div>
          <div>
            <p className="font-semibold">Day Range:</p>
            <p>₹155.00 - ₹165.00</p>
          </div>
          <div>
            <p className="font-semibold">52 Week Range:</p>
            <p>₹100.00 - ₹170.00</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

