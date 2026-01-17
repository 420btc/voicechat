import { NextRequest, NextResponse } from 'next/server'

// Proxy para Qwen vía DashScope en modo compatible con OpenAI
// Endpoint internacional (Singapur). Para China, usar: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
const DASHCOPE_COMPAT_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, max_tokens, temperature } = body

    // Obtener API key desde cabeceras
    const apiKey = request.headers.get('x-api-key') || process.env.DASHSCOPE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'DashScope API key requerida (x-api-key o env DASHSCOPE_API_KEY)' },
        { status: 401 }
      )
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages es requerido y no debe estar vacío' },
        { status: 400 }
      )
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model es requerido' },
        { status: 400 }
      )
    }

    // Construir payload compatible con OpenAI (DashScope lo soporta)
    const payload: any = {
      model,
      messages,
      ...(typeof max_tokens === 'number' ? { max_tokens } : { max_tokens: 4096 }),
      ...(typeof temperature === 'number' ? { temperature } : { temperature: 0.7 })
    }

    const controller = new AbortController()
    const timeoutMs = typeof max_tokens === 'number' && max_tokens > 4096 ? 180000 : 60000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(DASHCOPE_COMPAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('DashScope API error:', errorData)
        return NextResponse.json(
          { error: 'No se pudo generar respuesta desde Qwen/DashScope' },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'La solicitud excedió el tiempo de espera (60s)' },
          { status: 504 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Qwen proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}