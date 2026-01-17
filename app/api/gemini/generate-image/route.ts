import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model, aspectRatio, resolution } = body
    
    // Get API key from headers or environment
    const apiKey = request.headers.get('x-api-key') || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use the image generation model
    const imageModel = model || 'gemini-2.5-flash-image-preview'

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey })

    // Enhance prompt with resolution if specified
    let finalPrompt = prompt
    if (resolution) {
      if (resolution === '4k') finalPrompt += ", 4k resolution, ultra detailed, high quality"
      else if (resolution === '2k') finalPrompt += ", 2k resolution, high quality"
      else if (resolution === '1k') finalPrompt += ", high quality"
    }

    console.log(`Generating image with model: ${imageModel}, prompt: ${finalPrompt}, aspect: ${aspectRatio || 'default'}`)

    // Create a client for image generation specifically if using a model that requires different parameters
    // or use the standard generateContent if that's what the model supports
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: [
        {
          role: 'user',
          parts: [
            { text: finalPrompt }
          ]
        }
      ],
      config: {
        responseModalities: ["IMAGE"],
        ...(aspectRatio && { aspectRatio: aspectRatio })
      }
    })

    console.log('Gemini image generation raw response:', JSON.stringify(response, null, 2))

    // Extract image data from response
    if (!response.candidates || response.candidates.length === 0) {
      return NextResponse.json({
        error: 'No candidates in response',
        message: 'Image generation failed'
      })
    }
    
    const candidate = response.candidates[0]
    if (!candidate?.content?.parts) {
      return NextResponse.json({
        error: 'No content parts in response',
        message: 'Image generation failed'
      })
    }
    
    for (const part of candidate.content.parts) {
      if (part.text) {
        console.log('Text response:', part.text)
      } else if (part.inlineData) {
        return NextResponse.json({
          image: {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          }
        })
      }
    }
    
    // If no image is generated, return error
    return NextResponse.json({
      error: 'No image generated',
      message: 'Image generation failed'
    })
    
  } catch (error) {
    console.error('Gemini image generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}