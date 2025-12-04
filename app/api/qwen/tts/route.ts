import { NextRequest, NextResponse } from 'next/server'

// Proxy TTS de Qwen vía DashScope (HTTP API)
// Usamos el servicio de multimodal-generation, que acepta modelos TTS
const DASHCOPE_TTS_URL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, model, voice, language_type } = body

    const apiKey = request.headers.get('x-api-key') || process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DashScope API key requerida (x-api-key o env DASHSCOPE_API_KEY)' },
        { status: 401 }
      )
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'El texto a sintetizar es requerido' },
        { status: 400 }
      )
    }

    const selectedModel = model || 'qwen3-tts-flash'
    const payload: any = {
      model: selectedModel,
      input: {
        text,
        voice: voice || 'Cherry',
        language_type: language_type || 'Spanish'
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const response = await fetch(DASHCOPE_TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const textBody = await response.text()
      if (!response.ok) {
        console.error('DashScope TTS API error:', textBody)
        return NextResponse.json(
          { error: 'No se pudo sintetizar audio con Qwen TTS', details: textBody },
          { status: response.status }
        )
      }

      // La respuesta suele contener output.audio.url
      try {
        const data = JSON.parse(textBody)
        return NextResponse.json(data.output || data)
      } catch {
        // Si no es JSON válido, devolvemos el texto crudo
        return NextResponse.json({ raw: textBody })
      }
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
    console.error('Qwen TTS proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}