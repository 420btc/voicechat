"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { User, Bot, Loader2, Languages, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: "openai" | "lmstudio"
  responseTime?: number // in milliseconds
  tokensUsed?: number
  promptTokens?: number
}

interface ConversationHistoryProps {
  conversation: Message[]
  isTranscribing: boolean
  isGenerating: boolean
  onTranslate: (text: string, targetLanguage: "es" | "en") => Promise<string | null>
}

export function ConversationHistory({
  conversation,
  isTranscribing,
  isGenerating,
  onTranslate,
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [translations, setTranslations] = useState<Record<number, { text: string; language: "es" | "en" }>>({})
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation, isTranscribing, isGenerating])

  const handleTranslate = async (index: number, text: string, currentLanguage: "es" | "en") => {
    setTranslatingIndex(index)
    const targetLanguage = currentLanguage === "es" ? "en" : "es"

    const translation = await onTranslate(text, targetLanguage)

    if (translation) {
      setTranslations((prev) => ({
        ...prev,
        [index]: { text: translation, language: targetLanguage },
      }))
    }

    setTranslatingIndex(null)
  }

  const handleAudioPlay = (index: number, audioBlob: Blob) => {
    if (playingIndex === index && isPlaying) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      setPlayingIndex(null)
    } else {
      // Play new audio
      if (audioRef.current) {
        const audioUrl = URL.createObjectURL(audioBlob)
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsPlaying(true)
        setPlayingIndex(index)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setPlayingIndex(null)
  }

  const handleAudioPause = () => {
    setIsPlaying(false)
  }

  const handleAudioPlay2 = () => {
    setIsPlaying(true)
  }

  if (conversation.length === 0 && !isTranscribing && !isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Inicia una conversación</p>
          <p className="text-sm">Toca el micrófono para comenzar</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto space-y-4 pr-2">
      {conversation.map((message, index) => (
        <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.role === "assistant" && (
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="max-w-[80%] space-y-2">
            <Card
              className={`p-4 ${
                message.role === "user" ? "bg-blue-100 text-blue-900 border-blue-200" : "bg-gray-800 border-gray-700 text-white"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className={`flex justify-between items-center text-xs mt-2 ${message.role === "user" ? "text-blue-600" : "text-gray-400"}`}>
                <div className="flex items-center gap-2">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.role === "assistant" && message.responseTime && (
                    <span className={`opacity-75 ${
                      (message.responseTime / 1000) <= 2 ? 'text-purple-500' :
                      (message.responseTime / 1000) <= 15 ? 'text-green-500' :
                      (message.responseTime / 1000) <= 20 ? 'text-orange-500' :
                      'text-red-500'
                    }`}>• {(message.responseTime / 1000).toFixed(1)}s</span>
                  )}
                  {message.role === "assistant" && message.tokensUsed && (
                    <span className="opacity-75">• {message.tokensUsed} tokens</span>
                  )}
                  {message.role === "user" && message.promptTokens && (
                    <span className="opacity-75">• {message.promptTokens} prompt tokens</span>
                  )}
                </div>
                {message.role === "assistant" && (message.model || message.provider) && (
                  <div className="flex items-center gap-1">
                    <span className="opacity-75">•</span>
                    <span className="font-medium">
                      {message.provider === "openai" ? "OpenAI" : message.provider === "lmstudio" ? "LM Studio" : "AI"}
                      {message.model && (
                        <span className="opacity-75 ml-1">({message.model})</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Translation */}
            {translations[index] && (
              <Card
                className={`p-3 border-dashed ${
                  message.role === "user"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-gray-700 border-gray-500 text-gray-300"
                }`}
              >
                <p className="text-xs leading-relaxed">{translations[index].text}</p>
                <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-500" : "text-gray-400"}`}>
                  Traducido al {translations[index].language === "es" ? "español" : "inglés"}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTranslate(index, message.content, "es")}
                disabled={translatingIndex === index}
                className={`h-6 text-xs ${
                  message.role === "user" ? "text-blue-600 hover:text-blue-800" : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {translatingIndex === index ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Languages className="w-3 h-3 mr-1" />
                )}
                {translatingIndex === index ? "Traduciendo..." : "Traducir"}
              </Button>
              
              {/* Audio Play/Pause Button - For any message with audio */}
               {message.audio && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => handleAudioPlay(index, message.audio!)}
                   className={`h-6 text-xs ${
                     message.role === "user" ? "text-blue-600 hover:text-blue-800" : "text-blue-600 hover:text-blue-800"
                   }`}
                 >
                   {playingIndex === index && isPlaying ? (
                     <Pause className="w-3 h-3 mr-1" />
                   ) : (
                     <Play className="w-3 h-3 mr-1" />
                   )}
                   {playingIndex === index && isPlaying ? "Pausar" : "Reproducir"}
                 </Button>
               )}
            </div>
          </div>

          {message.role === "user" && (
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <User className="w-4 h-4 text-blue-800" />
            </div>
          )}
        </div>
      ))}

      {/* Loading states */}
      {isTranscribing && (
        <div className="flex gap-3 justify-end">
          <Card className="max-w-[80%] p-4 bg-blue-100 border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Transcribiendo...</span>
            </div>
          </Card>
          <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-4 h-4 text-blue-800" />
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <Card className="max-w-[80%] p-4 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">La IA está pensando...</span>
            </div>
          </Card>
        </div>
      )}
      
      {/* Hidden audio element for message playback */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPause={handleAudioPause}
        onPlay={handleAudioPlay2}
      />
    </div>
  )
}
