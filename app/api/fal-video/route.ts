import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      imageData,
      mimeType,
      duration = "5",
      model = "standard",
      negative_prompt = "blur, distort, and low quality",
      cfg_scale = 0.5,
      aspect_ratio = "16:9",
      tail_image_url
    } = body
    
    // Get API key from headers or environment
    const apiKey = request.headers.get('x-fal-key') || process.env.FAL_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FAL API key is required' },
        { status: 401 }
      )
    }

    if (!prompt || !imageData) {
      return NextResponse.json(
        { error: 'Prompt and imageData are required' },
        { status: 400 }
      )
    }

    // Use base64 data URI directly (Fal AI supports this according to docs)
    const image_url = `data:${mimeType};base64,${imageData}`

    // Determine the model endpoint
    const modelEndpoint = model === "pro" 
      ? "fal-ai/kling-video/v2.1/pro/image-to-video"
      : "fal-ai/kling-video/v2.1/standard/image-to-video"

    // Prepare the request payload
    const payload: any = {
      prompt,
      image_url,
      duration,
      negative_prompt,
      cfg_scale
    }

    // Add pro-specific parameters
    if (model === "pro") {
      payload.aspect_ratio = aspect_ratio
      if (tail_image_url) {
        payload.tail_image_url = tail_image_url
      }
    }

    console.log('Fal AI request:', {
      model: modelEndpoint,
      payload
    })

    // Make request to Fal AI using subscribe endpoint for immediate result
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 120 second timeout

    try {
      const response = await fetch(`https://fal.run/${modelEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Fal AI API error:', errorData)
        return NextResponse.json(
          { error: 'Failed to generate video', details: errorData },
          { status: response.status }
        )
      }

      const result = await response.json()
      console.log('Fal AI response:', result)

      // Return the video URL and metadata
      return NextResponse.json({
        video_url: result.video?.url,
        model: modelEndpoint,
        duration,
        prompt,
        request_id: result.request_id
      })
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out (120s)' },
          { status: 504 }
        )
      }
      throw error
    }
    
  } catch (error) {
    console.error('Fal AI video generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}