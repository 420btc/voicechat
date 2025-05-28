"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { User, Bot, Loader2, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
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
  const [translations, setTranslations] = useState<Record<number, { text: string; language: "es" | "en" }>>({})
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null)

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
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-black" />
            </div>
          )}

          <div className="max-w-[80%] space-y-2">
            <Card
              className={`p-4 ${
                message.role === "user" ? "bg-white text-black" : "bg-gray-800 border-gray-700 text-white"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className={`text-xs mt-2 ${message.role === "user" ? "text-gray-600" : "text-gray-400"}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>

            {/* Translation */}
            {translations[index] && (
              <Card
                className={`p-3 border-dashed ${
                  message.role === "user"
                    ? "bg-gray-50 text-gray-700 border-gray-300"
                    : "bg-gray-700 border-gray-500 text-gray-300"
                }`}
              >
                <p className="text-xs leading-relaxed">{translations[index].text}</p>
                <div className={`text-xs mt-1 ${message.role === "user" ? "text-gray-500" : "text-gray-400"}`}>
                  Traducido al {translations[index].language === "es" ? "español" : "inglés"}
                </div>
              </Card>
            )}

            {/* Translate Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTranslate(index, message.content, "es")}
              disabled={translatingIndex === index}
              className={`h-6 text-xs ${
                message.role === "user" ? "text-gray-600 hover:text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {translatingIndex === index ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Languages className="w-3 h-3 mr-1" />
              )}
              {translatingIndex === index ? "Traduciendo..." : "Traducir"}
            </Button>
          </div>

          {message.role === "user" && (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      ))}

      {/* Loading states */}
      {isTranscribing && (
        <div className="flex gap-3 justify-end">
          <Card className="max-w-[80%] p-4 bg-gray-700 border-gray-600">
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Transcribiendo...</span>
            </div>
          </Card>
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 text-black" />
          </div>
          <Card className="max-w-[80%] p-4 bg-gray-800 border-gray-700">
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">La IA está pensando...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
