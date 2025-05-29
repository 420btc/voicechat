"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Volume2, Trash2, Plus, Mic, MessageSquare, Send } from "lucide-react"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { ConversationHistory } from "@/components/conversation-history"
import { ApiKeySetup } from "@/components/api-key-setup"
import { UserProfile } from "@/components/user-profile"
import { ConversationManager } from "@/components/conversation-manager"
import { ThemeSelector } from "@/components/theme-selector"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useOpenAI } from "@/hooks/use-openai"
import { useUserData } from "@/hooks/use-user-data"

interface VoiceChatProps {
  apiKey: string
  onApiKeyReset: () => void
  onApiKeySubmit: (key: string) => void
}

export function VoiceChat({ apiKey, onApiKeyReset, onApiKeySubmit }: VoiceChatProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [chatMode, setChatMode] = useState<'voice' | 'text'>('voice')
  const [textInput, setTextInput] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  const { isRecording, audioLevel, startRecording, stopRecording, cancelRecording, audioBlob, autoStopEnabled, toggleAutoStop, isCancelled } = useAudioRecording()

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
    loadConversation,
  } = useOpenAI(apiKey)

  const {
    userData,
    isLoaded,
    updateUserName,
    updateUserAvatar,
    updateThemeSettings,
    saveConversation,
    deleteConversation,
  } = useUserData()

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
    if (audioBlob && !isCancelled) {
      handleAudioSubmit(audioBlob)
    }
  }, [audioBlob, isCancelled])

  const handleAudioSubmit = async (blob: Blob) => {
    try {
      // Transcribe user audio
      const transcription = await transcribeAudio(blob)
      if (transcription) {
        // Store user message with audio
        addMessage("user", transcription, undefined, blob)

        // Generate AI response
        const response = await generateResponse(transcription)
        if (response) {
          addMessage("assistant", response.text, undefined, response.audio)

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
      } else {
        console.log("Audio discarded: transcription was empty or too short")
      }
    } catch (error) {
      console.error("Error processing audio:", error)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return
    
    try {
      const userMessage = textInput.trim()
      setTextInput('')
      
      // Store user message (text only)
      addMessage("user", userMessage)

      // Generate AI response
      const response = await generateResponse(userMessage)
      if (response) {
        addMessage("assistant", response.text, undefined, response.audio)

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
    } catch (error) {
      console.error("Error processing text:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }



  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Carlos Freire AI</h1>
            {isLoaded && (
              <UserProfile
                userName={userData.name}
                userAvatar={userData.avatar}
                onUserNameChange={updateUserName}
                onAvatarChange={updateUserAvatar}
              />
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Chat Mode Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={chatMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChatMode('voice')}
                className="p-1 sm:p-2"
                title="Modo de voz"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Voz</span>
              </Button>
              <Button
                variant={chatMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChatMode('text')}
                className="p-1 sm:p-2"
                title="Modo de texto"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline ml-1">Texto</span>
              </Button>
            </div>
            
            {/* Voice Selector - Only show in voice mode */}
            {chatMode === 'voice' && (
              <div className="flex items-center gap-1 md:gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground hidden sm:block" />
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-20 sm:w-28 md:w-36 bg-card border-border text-foreground text-xs sm:text-sm">
                    <SelectValue placeholder="Voz" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {voices.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value} className="text-foreground hover:bg-accent">
                        {voice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* New Conversation */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                // Auto-save current conversation before clearing if it has messages
                if (conversation.length > 0) {
                  const autoTitle = `Conversación ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                  saveConversation(autoTitle, conversation)
                }
                clearConversation()
              }} 
              className="text-muted-foreground hover:text-foreground p-1 sm:p-2"
              title="Nueva conversación"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva</span>
            </Button>
            
            {/* Conversation Manager */}
            {isLoaded && (
              <ConversationManager
                savedConversations={userData.savedConversations}
                currentConversation={conversation}
                onLoadConversation={(conv) => loadConversation(conv.messages)}
                onSaveConversation={(title) => saveConversation(title, conversation)}
                onDeleteConversation={deleteConversation}
                onNewConversation={() => {
                  // Auto-save current conversation before clearing if it has messages
                  if (conversation.length > 0) {
                    const autoTitle = `Conversación ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                    saveConversation(autoTitle, conversation)
                  }
                  clearConversation()
                }}
              />
            )}
            
            {/* Theme Selector */}
            {isLoaded && (
              <ThemeSelector
                settings={userData.themeSettings}
                onSettingsChange={updateThemeSettings}
              />
            )}
            
            {/* Settings */}
            <Button variant="ghost" size="sm" onClick={() => setShowApiKeyModal(true)} className="text-muted-foreground hover:text-foreground p-1 sm:p-2">
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">API</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 min-h-0">
        {/* Conversation History */}
        <div className="flex-1 mb-6 min-h-0">
          <ConversationHistory
            conversation={conversation}
            isTranscribing={isTranscribing}
            isGenerating={isGenerating}
            onTranslate={translateMessage}
          />
        </div>

        {/* Input Interface */}
        <div className="flex-shrink-0 bg-card p-3 sm:p-6">
          {chatMode === 'voice' ? (
            /* Voice Input Interface */
            <div className="text-center space-y-2 sm:space-y-4">
              <div className="text-gray-400 text-sm sm:text-lg">{isRecording ? "Escuchando..." : ""}</div>

              {/* Auto-stop Toggle */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <Button
                  variant={autoStopEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAutoStop}
                  className={`text-xs h-8 sm:h-auto ${
                    autoStopEnabled 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {autoStopEnabled ? "Auto-envío: ON" : "Auto-envío: OFF"}
                </Button>
                <span className="text-xs text-gray-500 text-center">
                  {autoStopEnabled ? "Se enviará tras 3s de silencio" : "Presiona para enviar manualmente"}
                </span>
              </div>

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

              {/* Cancel Button - Only show when recording */}
              {isRecording && (
                <div className="flex justify-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={cancelRecording}
                    className="bg-red-600 hover:bg-red-700 text-white h-8 sm:h-auto text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Cancelar grabación</span>
                    <span className="sm:hidden">Cancelar</span>
                  </Button>
                </div>
              )}

              {/* Status */}
              <div className="text-xs sm:text-sm text-gray-500">
                {isTranscribing && "Transcribiendo..."}
                {isGenerating && "La IA está pensando..."}
                {!isRecording && !isTranscribing && !isGenerating && ""}
              </div>
            </div>
          ) : (
            /* Text Input Interface */
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje aquí..."
                  disabled={isGenerating}
                  className="flex-1"
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isGenerating}
                  size="sm"
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Status */}
              <div className="text-xs sm:text-sm text-gray-500 text-center">
                {isGenerating && "La IA está pensando..."}
                {!isGenerating && "Presiona Enter para enviar"}
              </div>
            </div>
          )}
        </div>
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
