"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Volume2, VolumeX, Trash2, Plus, Mic, MessageSquare, Send, AlertTriangle, ImagePlus, X, Code, FileText, File as FileIcon } from "lucide-react"
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
import { UserProfile } from "@/components/user-profile"
import { ConversationManager } from "@/components/conversation-manager"
import AIProviderSelector from "@/components/ai-provider-selector"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useOpenAI } from "@/hooks/use-openai"
import { useUserData, AI_AGENTS } from "@/hooks/use-user-data"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useNotifications } from "@/hooks/use-notifications"
import { useRealTimeTranscription } from "@/hooks/use-real-time-transcription"
import { useDragAndDrop } from "@/hooks/use-drag-and-drop"
import { calculateConversationTokens } from "@/lib/token-counter"

import { AutoSaveIndicator } from "@/components/auto-save-indicator"

interface VoiceChatProps {
  apiKey: string
  onApiKeyReset?: () => void
  onApiKeySubmit?: (key: string) => void
  onShowApiKeySetup?: () => void
}

export function VoiceChat({ apiKey, onApiKeyReset, onApiKeySubmit, onShowApiKeySetup }: VoiceChatProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [chatMode, setChatMode] = useState<'voice' | 'text' | 'programmer'>('voice')
  const [textInput, setTextInput] = useState('')
  const [showProviderWarning, setShowProviderWarning] = useState(false)
  const [tempOpenAIKey, setTempOpenAIKey] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [volume, setVolume] = useState(0.7) // Volume state (0.0 to 1.0)
  const [isMuted, setIsMuted] = useState(false)
  const [autoPlayAudioInText, setAutoPlayAudioInText] = useState(false) // Control audio playback in text mode
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)

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
  const currentApiKey = (() => {
    switch (userData.aiSettings.provider) {
      case "openai":
        return userData.aiSettings.openaiApiKey || apiKey
      case "lmstudio":
        return userData.aiSettings.lmstudioApiKey
      case "anthropic":
        return userData.aiSettings.anthropicApiKey
      case "deepseek":
        return userData.aiSettings.deepseekApiKey
      case "grok":
        return userData.aiSettings.grokApiKey
      case "gemini":
        return userData.aiSettings.geminiApiKey
      default:
        return apiKey
    }
  })()

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
    setConversation,
  } = useOpenAI({
    provider: userData.aiSettings.provider,
    apiKey: currentApiKey,
    baseUrl: userData.aiSettings.lmstudioBaseUrl,
    model: userData.aiSettings.lmstudioModel,
    openaiModel: userData.aiSettings.openaiModel,
    anthropicModel: userData.aiSettings.anthropicModel,
    geminiModel: userData.aiSettings.geminiModel,
    selectedAgent: userData.aiSettings.selectedAgent,
    onModelUsed: addModelToHistory,
    qwenBaseUrl: userData.aiSettings.qwenBaseUrl,
    qwenModel: userData.aiSettings.qwenModel,
    deepseekLmBaseUrl: userData.aiSettings.deepseekLmBaseUrl,
    deepseekLmModel: userData.aiSettings.deepseekLmModel,
    useSpecialPrompt: userData.aiSettings.useSpecialPrompt
  })

  // Initialize temp OpenAI key with saved key
  useEffect(() => {
    if (userData.aiSettings.openaiApiKey) {
      setTempOpenAIKey(userData.aiSettings.openaiApiKey)
    }
  }, [userData.aiSettings.openaiApiKey])

  // Initialize new hooks
  const { showNotification, playNotificationSound } = useNotifications()
  
  // Real-time transcription hook
  const {
    isSupported: isTranscriptionSupported,
    isListening,
    transcript,
    confidence,
    error: transcriptionError,
    startListening: startTranscription,
    stopListening: stopTranscription,
    resetTranscript: resetTranscription
  } = useRealTimeTranscription()
  
  // Drag and drop hook
  const {
    isDragOver,
    files: droppedFiles,
    error: dragError,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    clearFiles: clearDroppedFiles,
    clearError: clearDragError
  } = useDragAndDrop({
    accept: ['image/*', '.pdf', '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json'],
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024 // 10MB
  })
  
  const { manualSave: saveConversationManually } = useAutoSave({
    conversation,
    onSave: (title: string, messages: any[]) => {
      if (messages.length > 0) {
        saveConversation(title, messages)
        showNotification({ title: 'Conversación guardada automáticamente', soundType: 'success', playSound: false })
      }
    }
  })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSend: () => {
      if (chatMode === 'text' && textInput.trim()) {
        handleTextSubmit()
      }
    },
    onClear: () => {
      clearConversation()
      showNotification({ title: 'Conversación limpiada', soundType: 'success' })
    },
    onNewConversation: () => {
      clearConversation()
      setSelectedImages([])
      setSelectedFiles([])
      setTextInput('')
      showNotification({ title: 'Nueva conversación iniciada', soundType: 'success' })
    },
    onToggleMode: () => {
      const modes: ('voice' | 'text' | 'programmer')[] = ['voice', 'text', 'programmer']
      const currentIndex = modes.indexOf(chatMode)
      const nextMode = modes[(currentIndex + 1) % modes.length]
      handleChatModeChange(nextMode)
    },
    onFocusInput: () => {
      // Focus the appropriate input based on chat mode
      if (chatMode === 'text' || chatMode === 'programmer') {
        const textArea = document.querySelector('textarea') as HTMLTextAreaElement
        if (textArea) {
          textArea.focus()
        }
      }
    },
    onEscape: () => {
      setTextInput('')
      setSelectedImages([])
      setSelectedFiles([])
    }
  })

  // Handle chat mode change with provider validation
  const handleChatModeChange = (newMode: 'voice' | 'text' | 'programmer') => {
    // Check if switching to voice mode with non-OpenAI provider
    if (newMode === 'voice' && userData.aiSettings.provider !== 'openai') {
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

  // Handle dropped files
  useEffect(() => {
    if (droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'))
      const documentFiles = droppedFiles.filter(file => !file.type.startsWith('image/'))
      
      if (imageFiles.length > 0) {
        setSelectedImages(prev => [...prev, ...imageFiles])
      }
      
      if (documentFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...documentFiles])
      }
      
      showNotification({
        title: `${droppedFiles.length} archivo(s) agregado(s)`,
        body: `${imageFiles.length} imagen(es), ${documentFiles.length} documento(s)`,
        soundType: 'success'
      })
      
      clearDroppedFiles()
    }
  }, [droppedFiles, showNotification, clearDroppedFiles])

  // Handle drag and drop errors
  useEffect(() => {
    if (dragError) {
      showNotification({
        title: 'Error al arrastrar archivos',
        body: dragError,
        soundType: 'error'
      })
      clearDragError()
    }
  }, [dragError, showNotification, clearDragError])

  // Handle real-time transcription
  useEffect(() => {
    if (transcript && confidence > 0.7) {
      setTextInput(transcript)
    }
  }, [transcript, confidence])

  // Handle transcription errors
  useEffect(() => {
    if (transcriptionError) {
      showNotification({
        title: 'Error de transcripción',
        body: transcriptionError,
        soundType: 'error'
      })
    }
  }, [transcriptionError, showNotification])

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
          if (response.audio && response.audio instanceof Blob) {
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
      
      // Process file contents if any files are selected
      let fileContents = ''
      if (selectedFiles.length > 0) {
        const fileTexts = await Promise.all(
          selectedFiles.map(async (file) => {
            try {
              const content = await readFileContent(file)
              return `\n\n--- Contenido del archivo: ${file.name} ---\n${content}\n--- Fin del archivo ---`
            } catch (error) {
              console.error(`Error leyendo archivo ${file.name}:`, error)
              return `\n\n--- Error leyendo archivo: ${file.name} ---`
            }
          })
        )
        fileContents = fileTexts.join('')
      }
      
      // Create display message for user (no need to include file content as files will be shown visually)
      const displayMessage = userMessage
      
      // Create the actual message to send to AI (includes file contents)
      const messageToAI = userMessage + fileContents
      
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
          content: messageToAI,
        },
      ]
      
      const promptTokens = calculateConversationTokens(conversationMessages, userData.aiSettings.provider === "lmstudio" ? "gpt-4o" : "gpt-4o")
      
      // Add user message immediately with calculated prompt tokens
      addMessage("user", displayMessage, undefined, undefined, undefined, undefined, undefined, undefined, promptTokens, selectedImages.length > 0 ? selectedImages : undefined, selectedFiles.length > 0 ? selectedFiles : undefined)
      
      // Generate AI response (pass images if available)
      const response = await generateResponse(messageToAI, selectedImages)
      if (response) {
        addMessage("assistant", response.text, undefined, response.audio, response.model, userData.aiSettings.provider, response.responseTime, response.tokensUsed, undefined)

        // Play AI audio response if available and auto-play is enabled in text mode
        if (response.audio && response.audio instanceof Blob && autoPlayAudioInText) {
          const audioUrl = URL.createObjectURL(response.audio)
          if (audioRef.current) {
            audioRef.current.src = audioUrl
            audioRef.current.volume = isMuted ? 0 : volume
            audioRef.current.play()
            setIsPlaying(true)
          }
        }
      }
      
      // Clear selected images and files after sending
      setSelectedImages([])
      setSelectedFiles([])
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
    // Always show image button for all providers and models
    return true
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setSelectedImages(prev => [...prev, ...imageFiles].slice(0, 3)) // Max 3 images
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const documentFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'text/plain' || 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    setSelectedFiles(prev => [...prev, ...documentFiles].slice(0, 2)) // Max 2 files
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Function to get file icon and color based on file type and theme
  const getFileIcon = (file: File) => {
    if (!file || !file.name) {
      return { icon: FileText, color: 'text-gray-500 dark:text-gray-400' }
    }
    
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return { icon: FileIcon, color: 'text-red-500 dark:text-red-400' }
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return { icon: FileText, color: 'text-blue-500 dark:text-blue-400' }
    } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return { icon: FileText, color: 'text-indigo-500 dark:text-indigo-400' }
    } else {
      return { icon: FileText, color: 'text-gray-500 dark:text-gray-400' }
    }
  }

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      if (file.type === 'application/pdf') {
        // For PDFs, read as ArrayBuffer and use pdfjs-dist
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            
            // Dynamically import pdfjs-dist
            const pdfjsLib = await import('pdfjs-dist')
            
            // Disable worker to avoid CORS issues
            pdfjsLib.GlobalWorkerOptions.workerSrc = ''
            
            const pdf = await pdfjsLib.getDocument({ 
              data: arrayBuffer,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: true
            }).promise
            let fullText = ''
            
            // Extract text from all pages
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i)
              const textContent = await page.getTextContent()
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ')
              fullText += pageText + '\n'
            }
            
            resolve(fullText.trim())
          } catch (error) {
            reject(new Error(`Error parsing PDF: ${error}`))
          }
        }
        reader.onerror = () => reject(new Error('Error reading PDF file'))
        reader.readAsArrayBuffer(file)
      } else {
        // For text files, DOC, etc.
        reader.onload = (e) => {
          const result = e.target?.result as string
          resolve(result)
        }
        reader.onerror = () => reject(new Error('Error reading file'))
        reader.readAsText(file)
      }
    })
  }



  return (
    <div 
      className={`min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden relative ${
        isDragOver ? 'bg-primary/5 border-2 border-dashed border-primary' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border-2 border-dashed border-primary rounded-lg p-8 text-center">
            <FileIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Suelta los archivos aquí</h3>
            <p className="text-muted-foreground">Imágenes, documentos y archivos de código</p>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="flex-shrink-0 p-2 sm:p-4 lg:p-6 border-b border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 lg:gap-8">
          {/* Mobile: Top Row - User Profile and Settings */}
          <div className="flex sm:hidden items-center justify-between w-full">
            {isLoaded && (
              <UserProfile
                userName={userData.name}
                userAvatar={userData.avatar}
                onUserNameChange={updateUserName}
                onAvatarChange={updateUserAvatar}
              />
            )}
            <div className="flex items-center gap-1">
              {/* Auto-save Indicator */}
              {isLoaded && (
                <AutoSaveIndicator
                  conversations={userData.savedConversations}
                  onSave={() => {
                    if (conversation.length > 0) {
                      const autoTitle = `Auto-guardado ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                      saveConversation(autoTitle, conversation)
                    }
                  }}
                />
              )}

              {/* AI Provider Settings */}
              {isLoaded && (
                <AIProviderSelector
                  settings={userData.aiSettings}
                  onSettingsChange={updateAISettings}
                  themeSettings={userData.themeSettings}
                  onThemeSettingsChange={updateThemeSettings}
                />
              )}
            </div>
          </div>
          
          {/* Desktop: Left Section - User Profile */}
          <div className="hidden sm:flex items-center">
            {isLoaded && (
              <UserProfile
                userName={userData.name}
                userAvatar={userData.avatar}
                onUserNameChange={updateUserName}
                onAvatarChange={updateUserAvatar}
              />
            )}
          </div>
          
          {/* Main Controls - Full width on mobile, centered on desktop */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 w-full sm:flex-1 justify-center">
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
              <Button
                variant={chatMode === 'programmer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleChatModeChange('programmer')}
                className="h-8 px-1 sm:px-2 lg:px-3"
                title="Modo programador"
              >
                <Code className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Código</span>
              </Button>
            </div>
            
            {/* Audio Response Selector - Only show in text mode */}
            {chatMode === 'text' && (
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                <Button
                  variant={autoPlayAudioInText ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAutoPlayAudioInText(!autoPlayAudioInText)}
                  className="h-8 px-1 sm:px-2 lg:px-3"
                  title={autoPlayAudioInText ? "Desactivar respuesta en audio" : "Activar respuesta en audio"}
                >
                  {autoPlayAudioInText ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden lg:inline ml-2">{autoPlayAudioInText ? 'Audio ON' : 'Audio OFF'}</span>
                </Button>
              </div>
            )}
            
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
            
          </div>
          
          {/* Desktop: Right Section - Settings & Theme */}
          <div className="hidden sm:flex items-center gap-1 lg:gap-2">
            {/* Auto-save Indicator */}
            {isLoaded && (
              <AutoSaveIndicator
                conversations={userData.savedConversations}
                onSave={() => {
                  if (conversation.length > 0) {
                    const autoTitle = `Auto-guardado ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                    saveConversation(autoTitle, conversation)
                  }
                }}
              />
            )}
            
            {/* AI Provider Settings */}
            {isLoaded && (
              <AIProviderSelector
                settings={userData.aiSettings}
                onSettingsChange={updateAISettings}
                themeSettings={userData.themeSettings}
                onThemeSettingsChange={updateThemeSettings}
              />
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
            onUpdateConversation={setConversation}
            chatMode={chatMode}
            userName={userData.name}
            userAvatar={userData.avatar}
            savedConversations={userData.savedConversations}
            onLoadConversation={(conv) => loadConversation(conv.messages)}
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
          ) : chatMode === 'text' ? (
            /* Text Input Interface */
            <div className="space-y-3">
              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      {image instanceof window.File && (
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Imagen ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
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
              
              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                  {selectedFiles.filter(file => file && file.name).map((file, index) => {
                    const { icon: IconComponent, color } = getFileIcon(file)
                    return (
                      <div key={index} className="relative group flex items-center gap-2 bg-background/50 rounded border p-2">
                        <IconComponent className={`w-4 h-4 ${color}`} />
                        <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex gap-2">
                {/* Image Upload Button - Only show for LM Studio with vision models */}
                {supportsVision() && (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating || selectedImages.length >= 3}
                      className="px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
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
                
                {/* File Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => documentInputRef.current?.click()}
                  disabled={isGenerating || selectedFiles.length >= 2}
                  className="px-4 h-10 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                  title="Agregar archivo (PDF, TXT, DOC - máximo 2)"
                >
                  <FileText className="w-4 h-4 text-primary" />
                </Button>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* Real-time transcription button */}
                {isTranscriptionSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isListening) {
                        stopTranscription()
                      } else {
                        startTranscription()
                      }
                    }}
                    className={`px-4 h-10 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-primary/20 hover:bg-primary/10'}`}
                    title={isListening ? "Detener transcripción" : "Iniciar transcripción en tiempo real"}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
                
                <div className="flex-1 relative">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={supportsVision() ? "Escribe tu mensaje, sube imágenes o archivos..." : "Escribe tu mensaje o sube archivos..."}
                    disabled={isGenerating}
                    className="w-full"
                  />
                  {/* Real-time transcription preview */}
                  {isListening && transcript && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-muted/90 backdrop-blur-sm border rounded-md text-sm z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-muted-foreground">Transcribiendo... (Confianza: {Math.round(confidence * 100)}%)</span>
                      </div>
                      <p className="text-foreground">{transcript}</p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isGenerating}
                  size="sm"
                  className="px-4 h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Status */}
              <div className="text-xs sm:text-sm text-muted-foreground text-center">
                {isGenerating && "La IA está pensando..."}
                {!isGenerating && supportsVision() && "Presiona Enter para enviar • Soporta imágenes y archivos"}
                {!isGenerating && !supportsVision() && "Presiona Enter para enviar • Soporta archivos"}
              </div>
            </div>
          ) : (
            /* Programmer Input Interface */
            <div className="space-y-3">
              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      {image instanceof window.File && (
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Imagen ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
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
                      variant="default"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isGenerating || selectedImages.length >= 3}
                      className="px-4 h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
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
                
                {/* File Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => documentInputRef.current?.click()}
                  disabled={isGenerating || selectedFiles.length >= 2}
                  className="px-4 h-10 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                  title="Agregar archivo (PDF, TXT, DOC - máximo 2)"
                >
                  <FileText className="w-4 h-4 text-primary" />
                </Button>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* Real-time transcription button */}
                {isTranscriptionSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isListening) {
                        stopTranscription()
                      } else {
                        startTranscription()
                      }
                    }}
                    className={`px-4 h-10 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-primary/20 hover:bg-primary/10'}`}
                    title={isListening ? "Detener transcripción" : "Iniciar transcripción en tiempo real"}
                  >
                    <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
                
                <div className="flex-1 relative">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe tu problema de programación, sube archivos de código o pide ayuda..."
                    disabled={isGenerating}
                    className="w-full"
                  />
                  {/* Real-time transcription preview */}
                  {isListening && transcript && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-muted/90 backdrop-blur-sm border rounded-md text-sm z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-muted-foreground">Transcribiendo... (Confianza: {Math.round(confidence * 100)}%)</span>
                      </div>
                      <p className="text-foreground">{transcript}</p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isGenerating}
                  size="sm"
                  className="px-4 h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Status */}
              <div className="text-xs sm:text-sm text-muted-foreground text-center">
                {isGenerating && "La IA está pensando..."}
                {!isGenerating && "Presiona Enter para enviar • Modo programador activo"}
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



      {/* Provider Warning Modal */}
      <Dialog open={showProviderWarning} onOpenChange={setShowProviderWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cambio de Modo Detectado
            </DialogTitle>
            <DialogDescription>
              Estás usando {userData.aiSettings.provider === 'lmstudio' ? 'LM Studio' : userData.aiSettings.provider.charAt(0).toUpperCase() + userData.aiSettings.provider.slice(1)}, pero el modo de voz requiere OpenAI para la síntesis de voz. 
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
                Continuar con {userData.aiSettings.provider === 'lmstudio' ? 'LM Studio' : userData.aiSettings.provider.charAt(0).toUpperCase() + userData.aiSettings.provider.slice(1)} (Solo texto)
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
