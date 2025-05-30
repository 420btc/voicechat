"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Settings, User, ExternalLink } from "lucide-react"
import { AIProvider } from "@/hooks/use-openai"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { AI_AGENTS, AIAgent } from "@/hooks/use-user-data"

interface AISettings {
  provider: AIProvider
  openaiApiKey: string
  lmstudioApiKey: string
  lmstudioBaseUrl: string
  lmstudioModel: string
  anthropicApiKey: string
  anthropicModel: string
  deepseekApiKey: string
  grokApiKey: string
  geminiApiKey: string
  geminiModel: string
  selectedAgent: string
  modelHistory: ModelHistoryEntry[]
  qwenBaseUrl: string
  qwenModel: string
  deepseekLmBaseUrl: string
  deepseekLmModel: string
  useSpecialPrompt: boolean
}

interface AIProviderSelectorProps {
  settings: AISettings
  onSettingsChange: (settings: AISettings) => void
}

interface ModelHistoryEntry {
  name: string
  provider: AIProvider
  lastUsed: Date
  usageCount: number
}

export default function AIProviderSelector({ settings, onSettingsChange }: AIProviderSelectorProps) {
  const [open, setOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState<AISettings>(settings)
  const [sortBy, setSortBy] = useState<'usage' | 'date'>('usage')
  const [isConnected, setIsConnected] = useState(navigator.onLine)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionStartTime] = useState(Date.now())
  const { conversation } = useLocalStorage()

  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Update session time
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStartTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime])

  // Función para calcular el tiempo total de uso de un modelo
  const calculateModelTime = (modelName: string): number => {
    let totalTime = 0
    conversation.forEach(message => {
      if (message.model === modelName && message.responseTime) {
        totalTime += message.responseTime
      }
    })
    return totalTime
  }

  // Función para formatear el tiempo en formato legible
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // Función para formatear tiempo de sesión
  const formatSessionTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Función para calcular el tiempo promedio de respuesta de un modelo
  const calculateAverageResponseTime = (modelName: string): number => {
    const modelMessages = conversation.filter(message => 
      message.model === modelName && 
      message.responseTime && 
      message.role === "assistant"
    )
    
    if (modelMessages.length === 0) return 0
    
    const totalTime = modelMessages.reduce((sum, message) => sum + (message.responseTime || 0), 0)
    return totalTime / modelMessages.length
  }

  // Función para obtener el ranking de modelos por velocidad
  const getModelSpeedRanking = () => {
    const modelStats = new Map<string, { totalTime: number, messageCount: number, avgTime: number }>()
    
    conversation.forEach(message => {
      if (message.model && message.responseTime && message.role === "assistant") {
        const current = modelStats.get(message.model) || { totalTime: 0, messageCount: 0, avgTime: 0 }
        current.totalTime += message.responseTime
        current.messageCount += 1
        current.avgTime = current.totalTime / current.messageCount
        modelStats.set(message.model, current)
      }
    })
    
    return Array.from(modelStats.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .filter(item => item.messageCount >= 1) // Solo modelos con al menos 1 mensaje
      .sort((a, b) => a.avgTime - b.avgTime) // Ordenar por tiempo promedio (más rápido primero)
  }

  const handleSave = () => {
    onSettingsChange(tempSettings)
    setOpen(false)
  }

  const handleCancel = () => {
    setTempSettings(settings)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configurar IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configuración de IA</DialogTitle>
          <DialogDescription>
            Configura el proveedor de IA y sus parámetros
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto flex-1 min-h-0">
          {/* Left Column - Provider Selection and Basic Settings */}
          <div className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor de IA</Label>
              <Select
                value={tempSettings.provider}
                onValueChange={(value: AIProvider) => 
                  setTempSettings(prev => ({ ...prev, provider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="lmstudio">LM Studio (Local)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="grok">Grok (X.AI)</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="qwen">Qwen (Local)</SelectItem>
                  <SelectItem value="deepseek-lm">DeepSeek-LM (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* OpenAI Settings */}
            {tempSettings.provider === "openai" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">API Key de OpenAI</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={tempSettings.openaiApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}


            {/* LM Studio Settings */}
            {tempSettings.provider === "lmstudio" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lmstudio-url">URL Base de LM Studio</Label>
                  <Input
                    id="lmstudio-url"
                    placeholder="http://localhost:1234"
                    value={tempSettings.lmstudioBaseUrl}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, lmstudioBaseUrl: e.target.value }))
                    }
                  />
                </div>
                
                {/* Agent Selection */}
                <div className="space-y-2">
                  <Label htmlFor="agent-select">Seleccionar Agente Especializado</Label>
                  <Select
                    value={tempSettings.selectedAgent}
                    onValueChange={(value: string) => 
                      setTempSettings(prev => ({ ...prev, selectedAgent: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {AI_AGENTS.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{agent.icon}</span>
                            <div className="flex flex-col">
                              <span className="font-medium">{agent.name}</span>
                              <span className="text-xs text-muted-foreground">{agent.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Agent Description */}
                  {(() => {
                    const selectedAgent = AI_AGENTS.find(agent => agent.id === tempSettings.selectedAgent)
                    return selectedAgent ? (
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{selectedAgent.icon}</span>
                          <span className="font-medium">{selectedAgent.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{selectedAgent.description}</p>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver prompt del sistema</summary>
                          <p className="mt-2 p-2 bg-muted/50 rounded text-muted-foreground">{selectedAgent.systemPrompt}</p>
                        </details>
                      </div>
                    ) : null
                  })()}
                  
                  {/* Model Speed Ranking */}
                  {(() => {
                    const speedRanking = getModelSpeedRanking()
                    return speedRanking.length > 0 ? (
                      <div className="rounded-lg border p-4 bg-muted/50 h-[260px] flex flex-col">
                         <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                           <span>⚡</span>
                           Modelos Más Rápidos
                         </h4>
                         <div className="space-y-2 flex-1 overflow-y-auto">
                           {speedRanking.slice(0, 10).map((item, index) => (
                             <div key={item.model} className="flex items-center justify-between text-xs">
                               <div className="flex items-center gap-2">
                                 <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                   index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                   index === 1 ? 'bg-gray-300 text-gray-700' :
                                   index === 2 ? 'bg-orange-400 text-orange-900' :
                                   'bg-muted text-muted-foreground'
                                 }`}>
                                   {index + 1}
                                 </span>
                                 <span className="font-medium">
                                    {item.model}
                                  </span>
                               </div>
                               <div className="text-right">
                                 <div className="font-medium">
                                   {formatTime(item.avgTime)}
                                 </div>
                                 <div className="text-muted-foreground">
                                   {item.messageCount} msg{item.messageCount !== 1 ? 's' : ''}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                         <p className="text-xs text-muted-foreground mt-2">
                           Tiempo promedio de respuesta en esta computadora
                         </p>
                       </div>
                    ) : null
                  })()}
                </div>
              </div>
            )}


            {/* Anthropic Settings */}
            {tempSettings.provider === "anthropic" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="anthropic-key">API Key de Anthropic</Label>
                  <Input
                    id="anthropic-key"
                    type="password"
                    placeholder="sk-ant-..."
                    value={tempSettings.anthropicApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, anthropicApiKey: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="anthropic-model">Modelo de Claude</Label>
                  <Select
                    value={tempSettings.anthropicModel}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, anthropicModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4 (Más reciente)</SelectItem>
                      <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</SelectItem>
                      <SelectItem value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku (Rápido)</SelectItem>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus (Potente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* DeepSeek Settings */}
            {tempSettings.provider === "deepseek" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deepseek-key">API Key de DeepSeek</Label>
                  <Input
                    id="deepseek-key"
                    type="password"
                    placeholder="sk-..."
                    value={tempSettings.deepseekApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, deepseekApiKey: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Grok Settings */}
            {tempSettings.provider === "grok" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grok-key">API Key de Grok (X.AI)</Label>
                  <Input
                    id="grok-key"
                    type="password"
                    placeholder="xai-..."
                    value={tempSettings.grokApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, grokApiKey: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Gemini Settings */}
            {tempSettings.provider === "gemini" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">API Key de Google Gemini</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="AIza..."
                    value={tempSettings.geminiApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gemini-model">Modelo de Gemini</Label>
                  <Select
                    value={tempSettings.geminiModel}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, geminiModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemma-3-4b">Gemma 3 4B (Con procesamiento de imágenes)</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {tempSettings.geminiModel === "google/gemma-3-4b" && (
                  <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Gemma 3 4B:</strong> Modelo especializado con capacidades de procesamiento de imágenes. 
                      Podrás subir imágenes junto con tus mensajes para análisis visual.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Qwen Settings */}
            {tempSettings.provider === "qwen" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qwen-url">URL Base de Qwen</Label>
                  <Input
                    id="qwen-url"
                    placeholder="http://localhost:1234"
                    value={tempSettings.qwenBaseUrl}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, qwenBaseUrl: e.target.value, useSpecialPrompt: true }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="qwen-model">Modelo de Qwen</Label>
                  <Input
                    id="qwen-model"
                    placeholder="qwen2.5-72b-instruct"
                    value={tempSettings.qwenModel}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, qwenModel: e.target.value }))
                    }
                  />
                </div>
                
                <div className="rounded-lg border p-3 bg-orange-50 dark:bg-orange-950/20">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>Prompt Especial Activado:</strong> Los modelos Qwen utilizan un prompt de sistema optimizado automáticamente. 
                    Los agentes especializados se desactivarán mientras uses este proveedor.
                  </p>
                </div>
              </div>
            )}

            {/* DeepSeek-LM Settings */}
            {tempSettings.provider === "deepseek-lm" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deepseek-lm-url">URL Base de DeepSeek-LM</Label>
                  <Input
                    id="deepseek-lm-url"
                    placeholder="http://localhost:1234"
                    value={tempSettings.deepseekLmBaseUrl}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, deepseekLmBaseUrl: e.target.value, useSpecialPrompt: true }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deepseek-lm-model">Modelo de DeepSeek-LM</Label>
                  <Input
                    id="deepseek-lm-model"
                    placeholder="deepseek-v3"
                    value={tempSettings.deepseekLmModel}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, deepseekLmModel: e.target.value }))
                    }
                  />
                </div>
                
                <div className="rounded-lg border p-3 bg-orange-50 dark:bg-orange-950/20">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>Prompt Especial Activado:</strong> Los modelos DeepSeek-LM utilizan un prompt de sistema optimizado automáticamente. 
                    Los agentes especializados se desactivarán mientras uses este proveedor.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Model History and Info */}
          <div className="space-y-6">
            {/* Model History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Historial de Modelos Usados</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy(sortBy === 'usage' ? 'date' : 'usage')}
                    className="text-xs"
                  >
                    {sortBy === 'usage' ? 'Por Fecha' : 'Por Uso'}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-muted/30 max-h-60 overflow-y-auto">
                {settings.modelHistory.length > 0 ? (
                  <div className="space-y-2">
                    {settings.modelHistory
                      .filter(entry => entry.provider === tempSettings.provider)
                      .sort((a, b) => {
                        if (sortBy === 'usage') {
                          return b.usageCount - a.usageCount
                        } else {
                          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
                        }
                      })
                      .map((entry, index) => {
                        const totalTime = calculateModelTime(entry.name)
                        return (
                          <div key={index} className="flex justify-between items-start text-sm border-b border-muted pb-2 last:border-b-0">
                            <div className="flex-1">
                              <span className="font-medium block">{entry.name}</span>
                              <div className="text-xs text-muted-foreground mt-1">
                                <span>Usado {entry.usageCount} veces</span>
                                {totalTime > 0 && (
                                  <span className="ml-2">• Tiempo total: {formatTime(totalTime)}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              <span className="block">
                                {new Date(entry.lastUsed).toLocaleDateString()}
                              </span>
                              <span className="block">
                                {new Date(entry.lastUsed).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay modelos en el historial aún
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Los modelos se detectan automáticamente cuando se usan
              </p>
            </div>



            {/* Statistics Card */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-3">Estadísticas de Uso</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {settings.modelHistory.filter(entry => entry.provider === tempSettings.provider).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Modelos Usados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {settings.modelHistory
                      .filter(entry => entry.provider === tempSettings.provider)
                      .reduce((total, entry) => total + entry.usageCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Usos</div>
                </div>
              </div>
            </div>

            {/* Connection Status & HuggingFace Access Card */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-3">Estado y Recursos</h4>
              <div className="space-y-3">
                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={isConnected ? "default" : "destructive"}
                      className={isConnected ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                    >
                      <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-white' : 'bg-white'}`} />
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sesión: {formatSessionTime(sessionTime)}
                  </div>
                </div>
                
                {/* HuggingFace Access */}
                <div className="flex items-center justify-between p-2 rounded border bg-background/50">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">HuggingFace Models</div>
                    <div className="text-xs text-muted-foreground">Descargar últimos modelos</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://huggingface.co/models', '_blank')}
                    className="h-8 px-3"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Acceder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}