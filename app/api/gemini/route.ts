import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Modality } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, max_tokens, temperature, images } = body
    
    // Get API key from headers or environment
    const apiKey = request.headers.get('x-api-key') || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey })

    // Convert messages to Gemini format
    const geminiContents = []
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      
      if (msg.role === 'system') {
        // Add system message as user message
        geminiContents.push({
          role: 'user',
          parts: [{ text: `System: ${msg.content}` }]
        })
      } else {
        const parts: any[] = [{ text: msg.content }]
        
        // Add images to the last user message if provided
        if (msg.role === 'user' && i === messages.length - 1 && images && images.length > 0) {
          images.forEach((image: any) => {
            parts.push({
              inlineData: {
                mimeType: image.mimeType || 'image/jpeg',
                data: image.data
              }
            })
          })
        }
        
        geminiContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        })
      }
    }

    console.log('Sending to Gemini:', {
      model: model || 'gemini-2.5-flash',
      contents: geminiContents,
      hasImages: images && images.length > 0
    })

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: max_tokens || 4096,
        temperature: temperature || 0.7
      },
      // Enable image generation when images are present
      ...(images && images.length > 0 && {
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT]
        }
      })
    })

    console.log('Gemini raw response:', JSON.stringify(response, null, 2))

    // Convert Gemini response to OpenAI format
    const candidate = response.candidates?.[0]
    let content = 'No response generated'
    
    console.log('Gemini candidate parts:', candidate?.content?.parts)
    
    if (candidate?.content?.parts) {
      // Handle both text and image responses
      const parts = candidate.content.parts
      const textParts = parts.filter(part => part.text).map(part => part.text)
      const imageParts = parts.filter(part => part.inlineData)
      
      console.log('Text parts:', textParts.length)
      console.log('Image parts:', imageParts.length)
      
      if (textParts.length > 0) {
        content = textParts.join('\n')
      }
      
      // If there are images, add them to the response
        if (imageParts.length > 0) {
          const imageUrls = imageParts.map(part => 
            `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`
          )
          if (textParts.length > 0) {
            content += '\n\nImágenes generadas: ' + imageUrls.length
          } else {
            content = 'Imagen generada exitosamente'
          }
        }
    }
    
    const convertedResponse = {
      choices: [{
        message: {
          role: 'assistant',
          content: content
        }
      }],
      usageMetadata: response.usageMetadata,
      // Include generated images if any
      ...(candidate?.content?.parts && {
         images: candidate.content.parts
           .filter(part => part.inlineData)
           .map(part => ({
             url: `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`,
             mimeType: part.inlineData?.mimeType || 'image/png'
           }))
       })
    }
    
    console.log('Final response images:', convertedResponse.images?.length || 0)
    console.log('Sending response with images:', !!convertedResponse.images)
    
    return NextResponse.json(convertedResponse)
    
  } catch (error) {
    console.error('Gemini proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}