import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, max_tokens, temperature } = body
    
    console.log('Anthropic API request:', { model, messages: messages?.length, max_tokens, temperature })
    
    // Get API key from headers or environment
    const apiKey = request.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      console.error('No API key provided')
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages array:', messages)
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      )
    }
    
    if (!model) {
      console.error('No model specified')
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      )
    }

    // Separate system messages from user/assistant messages
    const systemMessages = messages.filter(msg => msg.role === 'system')
    const conversationMessages = messages.filter(msg => msg.role !== 'system')
    
    // Combine system messages into a single system parameter
    const systemContent = systemMessages.map(msg => msg.content).join('\n\n')
    
    const requestBody: any = {
      model,
      messages: conversationMessages,
      max_tokens: max_tokens || 1024,
      temperature: temperature || 1
    }
    
    // Add system parameter if there are system messages
    if (systemContent.trim()) {
      requestBody.system = systemContent
    }
    
    console.log('Anthropic request body:', { ...requestBody, messages: requestBody.messages.length })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Anthropic API error:', response.status, errorData)
        
        let errorMessage = 'Failed to generate response from Anthropic'
        try {
          const parsedError = JSON.parse(errorData)
          errorMessage = parsedError.error?.message || parsedError.message || errorMessage
        } catch (e) {
          // If error is not JSON, use the raw text
          errorMessage = errorData || errorMessage
        }
        
        return NextResponse.json(
          { error: errorMessage, details: errorData },
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
    console.error('Anthropic proxy error:', error)
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out' : 'Internal server error' },
      { status: isTimeout ? 504 : 500 }
    )
  }
}