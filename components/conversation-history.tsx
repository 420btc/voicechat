"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { User, Bot, Loader2, Languages, Play, Pause, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeViewer, detectCodeBlocks } from "@/components/code-viewer"
import { AIProvider } from "@/hooks/use-openai"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: AIProvider
  responseTime?: number // in milliseconds
  tokensUsed?: number
  promptTokens?: number
}

interface ConversationHistoryProps {
  conversation: Message[]
  isTranscribing: boolean
  isGenerating: boolean
  onTranslate: (text: string, targetLanguage: "es" | "en") => Promise<string | null>
  chatMode?: 'voice' | 'text' | 'programmer'
}

export function ConversationHistory({
  conversation,
  isTranscribing,
  isGenerating,
  onTranslate,
  chatMode = 'voice',
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null)
  const [translations, setTranslations] = useState<{ [key: number]: { text: string; language: string } }>({})

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

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // Aquí podrías agregar una notificación de éxito si tienes un sistema de toast
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
    }
  }

  const handleDownloadAudio = (audioBlob: Blob, index: number) => {
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio-mensaje-${index + 1}.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (conversation.length === 0 && !isTranscribing && !isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:pt-60">
        <div className="text-center text-muted-foreground max-w-md">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 sm:mb-8 faster-one-regular">Local AI</h1>
          <Bot className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-base sm:text-lg mb-2">Inicia una conversación</p>
          <p className="text-sm text-muted-foreground/80">Toca el micrófono para comenzar</p>
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
                message.role === "user" ? "bg-blue-100 text-blue-900 border-blue-200" : "bg-card border-border text-foreground"
              }`}
            >
              {chatMode === 'programmer' && message.role === 'assistant' ? (
                <div className="space-y-2">
                  {detectCodeBlocks(message.content).map((block, blockIndex) => (
                    block.type === 'code' ? (
                      <CodeViewer
                        key={blockIndex}
                        code={block.content}
                        language={block.language}
                        filename={block.filename}
                      />
                    ) : (
                      <p key={blockIndex} className="text-sm leading-relaxed">{block.content}</p>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}
              <div className={`flex justify-between items-center text-xs mt-2 ${message.role === "user" ? "text-blue-600" : "text-muted-foreground"}`}>
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
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                <p className="text-xs leading-relaxed">{translations[index].text}</p>
                <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-500" : "text-muted-foreground"}`}>
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
              
              {/* Copy Message Button - For text messages */}
              {!message.audio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyMessage(message.content)}
                  className={`h-6 text-xs ${
                    message.role === "user" ? "text-blue-600 hover:text-blue-800" : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              )}
              
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
               
               {/* Download Audio Button - For audio messages */}
               {message.audio && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => handleDownloadAudio(message.audio!, index)}
                   className={`h-6 text-xs ${
                     message.role === "user" ? "text-blue-600 hover:text-blue-800" : "text-blue-600 hover:text-blue-800"
                   }`}
                 >
                   <Download className="w-3 h-3 mr-1" />
                   Descargar
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
          <Card className="max-w-[80%] p-4 bg-card border-border">
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
