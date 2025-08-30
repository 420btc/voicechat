"use client"

import { useEffect, useRef, useState } from "react"
import { XCard } from "@/components/ui/x-gradient-card"
import { detectCodeBlocks } from "@/components/code-viewer"
import { User, Bot, Loader2, Languages, Play, Pause, Copy, Download, X, File as FileIcon, FileText, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  files?: File[]
  generatedImages?: Array<{url: string, mimeType: string}>
  generatedVideos?: Array<{url: string, mimeType: string}>
}

interface ConversationHistoryProps {
  conversation: Message[]
  isTranscribing: boolean
  isGenerating: boolean
  onTranslate: (text: string, targetLanguage: "es" | "en") => Promise<string | null>
  onUpdateConversation?: (updatedConversation: Message[]) => void
  onCancelGeneration?: () => void
  chatMode?: 'voice' | 'text' | 'programmer'
  userName?: string
  userAvatar?: string
  savedConversations?: SavedConversation[]
  onLoadConversation?: (conv: SavedConversation) => void
}

export function ConversationHistory({
  conversation,
  isTranscribing,
  isGenerating,
  onTranslate,
  onUpdateConversation,
  onCancelGeneration,
  userName = "Usuario",
  userAvatar,
  chatMode = 'voice',
  savedConversations = [],
  onLoadConversation,
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null)
  const [translations, setTranslations] = useState<{ [key: number]: { text: string; language: string; originalText: string } }>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState<{url: string, mimeType: string} | null>(null)
  const [isGeneratedImageModalOpen, setIsGeneratedImageModalOpen] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<{[key: string]: boolean}>({})
  const [generatedVideos, setGeneratedVideos] = useState<{[key: string]: string}>({})
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  // Function to get file icon and color based on file type
  const getFileIcon = (file: File) => {
    if (!file || !file.name) {
      return { icon: FileText, color: 'text-gray-600' }
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (extension === 'pdf') {
      return { icon: FileIcon, color: 'text-red-600' }
    } else if (['txt', 'doc', 'docx'].includes(extension || '')) {
      return { icon: FileText, color: 'text-blue-600' }
    }
    
    return { icon: FileText, color: 'text-gray-600' }
  }

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
      // Modificar directamente el contenido del mensaje en lugar de crear una nueva tarjeta
      const updatedConversation = [...conversation]
      updatedConversation[index] = {
        ...updatedConversation[index],
        content: translation
      }
      
      // Actualizar la conversación en el componente padre
      if (onUpdateConversation) {
        onUpdateConversation(updatedConversation)
      }
      
      // Guardar el estado de traducción con el texto original
      setTranslations((prev) => ({
        ...prev,
        [index]: { text: translation, language: targetLanguage, originalText: text },
      }))
    }

    setTranslatingIndex(null)
  }

  const handleRestore = (index: number) => {
    const translationData = translations[index]
    if (translationData && onUpdateConversation) {
      // Restaurar el texto original
      const updatedConversation = [...conversation]
      updatedConversation[index] = {
        ...updatedConversation[index],
        content: translationData.originalText
      }
      
      // Actualizar la conversación en el componente padre
      onUpdateConversation(updatedConversation)
      
      // Eliminar el estado de traducción
      setTranslations((prev) => {
        const newTranslations = { ...prev }
        delete newTranslations[index]
        return newTranslations
      })
    }
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

  const handleGeneratedImageClick = (generatedImage: {url: string, mimeType: string}) => {
    setSelectedGeneratedImage(generatedImage)
    setIsGeneratedImageModalOpen(true)
  }

  const closeGeneratedImageModal = () => {
    setIsGeneratedImageModalOpen(false)
    setSelectedGeneratedImage(null)
  }

  const downloadGeneratedImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.click()
  }

  const generateVideoFromImage = async (imageUrl: string, imageIndex: number, messageIndex: number) => {
    const videoKey = `${messageIndex}-${imageIndex}`
    
    try {
      setIsGeneratingVideo(prev => ({ ...prev, [videoKey]: true }))
      
      const response = await fetch('/api/fal-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Transform this image into a dynamic video with natural movement and cinematic quality",
          image_url: imageUrl,
          duration: "5",
          model: "pro"
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate video')
      }
      
      const result = await response.json()
      
      if (result.video_url) {
        setGeneratedVideos(prev => ({ ...prev, [videoKey]: result.video_url }))
      } else {
        throw new Error('No video URL in response')
      }
      
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Error al generar el video. Por favor, intenta de nuevo.')
    } finally {
      setIsGeneratingVideo(prev => ({ ...prev, [videoKey]: false }))
    }
  }

  const handleVideoClick = (videoUrl: string) => {
    setSelectedVideo(videoUrl)
    setIsVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setSelectedVideo(null)
  }

  const downloadVideo = (videoUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = filename
    link.click()
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
      
      {/* Conversation Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2">
        {conversation.map((message, index) => (
        <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          {message.role === "assistant" && (
            <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-border">
              <Bot className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          <div className="max-w-[95%] sm:max-w-[85%] md:max-w-[80%] space-y-2">
            <XCard
              link="#"
              authorName={message.role === "user" ? userName : "Asistente IA"}
              authorHandle={message.role === "user" ? userName.toLowerCase().replace(/\s+/g, '') : "ai"}
              authorImage={message.role === "user" ? (userAvatar || "/userr.png") : "/fondo.png"}
              content={chatMode === 'programmer' && message.role === 'assistant' ? 
                detectCodeBlocks(message.content || '') : 
                [{ type: 'text' as const, content: message.content || '' }]
              }
              isVerified={message.role === "assistant"}
              isProgrammerMode={chatMode === 'programmer' && message.role === 'assistant'}
              timestamp={message.timestamp.toLocaleTimeString()}
              model={message.model}
              provider={message.provider}
              responseTime={message.responseTime}
              tokensUsed={message.role === "user" ? message.promptTokens : message.tokensUsed}
              images={message.images}
              onImageClick={handleImageClick}
            />

            {/* Generated Images Preview */}
            {message.generatedImages && message.generatedImages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mb-2 w-full">Imágenes generadas:</span>
                {message.generatedImages.map((generatedImage, index) => {
                  console.log('Rendering generated image:', generatedImage)
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={generatedImage.url}
                        alt={`Imagen generada ${index + 1}`}
                        className="w-32 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleGeneratedImageClick(generatedImage)}
                      />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadGeneratedImage(generatedImage.url, `imagen-generada-${index + 1}.png`)
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={isGeneratingVideo[`${index}-${index}`]}
                          onClick={(e) => {
                            e.stopPropagation()
                            generateVideoFromImage(generatedImage.url, index, index)
                          }}
                        >
                          {isGeneratingVideo[`${index}-${index}`] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* API Generated Videos Preview */}
            {message.generatedVideos && message.generatedVideos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mb-2 w-full">Videos generados por IA:</span>
                {message.generatedVideos.map((generatedVideo, videoIndex) => {
                  console.log('Rendering generated video:', generatedVideo)
                  return (
                    <div key={videoIndex} className="relative group">
                      <video
                         src={generatedVideo.url}
                         className="w-48 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                         controls={false}
                         muted
                         loop
                         onMouseEnter={(e) => e.currentTarget.play()}
                         onMouseLeave={(e) => e.currentTarget.pause()}
                         onClick={() => handleVideoClick(generatedVideo.url)}
                       />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadVideo(generatedVideo.url, `video-ia-${videoIndex + 1}.mp4`)
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Manual Generated Videos Preview */}
            {Object.keys(generatedVideos).some(key => key.startsWith(`${index}-`)) && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground mb-2 w-full">Videos generados:</span>
                {Object.entries(generatedVideos)
                  .filter(([key]) => key.startsWith(`${index}-`))
                  .map(([videoKey, videoUrl]) => {
                    const videoIndex = videoKey.split('-')[1]
                    return (
                      <div key={videoKey} className="relative group">
                        <video
                           src={videoUrl}
                           className="w-48 h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                           controls={false}
                           muted
                           loop
                           onMouseEnter={(e) => e.currentTarget.play()}
                           onMouseLeave={(e) => e.currentTarget.pause()}
                           onClick={() => handleVideoClick(videoUrl)}
                         />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                               e.stopPropagation()
                               downloadVideo(videoUrl, `video-generado-${videoIndex}.mp4`)
                             }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Files Preview */}
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.files.filter(file => file && file.name).map((file, fileIndex) => {
                  const { icon: IconComponent, color } = getFileIcon(file)
                  return (
                    <div key={fileIndex} className="flex items-center gap-2 bg-muted/30 rounded border p-2 hover:bg-muted/50 transition-colors">
                      <IconComponent className={`w-4 h-4 ${color}`} />
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )
                })}
              </div>
            )}



            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                          if (translations[index]) {
                            handleRestore(index)
                          } else {
                            handleTranslate(index, message.content || '', "es")
                          }
                        }}
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
                {translatingIndex === index ? "Traduciendo..." : translations[index] ? "Restaurar" : "Traducir"}
              </Button>
              
              {/* Copy Message Button - For text messages */}
              {!message.audio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyMessage(message.content || '')}
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
                   className={`h-6 text-xs text-primary hover:text-primary/80`}
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
                   className={`h-6 text-xs text-primary hover:text-primary/80`}
                 >
                   <Download className="w-3 h-3 mr-1" />
                   Descargar
                 </Button>
               )}
            </div>
          </div>

          {message.role === "user" && (
            <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-border">
              <User className="w-4 h-4 text-muted-foreground" />
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
          <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-border">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-border">
            <Bot className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="max-w-[80%] space-y-2">
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
            {onCancelGeneration && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelGeneration}
                  className="text-xs px-3 py-1.5 h-8 bg-gradient-to-r from-gray-800/80 to-black/90 hover:from-gray-700/90 hover:to-black text-red-400 border-red-500/50 hover:border-red-400 backdrop-blur-sm shadow-lg transition-all duration-200 hover:shadow-red-500/20"
                  title="Cancelar generación"
                >
                  <X className="w-3 h-3 mr-1.5" />
                  Cancelar
                </Button>
              </div>
            )}
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
            {selectedImage instanceof window.File && (
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

      {/* Generated Image Modal */}
      <Dialog open={isGeneratedImageModalOpen} onOpenChange={setIsGeneratedImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Imagen Generada</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedGeneratedImage) {
                      downloadGeneratedImage(selectedGeneratedImage.url, 'imagen-generada.png')
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedGeneratedImage) {
                      window.open(selectedGeneratedImage.url, '_blank')
                    }
                  }}
                >
                  Abrir en nueva pestaña
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6 pt-2">
            {selectedGeneratedImage && (
              <img
                src={selectedGeneratedImage.url}
                alt="Imagen generada ampliada"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Video Generado</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedVideo) {
                      downloadVideo(selectedVideo, 'video-generado.mp4')
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedVideo) {
                      window.open(selectedVideo, '_blank')
                    }
                  }}
                >
                  Abrir en nueva pestaña
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-6 pt-2">
            {selectedVideo && (
              <video
                src={selectedVideo}
                controls
                autoPlay
                loop
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
