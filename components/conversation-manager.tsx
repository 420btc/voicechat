"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card as AnimatedCard, CardCanvas } from "@/components/animated-glow-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { History, Plus, Trash2, MessageSquare, Calendar } from "lucide-react"
import { AIProvider } from "@/hooks/use-openai"

export interface SavedConversation {
  id: string
  title: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Date
    audio?: Blob
    model?: string
    provider?: AIProvider
  }>
  createdAt: Date
  updatedAt: Date
}

interface ConversationManagerProps {
  savedConversations: SavedConversation[]
  currentConversation: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Date
    audio?: Blob
    model?: string
    provider?: AIProvider
  }>
  onLoadConversation: (conversation: SavedConversation) => void
  onSaveConversation: (title: string) => void
  onDeleteConversation: (id: string) => void
  onDeleteAllConversations: () => void
  onNewConversation: () => void
}

export function ConversationManager({
  savedConversations,
  currentConversation,
  onLoadConversation,
  onSaveConversation,
  onDeleteConversation,
  onDeleteAllConversations,
  onNewConversation
}: ConversationManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [saveTitle, setSaveTitle] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleSaveConversation = () => {
    if (saveTitle.trim() && currentConversation.length > 0) {
      onSaveConversation(saveTitle.trim())
      setSaveTitle("")
      setShowSaveDialog(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getConversationPreview = (messages: SavedConversation['messages']) => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return "Conversación vacía"
    return lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + "..."
      : lastMessage.content
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <History className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Historial</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Conversaciones
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={onNewConversation}
                className="flex-1"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Conversación
              </Button>
              
              {currentConversation.length > 0 && (
                <Button 
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Guardar Actual
                </Button>
              )}
            </div>
            
            {/* Delete All Button */}
            {savedConversations.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Todas las Conversaciones
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border text-foreground">
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar todas las conversaciones?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Esta acción no se puede deshacer. Todas las conversaciones guardadas ({savedConversations.length}) serán eliminadas permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onDeleteAllConversations}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar Todas
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Conversations List */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {savedConversations.length === 0 ? (
                  <CardCanvas className="empty-conversations">
                    <AnimatedCard className="p-4 bg-gray-800 border-gray-700 text-center">
                      <p className="text-gray-400">No hay conversaciones guardadas</p>
                    </AnimatedCard>
                  </CardCanvas>
                ) : (
                  savedConversations.map((conversation) => (
                    <CardCanvas key={conversation.id} className="conversation-item">
                      <AnimatedCard className="p-3 bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => {
                          onLoadConversation(conversation)
                          setIsOpen(false)
                        }}>
                          <h3 className="font-medium text-white mb-1">{conversation.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {getConversationPreview(conversation.messages)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(conversation.updatedAt)}
                            </span>
                            <span>{conversation.messages.length} mensajes</span>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border text-foreground">
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Esta acción no se puede deshacer. La conversación "{conversation.title}" será eliminada permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDeleteConversation(conversation.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      </AnimatedCard>
                    </CardCanvas>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Conversation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Guardar Conversación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm text-gray-300">
                Título de la conversación
              </Label>
              <Input
                id="title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Ej: Consulta sobre programación"
                className="bg-gray-800 border-gray-600 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveConversation()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConversation} disabled={!saveTitle.trim()}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}