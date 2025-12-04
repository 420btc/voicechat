import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, max_tokens, temperature } = body
    
    // Get API key from headers or environment
    const apiKey = request.headers.get('x-api-key') || process.env.DEEPSEEK_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens,
          temperature
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('DeepSeek API error:', errorData)
        return NextResponse.json(
          { error: 'Failed to generate response from DeepSeek', details: errorData },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
    
  } catch (error) {
    console.error('DeepSeek proxy error:', error)
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out' : 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: isTimeout ? 504 : 500 }
    )
  }
}