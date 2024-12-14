"use client"

import { useState, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const GeminiAnalysis = forwardRef(({ symbol }, ref) => {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const performAnalysis = async () => {
    if (!symbol) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/gemini-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      })
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      setAnalysis(data.analysis)
    } catch (error) {
      console.error('Error performing Gemini analysis:', error)
      setAnalysis('Error performing analysis. Please try again.')
    }
    setLoading(false)
  }

  // Expose performAnalysis method to parent component
  useImperativeHandle(ref, () => ({
    performAnalysis
  }))

  return (
    <Card className="mt-6 min-w-[47rem]">
      <CardHeader>
        <CardTitle>Gemini AI Stock Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading analysis...</p>}
        {analysis && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Analysis Results:</h3>
            <div dangerouslySetInnerHTML={{ __html: analysis.replace("```html", "").replace("```","") }} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})

GeminiAnalysis.displayName = 'GeminiAnalysis'