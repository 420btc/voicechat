"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Volume2, Trash2 } from "lucide-react"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { ConversationHistory } from "@/components/conversation-history"
import { ApiKeySetup } from "@/components/api-key-setup"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useOpenAI } from "@/hooks/use-openai"

interface VoiceChatProps {
  apiKey: string
  onApiKeyReset: () => void
  onApiKeySubmit: (key: string) => void
}

export function VoiceChat({ apiKey, onApiKeyReset, onApiKeySubmit }: VoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const { isRecording, audioLevel, startRecording, stopRecording, audioBlob } = useAudioRecording()

  const {
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
  } = useOpenAI(apiKey)

  // Available voices from OpenAI TTS
  const voices = [
    { value: "alloy", label: "Alloy (Neutral)" },
    { value: "echo", label: "Echo (Masculina)" },
    { value: "fable", label: "Fable (Británica)" },
    { value: "onyx", label: "Onyx (Profunda)" },
    { value: "nova", label: "Nova (Joven)" },
    { value: "shimmer", label: "Shimmer (Suave)" },
  ]

  useEffect(() => {
    if (audioBlob) {
      handleAudioSubmit(audioBlob)
    }
  }, [audioBlob])

  const handleAudioSubmit = async (blob: Blob) => {
    try {
      // Transcribe user audio
      const transcription = await transcribeAudio(blob)
      if (transcription) {
        addMessage("user", transcription)

        // Generate AI response
        const response = await generateResponse(transcription)
        if (response) {
          addMessage("assistant", response.text)

          // Play AI audio response if available
          if (response.audio) {
            const audioUrl = URL.createObjectURL(response.audio)
            if (audioRef.current) {
              audioRef.current.src = audioUrl
              audioRef.current.play()
              setIsPlaying(true)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error)
    }
  }



  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Carlos Freire AI</h1>
          <div className="flex items-center gap-4">
            {/* Voice Selector */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Seleccionar voz" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {voices.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-gray-700">
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearConversation} 
              className="text-gray-400 hover:text-white"
              title="Limpiar conversación"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowApiKeyModal(true)} className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Conversation History */}
        <div className="flex-1 mb-6">
          <ConversationHistory
            conversation={conversation}
            isTranscribing={isTranscribing}
            isGenerating={isGenerating}
            onTranslate={translateMessage}
          />
        </div>

        {/* Voice Input Interface */}
        <Card className="bg-black/20 border-transparent p-6">
          <div className="text-center space-y-6">
            <div className="text-gray-400 text-lg">{isRecording ? "Escuchando..." : ""}</div>

            {/* Voice Input with Visualizer */}
             <AIVoiceInput
               onStart={() => {
                 if (!isRecording) {
                   startRecording()
                 }
               }}
               onStop={() => {
                 if (isRecording) {
                   stopRecording()
                 }
               }}
               visualizerBars={48}
               demoMode={false}
               className="w-full"
               isRecording={isRecording}
               isDisabled={isTranscribing || isGenerating}
             />

            {/* Status */}
            <div className="text-sm text-gray-500">
              {isTranscribing && "Transcribiendo..."}
              {isGenerating && "La IA está pensando..."}
              {!isRecording && !isTranscribing && !isGenerating && ""}
            </div>
          </div>
        </Card>
      </div>

      {/* Hidden audio element for AI responses */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ApiKeySetup
            onApiKeySubmit={(newApiKey) => {
              onApiKeySubmit(newApiKey)
              setShowApiKeyModal(false)
              // Reload to apply the new API key
              window.location.reload()
            }}
            onClose={() => setShowApiKeyModal(false)}
            existingApiKey={apiKey}
          />
        </div>
      )}
    </div>
  )
}
