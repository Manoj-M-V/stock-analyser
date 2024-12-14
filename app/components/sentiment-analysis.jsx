import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function SentimentAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Overall Sentiment:</span>
              <span className="font-semibold text-green-600">Positive</span>
            </div>
            <Progress value={75} className="w-full" />
          </div>
          <div>
            <p className="font-semibold mb-2">Sentiment Breakdown:</p>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>Positive:</span>
                <span>75%</span>
              </li>
              <li className="flex justify-between">
                <span>Neutral:</span>
                <span>20%</span>
              </li>
              <li className="flex justify-between">
                <span>Negative:</span>
                <span>5%</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

