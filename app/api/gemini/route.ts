import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, max_tokens, temperature } = body
    
    // Get API key from headers
    const apiKey = request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg: any) => {
      if (msg.role === 'system') {
        return {
          role: 'user',
          parts: [{ text: `System: ${msg.content}` }]
        }
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }
    })

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: max_tokens,
          temperature
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate response from Gemini' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Convert Gemini response to OpenAI format
    const convertedResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
        }
      }]
    }
    
    return NextResponse.json(convertedResponse)
    
  } catch (error) {
    console.error('Gemini proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}