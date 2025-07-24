"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Save, Check, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAutoSave } from "@/hooks/use-auto-save"

interface AutoSaveIndicatorProps {
  conversations: any[]
  onSave?: () => void
  className?: string
}

export function AutoSaveIndicator({ conversations, onSave, className }: AutoSaveIndicatorProps) {
  const { manualSave, getStatus } = useAutoSave({
    conversation: conversations,
    onSave: (title: string, messages: any[]) => {
      if (onSave) {
        onSave()
      }
    }
  })
  const [status, setStatus] = useState(getStatus())
  const [showSaved, setShowSaved] = useState(false)

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getStatus())
    }, 1000)

    return () => clearInterval(interval)
  }, [getStatus])

  const handleManualSave = async () => {
    try {
      await manualSave()
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `hace ${days}d`
    if (hours > 0) return `hace ${hours}h`
    if (minutes > 0) return `hace ${minutes}m`
    return 'ahora'
  }

  const getStatusIcon = () => {
    if (showSaved) {
      return <Check className="w-3 h-3 text-green-400" />
    }
    
    if (!status.enabled) {
      return <Save className="w-3 h-3 text-gray-400" />
    }
    
    if (status.lastSave) {
      return <Check className="w-3 h-3 text-green-400" />
    }
    
    if (status.canAutoSave) {
      return <Clock className="w-3 h-3 text-yellow-400" />
    }
    
    return <Save className="w-3 h-3 text-gray-400" />
  }

  const getStatusText = () => {
    if (showSaved) return 'Guardado'
    
    if (!status.enabled) {
      return 'Auto-guardado desactivado'
    }
    
    if (status.lastSave) {
      return `Guardado ${formatTimeAgo(status.lastSave.getTime())}`
    }
    
    if (status.canAutoSave) {
      const pendingMessages = Math.max(0, status.messageCount - (status.lastSave ? 2 : 0))
      return `${pendingMessages} mensajes sin guardar`
    }
    
    return 'Sin cambios'
  }

  const getStatusColor = () => {
    if (showSaved) return 'bg-green-900 text-green-300 border-green-700'
    
    if (!status.enabled) {
      return 'bg-gray-800 text-gray-400 border-gray-600'
    }
    
    if (status.lastSave) {
      return 'bg-green-900 text-green-300 border-green-700'
    }
    
    if (status.canAutoSave) {
      return 'bg-yellow-900 text-yellow-300 border-yellow-700'
    }
    
    return 'bg-gray-800 text-gray-400 border-gray-600'
  }

  const shouldShowManualSave = status.canAutoSave && status.enabled

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Manual save button with badge */}
      {shouldShowManualSave && (
        <div className="relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSave}
                  className="text-gray-400 hover:text-white h-8 px-2"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden lg:inline ml-1 text-sm">Guardar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p>Guardar conversación manualmente (Ctrl+S)</p>
                  <p><strong>Mensajes sin guardar:</strong> {status.messageCount}</p>
                  {status.nextSaveIn > 0 && status.enabled && (
                    <p><strong>Próximo guardado en:</strong> {Math.ceil(status.nextSaveIn / 60)}m</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Small orange badge with message count */}
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium bg-orange-500 text-white border-0 min-w-[20px]"
          >
            {status.messageCount}
          </Badge>
        </div>
      )}
    </div>
  )
}

// Settings component for auto-save preferences
export function AutoSaveSettings() {
  const [interval, setInterval] = useState(5) // minutes
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    // Load settings from localStorage
    const savedInterval = localStorage.getItem('auto-save-interval')
    const savedEnabled = localStorage.getItem('auto-save-enabled')
    
    if (savedInterval) setInterval(parseInt(savedInterval))
    if (savedEnabled !== null) setEnabled(JSON.parse(savedEnabled))
  }, [])

  const handleIntervalChange = (newInterval: number) => {
    setInterval(newInterval)
    localStorage.setItem('auto-save-interval', newInterval.toString())
  }

  const handleEnabledChange = (newEnabled: boolean) => {
    setEnabled(newEnabled)
    localStorage.setItem('auto-save-enabled', JSON.stringify(newEnabled))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">
          Auto-guardado
        </label>
        <Button
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={() => handleEnabledChange(!enabled)}
        >
          {enabled ? 'Activado' : 'Desactivado'}
        </Button>
      </div>
      
      {enabled && (
        <div className="space-y-2">
          <label className="text-sm text-gray-300">
            Intervalo de guardado (minutos)
          </label>
          <div className="flex gap-2">
            {[1, 3, 5, 10, 15].map(minutes => (
              <Button
                key={minutes}
                variant={interval === minutes ? "default" : "outline"}
                size="sm"
                onClick={() => handleIntervalChange(minutes)}
                className="text-xs"
              >
                {minutes}m
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}