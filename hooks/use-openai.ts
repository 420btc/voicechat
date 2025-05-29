"use client"

import { useState, useCallback } from "react"
import { useLocalStorage } from "./use-local-storage"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: "openai" | "lmstudio"
}

interface AIResponse {
  text: string
  audio?: Blob
}

export type AIProvider = "openai" | "lmstudio"

interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model?: string
}

export function useOpenAI(config: AIConfig) {
  const { provider, apiKey, baseUrl, model } = config
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const {
    conversation,
    selectedVoice,
    setSelectedVoice,
    setConversation,
    addMessage,
    clearConversation
  } = useLocalStorage()

  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      setIsTranscribing(true)

      try {
        // Note: Transcription always uses OpenAI Whisper as LM Studio doesn't have transcription API
        const formData = new FormData()
        formData.append("file", audioBlob, "audio.webm")
        formData.append("model", "whisper-1")
        formData.append("language", "es")

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Transcription failed")
        }

        const data = await response.json()
        const transcribedText = data.text?.trim()
        
        // Return null if transcription is empty, only whitespace, or too short
        if (!transcribedText || transcribedText.length < 2) {
          console.log("Transcription too short or empty, skipping:", transcribedText)
          return null
        }
        
        return transcribedText
      } catch (error) {
        console.error("Transcription error:", error)
        return null
      } finally {
        setIsTranscribing(false)
      }
    },
    [apiKey],
  )

  const generateResponse = useCallback(
    async (userMessage: string): Promise<AIResponse | null> => {
      setIsGenerating(true)

      try {
        // Determine API endpoint and model based on provider
        const apiUrl = provider === "lmstudio" 
          ? `${baseUrl || "http://localhost:1234"}/v1/chat/completions`
          : "https://api.openai.com/v1/chat/completions"
        
        const selectedModel = provider === "lmstudio" 
          ? (model || "local-model")
          : "gpt-4o"

        // Generate text response
        const textResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "system",
                content:
                  "Eres un asistente de IA útil y amigable. Proporciona respuestas concisas y naturales en español, adecuadas para conversación por voz. Sé conversacional y cálido en tu tono. Carlos Freire es quien te hablará siempre y estaras a sus ordenes siendo profesional.",
              },
              ...conversation.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              {
                role: "user",
                content: userMessage,
              },
            ],
            max_tokens: 4096,
            temperature: 0.7,
          }),
        })

        if (!textResponse.ok) {
          throw new Error("Text generation failed")
        }

        const textData = await textResponse.json()
        const responseText =
          textData.choices[0]?.message?.content || "I apologize, but I could not generate a response."

        // Generate audio response (only available with OpenAI)
        let audioBlob: Blob | undefined
        if (provider === "openai") {
          try {
            const audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "tts-1",
                voice: selectedVoice,
                input: responseText,
                response_format: "mp3",
              }),
            })

            if (audioResponse.ok) {
              audioBlob = await audioResponse.blob()
            }
          } catch (audioError) {
            console.error("Audio generation error:", audioError)
          }
        }

        return {
          text: responseText,
          audio: audioBlob,
        }
      } catch (error) {
        console.error("Response generation error:", error)
        return {
          text: "I apologize, but I encountered an error. Please try again.",
        }
      } finally {
        setIsGenerating(false)
      }
    },
    [apiKey, conversation],
  )

  const translateMessage = useCallback(
    async (text: string, targetLanguage: "es" | "en"): Promise<string | null> => {
      try {
        // Determine API endpoint and model based on provider
        const apiUrl = provider === "lmstudio" 
          ? `${baseUrl || "http://localhost:1234"}/v1/chat/completions`
          : "https://api.openai.com/v1/chat/completions"
        
        const selectedModel = provider === "lmstudio" 
          ? (model || "local-model")
          : "gpt-4o"

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "system",
                content: `Traduce el siguiente texto al ${targetLanguage === "es" ? "español" : "inglés"}. Solo devuelve la traducción, sin explicaciones adicionales.`,
              },
              {
                role: "user",
                content: text,
              },
            ],
            max_tokens: 4096,
            temperature: 0.3,
          }),
        })

        if (!response.ok) {
          throw new Error("Translation failed")
        }

        const data = await response.json()
        return data.choices[0]?.message?.content || null
      } catch (error) {
        console.error("Translation error:", error)
        return null
      }
    },
    [apiKey, provider, baseUrl, model],
  )

  const loadConversation = useCallback((messages: Message[]) => {
    // Replace current conversation with loaded messages
    setConversation(messages)
  }, [setConversation])

  return {
    transcribeAudio,
    generateResponse,
    translateMessage,
    isTranscribing,
    isGenerating,
    conversation,
    addMessage,
    selectedVoice,
    setSelectedVoice,
    clearConversation,
    loadConversation,
  }
}
