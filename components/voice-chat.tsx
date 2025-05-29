"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Volume2, VolumeX, Trash2, Plus, Mic, MessageSquare, Send, AlertTriangle, ImagePlus, X, Key } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AIVoiceInput } from "@/components/ui/ai-voice-input"
import { ConversationHistory } from "@/components/conversation-history"
import { ApiKeySetup } from "@/components/api-key-setup"
import { UserProfile } from "@/components/user-profile"
import { ConversationManager } from "@/components/conversation-manager"
import { ThemeSelector } from "@/components/theme-selector"
import AIProviderSelector from "@/components/ai-provider-selector"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useOpenAI } from "@/hooks/use-openai"
import { useUserData, AI_AGENTS } from "@/hooks/use-user-data"
import { calculateConversationTokens } from "@/lib/token-counter"

interface VoiceChatProps {
  apiKey: string
  onApiKeyReset: () => void
  onApiKeySubmit: (key: string) => void
}

export function VoiceChat({ apiKey, onApiKeyReset, onApiKeySubmit }: VoiceChatProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [chatMode, setChatMode] = useState<'voice' | 'text'>('voice')
  const [textInput, setTextInput] = useState('')
  const [showProviderWarning, setShowProviderWarning] = useState(false)
  const [tempOpenAIKey, setTempOpenAIKey] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [volume, setVolume] = useState(0.7) // Volume state (0.0 to 1.0)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      const handlePause = () => setIsPlaying(false)
      
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('pause', handlePause)
      
      return () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('pause', handlePause)
      }
    }
  }, [])

  const { isRecording, audioLevel, startRecording, stopRecording, cancelRecording, audioBlob, isCancelled } = useAudioRecording()

  const {
    userData,
    isLoaded,
    updateUserName,
    updateUserAvatar,
    updateThemeSettings,
    updateAISettings,
    saveConversation,
    deleteConversation,
    deleteAllConversations,
    addModelToHistory,
  } = useUserData()

  // Determine which API key to use based on provider
  const currentApiKey = userData.aiSettings.provider === "openai" 
    ? (userData.aiSettings.openaiApiKey || apiKey)
    : userData.aiSettings.lmstudioApiKey

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
  } = useOpenAI({
    provider: userData.aiSettings.provider,
    apiKey: currentApiKey,
    baseUrl: userData.aiSettings.lmstudioBaseUrl,
    model: userData.aiSettings.lmstudioModel,
    selectedAgent: userData.aiSettings.selectedAgent,
    onModelUsed: addModelToHistory
  })

  // Initialize temp OpenAI key with saved key
  useEffect(() => {
    if (userData.aiSettings.openaiApiKey) {
      setTempOpenAIKey(userData.aiSettings.openaiApiKey)
    }
  }, [userData.aiSettings.openaiApiKey])

  // Handle chat mode change with provider validation
  const handleChatModeChange = (newMode: 'voice' | 'text') => {
    // If switching to voice mode and currently using LM Studio
    if (newMode === 'voice' && chatMode === 'text' && userData.aiSettings.provider === 'lmstudio') {
      setShowProviderWarning(true)
      return
    }
    setChatMode(newMode)
  }

  // Handle provider warning modal actions
  const handleContinueWithLMStudio = () => {
    setShowProviderWarning(false)
    setChatMode('voice')
  }

  const handleSwitchToOpenAI = () => {
    // Update to OpenAI provider and save the temp key
    updateAISettings({
      ...userData.aiSettings,
      provider: 'openai',
      openaiApiKey: tempOpenAIKey
    })
    setShowProviderWarning(false)
    setChatMode('voice')
  }

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
          addMessage("assistant", response.text, undefined, response.audio, response.model, userData.aiSettings.provider, response.responseTime, response.tokensUsed, undefined)

          // Play AI audio response if available
          if (response.audio) {
            const audioUrl = URL.createObjectURL(response.audio)
            if (audioRef.current) {
              audioRef.current.src = audioUrl
              audioRef.current.volume = isMuted ? 0 : volume
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
      
      // Create display message for user (include image info if present)
      const displayMessage = selectedImages.length > 0 
        ? `${userMessage} [${selectedImages.length} imagen${selectedImages.length > 1 ? 'es' : ''} adjunta${selectedImages.length > 1 ? 's' : ''}]`
        : userMessage
      
      // Calculate prompt tokens immediately
      const conversationMessages = [
        {
          role: "system",
          content: "Eres un asistente de IA útil y amigable. Proporciona respuestas concisas y naturales en español, adecuadas para conversación por voz. Sé conversacional y cálido en tu tono. Carlos Freire es quien te hablará siempre y estaras a sus ordenes siendo profesional. Responde directamente sin mostrar tu proceso de razonamiento interno."
        },
        ...conversation.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: userMessage,
        },
      ]
      
      const promptTokens = calculateConversationTokens(conversationMessages, userData.aiSettings.provider === "lmstudio" ? "gpt-4o" : "gpt-4o")
      
      // Add user message immediately with calculated prompt tokens
      addMessage("user", displayMessage, undefined, undefined, undefined, undefined, undefined, undefined, promptTokens)
      
      // Generate AI response (pass images if available)
      const response = await generateResponse(userMessage, selectedImages)
      if (response) {
        addMessage("assistant", response.text, undefined, response.audio, response.model, userData.aiSettings.provider, response.responseTime, response.tokensUsed, undefined)

        // Play AI audio response if available
        if (response.audio) {
          const audioUrl = URL.createObjectURL(response.audio)
          if (audioRef.current) {
            audioRef.current.src = audioUrl
            audioRef.current.volume = isMuted ? 0 : volume
            audioRef.current.play()
            setIsPlaying(true)
          }
        }
      }
      
      // Clear selected images after sending
      setSelectedImages([])
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

  // Check if current model supports vision
  const supportsVision = () => {
    return userData.aiSettings.provider === 'lmstudio' && 
           userData.aiSettings.lmstudioModel && 
           (userData.aiSettings.lmstudioModel.toLowerCase().includes('gemma') ||
            userData.aiSettings.lmstudioModel.toLowerCase().includes('vision') ||
            userData.aiSettings.lmstudioModel.toLowerCase().includes('llava'))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setSelectedImages(prev => [...prev, ...imageFiles].slice(0, 3)) // Max 3 images
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }



  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 p-4 lg:p-6 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Section - Brand & User */}
          <div className="flex items-center gap-4 lg:gap-8">
            <h1 className="hidden sm:block text-xl sm:text-2xl lg:text-4xl font-bold text-foreground whitespace-nowrap">Local AI</h1>
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
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-1 justify-end">
            {/* Chat Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={chatMode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleChatModeChange('voice')}
                className="h-8 px-1 sm:px-2 lg:px-3"
                title="Modo de voz"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Voz</span>
              </Button>
              <Button
                variant={chatMode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleChatModeChange('text')}
                className="h-8 px-1 sm:px-2 lg:px-3"
                title="Modo de texto"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Texto</span>
              </Button>
            </div>
            
            {/* Voice Selector - Only show in voice mode */}
            {chatMode === 'voice' && (
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                <Volume2 className="w-4 h-4 text-muted-foreground hidden lg:block" />
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-20 sm:w-24 lg:w-40 bg-card border-border text-foreground text-xs lg:text-sm h-8">
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
                className="text-muted-foreground hover:text-foreground h-8 px-1 sm:px-2 lg:px-3"
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
                  onDeleteAllConversations={deleteAllConversations}
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
            
            {/* Agent Indicator - Always Visible */}
            {isLoaded && (() => {
              if (userData.aiSettings.provider === 'lmstudio') {
                const currentAgent = AI_AGENTS.find(agent => agent.id === userData.aiSettings.selectedAgent) || AI_AGENTS[0]
                return (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                    <span className="text-sm">{currentAgent.icon}</span>
                    <span className="text-xs font-medium hidden sm:inline">{currentAgent.name}</span>
                  </div>
                )
              } else {
                return (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                    <span className="text-sm">🤖</span>
                    <span className="text-xs font-medium hidden sm:inline">{userData.aiSettings.provider === 'openai' ? 'OpenAI' : 'AI Assistant'}</span>
                  </div>
                )
              }
            })()}
            
            {/* Settings & Theme */}
            <div className="flex items-center gap-1 lg:gap-2 border-l border-border pl-1 sm:pl-2 lg:pl-4 ml-1 sm:ml-2 lg:ml-4">
              {/* Theme Selector */}
              {isLoaded && (
                <ThemeSelector
                  settings={userData.themeSettings}
                  onSettingsChange={updateThemeSettings}
                />
              )}
              
              {/* AI Provider Settings */}
              {isLoaded && (
                <AIProviderSelector
                  settings={userData.aiSettings}
                  onSettingsChange={updateAISettings}
                />
              )}
              
              {/* Legacy API Settings (for OpenAI key fallback) */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowApiKeyModal(true)} 
                className="text-muted-foreground hover:text-foreground h-8 px-1 sm:px-2 lg:px-3"
                title="Configuración API Legacy"
              >
                <Key className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Legacy</span>
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
              <div className="text-muted-foreground text-sm sm:text-lg">{isRecording ? "Escuchando..." : ""}</div>

              {/* Voice Input with Volume Control */}
              <div className="flex items-center justify-center gap-3">
                {/* Vertical Volume Control */}
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                    title={isMuted ? "Activar sonido" : "Silenciar"}
                  >
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </Button>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground text-center" style={{fontSize: '10px'}}>10</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value)
                        setVolume(newVolume)
                        if (newVolume > 0 && isMuted) {
                          setIsMuted(false)
                        }
                        if (audioRef.current) {
                          audioRef.current.volume = newVolume
                        }
                      }}
                      className="w-2 h-16 bg-muted rounded-lg appearance-none cursor-pointer"
                      style={{
                        writingMode: 'vertical-lr' as const,
                        WebkitAppearance: 'slider-vertical',
                        background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, #374151 ${(isMuted ? 0 : volume) * 100}%, #374151 100%)`
                      }}
                      disabled={isMuted}
                    />
                    <span className="text-xs text-muted-foreground text-center" style={{fontSize: '10px'}}>0</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-center" style={{fontSize: '9px'}}>
                    {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
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
                   className="flex-1"
                   isRecording={isRecording}
                   isDisabled={isTranscribing || isGenerating}
                 />
               </div>

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
              <div className="text-xs sm:text-sm text-muted-foreground">
                {isTranscribing && "Transcribiendo..."}
                {isGenerating && "La IA está pensando..."}
                {!isRecording && !isTranscribing && !isGenerating && ""}
              </div>
            </div>
          ) : (
            /* Text Input Interface */
            <div className="space-y-3">
              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Imagen ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                {/* Image Upload Button - Only show for LM Studio with vision models */}
                {supportsVision() && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating || selectedImages.length >= 3}
                      className="px-3"
                      title="Agregar imagen (máximo 3)"
                    >
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </>
                )}
                
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={supportsVision() ? "Escribe tu mensaje o sube imágenes..." : "Escribe tu mensaje aquí..."}
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
              <div className="text-xs sm:text-sm text-muted-foreground text-center">
                {isGenerating && "La IA está pensando..."}
                {!isGenerating && supportsVision() && "Presiona Enter para enviar • Soporta imágenes"}
                {!isGenerating && !supportsVision() && "Presiona Enter para enviar"}
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
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <ApiKeySetup
            onApiKeySubmit={(key) => {
              onApiKeySubmit(key)
              setShowApiKeyModal(false)
              // Reload to apply the new API key
              window.location.reload()
            }}
            onClose={() => setShowApiKeyModal(false)}
            existingApiKey={apiKey}
          />
        </div>
      )}

      {/* Provider Warning Modal */}
      <Dialog open={showProviderWarning} onOpenChange={setShowProviderWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cambio de Modo Detectado
            </DialogTitle>
            <DialogDescription>
              Estás usando LM Studio, pero el modo de voz requiere OpenAI para la síntesis de voz. 
              ¿Qué te gustaría hacer?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">API Key de OpenAI (se guardará automáticamente)</Label>
              <Input
                id="openai-key"
                type="password"
                value={tempOpenAIKey}
                onChange={(e) => setTempOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleSwitchToOpenAI}
                disabled={!tempOpenAIKey.trim()}
                className="w-full"
              >
                Cambiar a OpenAI (Recomendado)
              </Button>
              <Button 
                variant="outline" 
                onClick={handleContinueWithLMStudio}
                className="w-full"
              >
                Continuar con LM Studio (Solo texto)
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowProviderWarning(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Hidden Audio Element for AI Voice Responses */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
