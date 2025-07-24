"use client"

import { useEffect, useRef, useState } from "react"
import { XCard } from "@/components/ui/x-gradient-card"
import { detectCodeBlocks } from "@/components/code-viewer"
import { User, Bot, Loader2, Languages, Play, Pause, Copy, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIProvider } from "@/hooks/use-openai"
import { ConversationSearch } from "@/components/conversation-search"
import { SavedConversation } from "@/components/conversation-manager"

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
  images?: File[]
}

interface ConversationHistoryProps {
  conversation: Message[]
  isTranscribing: boolean
  isGenerating: boolean
  onTranslate: (text: string, targetLanguage: "es" | "en") => Promise<string | null>
  chatMode?: 'voice' | 'text' | 'programmer'
  userName?: string
  savedConversations?: SavedConversation[]
  onLoadConversation?: (conv: SavedConversation) => void
}

export function ConversationHistory({
  conversation,
  isTranscribing,
  isGenerating,
  onTranslate,
  userName = "Usuario",
  chatMode = 'voice',
  savedConversations = [],
  onLoadConversation,
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null)
  const [translations, setTranslations] = useState<{ [key: number]: { text: string; language: string } }>({})  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

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
      if (audioRef.current && audioBlob instanceof Blob) {
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
    if (audioBlob instanceof Blob) {
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audio-mensaje-${index + 1}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleImageClick = (image: File) => {
    setSelectedImage(image)
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImage(null)
  }

  if (conversation.length === 0 && !isTranscribing && !isGenerating) {
    const getInstructionText = () => {
      switch (chatMode) {
        case 'voice':
          return 'Toca el micrófono para comenzar'
        case 'text':
          return 'Escribe tu mensaje para comenzar'
        case 'programmer':
          return 'Describe tu código o problema para comenzar'
        default:
          return 'Toca el micrófono para comenzar'
      }
    }

    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:pt-60">
        <div className="text-center text-muted-foreground max-w-md">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 sm:mb-8 faster-one-regular">Local AI</h1>
          <Bot className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-base sm:text-lg mb-2">Inicia una conversación</p>
          <p className="text-sm text-muted-foreground/80">{getInstructionText()}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Conversation Search */}
      {savedConversations.length > 0 && onLoadConversation && (
        <div className="mb-4 flex-shrink-0">
          <ConversationSearch
            savedConversations={savedConversations}
            onLoadConversation={onLoadConversation}
          />
        </div>
      )}
      
      {/* Conversation Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
        {conversation.map((message, index) => (
        <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.role === "assistant" && (
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-gray-600">
              <Bot className="w-4 h-4 text-gray-200" />
            </div>
          )}

          <div className="max-w-[80%] space-y-2">
            <XCard
              link="#"
              authorName={message.role === "user" ? userName : "Asistente IA"}
              authorHandle={message.role === "user" ? userName.toLowerCase().replace(/\s+/g, '') : "ai"}
              authorImage={message.role === "user" ? "/userr.png" : "/fondo.png"}
              content={chatMode === 'programmer' && message.role === 'assistant' ? 
                detectCodeBlocks(message.content) : 
                [message.content]
              }
              isVerified={message.role === "assistant"}
              isProgrammerMode={chatMode === 'programmer' && message.role === 'assistant'}
              timestamp={message.timestamp.toLocaleTimeString()}
              model={message.model}
              provider={message.provider}
              responseTime={message.responseTime}
              tokensUsed={message.role === "user" ? message.promptTokens : message.tokensUsed}
            />


            {/* Translation */}
            {translations[index] && (
              <XCard
                link="#"
                authorName="Traductor"
                authorHandle="translator"
                authorImage="/placeholder-logo.png"
                content={[translations[index].text]}
                isVerified={true}
                timestamp={`Traducido al ${translations[index].language === "es" ? "español" : "inglés"}`}
                className="translation-card"
              />
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
            <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-gray-600">
              <User className="w-4 h-4 text-gray-200" />
            </div>
          )}
        </div>
      ))}

      {/* Loading states */}
      {isTranscribing && (
        <div className="flex gap-3 justify-end">
          <div className="max-w-[80%]">
            <XCard
              link="#"
              authorName="Sistema"
              authorHandle="system"
              authorImage="/placeholder-user.jpg"
              content={["Transcribiendo..."]}
              isVerified={false}
              timestamp="Procesando"
              className="loading-card"
            />
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-gray-600">
            <User className="w-4 h-4 text-gray-200" />
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-gray-600">
            <Bot className="w-4 h-4 text-gray-200" />
          </div>
          <div className="max-w-[80%]">
            <XCard
              link="#"
              authorName="Asistente IA"
              authorHandle="ai"
              authorImage="/placeholder-logo.png"
              content={["La IA está pensando..."]}
              isVerified={true}
              timestamp="Generando"
              className="generating-card"
            />
          </div>
        </div>
      )}
      
      {/* Hidden audio element for message playback */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPause={handleAudioPause}
        onPlay={handleAudioPlay2}
      />

      {/* Modal de imagen */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            <button
              onClick={closeImageModal}
              className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            {selectedImage instanceof File && (
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Imagen ampliada"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
