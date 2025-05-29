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

  // Apply dynamic theme settings
  useEffect(() => {
    if (!isLoaded) return

    const root = document.documentElement
    const { themeSettings } = userData

    // Apply font size
    root.style.fontSize = `${themeSettings.fontSize}px`

    // Apply high contrast
    if (themeSettings.highContrast) {
      root.style.filter = 'contrast(1.2) brightness(1.1)'
    } else {
      root.style.filter = 'none'
    }

    // Apply reduced motion
    if (themeSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s')
      root.style.setProperty('--transition-duration', '0s')
    } else {
      root.style.removeProperty('--animation-duration')
      root.style.removeProperty('--transition-duration')
    }

    // Apply accent color by updating CSS custom properties
    const accentColors = {
      blue: { hue: 217, sat: 91, light: 60 },
      green: { hue: 142, sat: 76, light: 36 },
      purple: { hue: 262, sat: 83, light: 58 },
      orange: { hue: 25, sat: 95, light: 53 },
      red: { hue: 0, sat: 84, light: 60 },
      pink: { hue: 330, sat: 81, light: 60 }
    }

    const color = accentColors[themeSettings.accentColor]
    if (color) {
      // Update accent colors for both light and dark themes
      root.style.setProperty('--accent', `${color.hue} ${color.sat}% ${color.light}%`)
      root.style.setProperty('--accent-foreground', '0 0% 98%')
      
      // Update primary colors to match accent
      root.style.setProperty('--primary', `${color.hue} ${color.sat}% ${Math.max(color.light - 20, 20)}%`)
      root.style.setProperty('--primary-foreground', '0 0% 98%')
      
      // Update ring color for focus states
      root.style.setProperty('--ring', `${color.hue} ${color.sat}% ${color.light}%`)
    }
  }, [userData.themeSettings, isLoaded])

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
      <header className="flex-shrink-0 p-4 lg:p-6 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Section - Brand & User */}
          <div className="flex items-center gap-4 lg:gap-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground whitespace-nowrap">Carlos Freire AI</h1>
            {isLoaded && (
              <div className="hidden sm:block">
                <UserProfile
                  userName={userData.name}
                  userAvatar={userData.avatar}
                  onUserNameChange={updateUserName}
                  onAvatarChange={updateUserAvatar}
                />
              </div>
            )}
          </div>
          
          {/* Right Section - Controls */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Chat Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={chatMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChatMode('voice')}
                className="h-8 px-2 lg:px-3"
                title="Modo de voz"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Voz</span>
              </Button>
              <Button
                variant={chatMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChatMode('text')}
                className="h-8 px-2 lg:px-3"
                title="Modo de texto"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Texto</span>
              </Button>
            </div>
            
            {/* Voice Selector - Only show in voice mode */}
            {chatMode === 'voice' && (
              <div className="flex items-center gap-2 lg:gap-3">
                <Volume2 className="w-4 h-4 text-muted-foreground hidden lg:block" />
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-24 lg:w-40 bg-card border-border text-foreground text-xs lg:text-sm h-8">
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
            
            {/* Conversation Actions */}
            <div className="flex items-center gap-1 lg:gap-2">
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
                className="text-muted-foreground hover:text-foreground h-8 px-2 lg:px-3"
                title="Nueva conversación"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Nueva</span>
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
            </div>
            
            {/* Settings & Theme */}
            <div className="flex items-center gap-1 lg:gap-2 border-l border-border pl-2 lg:pl-4 ml-2 lg:ml-4">
              {/* Theme Selector */}
              {isLoaded && (
                <ThemeSelector
                  settings={userData.themeSettings}
                  onSettingsChange={updateThemeSettings}
                />
              )}
              
              {/* Settings */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowApiKeyModal(true)} 
                className="text-muted-foreground hover:text-foreground h-8 px-2 lg:px-3"
                title="Configuración API"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">API</span>
              </Button>
            </div>
            
            {/* Mobile User Profile */}
            {isLoaded && (
              <div className="sm:hidden">
                <UserProfile
                  userName={userData.name}
                  userAvatar={userData.avatar}
                  onUserNameChange={updateUserName}
                  onAvatarChange={updateUserAvatar}
                />
              </div>
            )}
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
