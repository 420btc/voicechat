"use client"

import { useState } from "react"
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
import { Settings, User } from "lucide-react"
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
  selectedAgent: string
  modelHistory: ModelHistoryEntry[]
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
  const { conversation } = useLocalStorage()

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuración de IA</DialogTitle>
          <DialogDescription>
            Configura el proveedor de IA y sus parámetros
          </DialogDescription>
        </DialogHeader>
        
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
                <div className="rounded-lg border p-3 bg-muted/30 max-h-40 overflow-y-auto">
                  {settings.modelHistory.length > 0 ? (
                    <div className="space-y-2">
                      {settings.modelHistory
                        .filter(entry => entry.provider === "openai")
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
              </div>
              
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
                <div className="rounded-lg border p-3 bg-muted/30 max-h-40 overflow-y-auto">
                  {settings.modelHistory.length > 0 ? (
                    <div className="space-y-2">
                      {settings.modelHistory
                        .filter(entry => entry.provider === "lmstudio")
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
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">
              {(() => {
                switch (tempSettings.provider) {
                  case "openai": return "OpenAI"
                  case "lmstudio": return "LM Studio"
                  case "anthropic": return "Anthropic (Claude)"
                  case "deepseek": return "DeepSeek"
                  case "grok": return "Grok (X.AI)"
                  case "gemini": return "Google Gemini"
                  default: return "Proveedor de IA"
                }
              })()}
            </h4>
            <p className="text-xs text-muted-foreground">
              {(() => {
                switch (tempSettings.provider) {
                  case "openai":
                    return "Usa los modelos de OpenAI en la nube. Requiere API key válida y conexión a internet."
                  case "lmstudio":
                    return "Usa modelos locales a través de LM Studio. Asegúrate de que LM Studio esté ejecutándose en el puerto especificado."
                  case "anthropic":
                    return "Usa los modelos Claude de Anthropic. Requiere API key válida y conexión a internet."
                  case "deepseek":
                    return "Usa los modelos de DeepSeek. Requiere API key válida y conexión a internet."
                  case "grok":
                    return "Usa los modelos Grok de X.AI. Requiere API key válida y conexión a internet."
                  case "gemini":
                    return "Usa los modelos Gemini de Google. Requiere API key válida y conexión a internet."
                  default:
                    return "Selecciona un proveedor de IA para continuar."
                }
              })()}
            </p>
            {(tempSettings.provider === "lmstudio" || tempSettings.provider === "anthropic" || tempSettings.provider === "deepseek" || tempSettings.provider === "grok" || tempSettings.provider === "gemini") && (
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Nota:</strong> La transcripción de audio y text-to-speech seguirán usando OpenAI.
              </p>
            )}
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