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
import { Settings, User, ExternalLink, Palette, Keyboard, Sun, Moon, Monitor, AlertTriangle, TrendingUp, RefreshCw, Eye, EyeOff } from "lucide-react"
import { AIProvider } from "@/hooks/use-openai"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { AI_AGENTS, AIAgent } from "@/hooks/use-user-data"
import { ThemeSelector, ThemeSettings } from "@/components/theme-selector"
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useNotifications } from "@/hooks/use-notifications"

interface AISettings {
  provider: AIProvider
  openaiApiKey: string
  openaiModel: string
  lmstudioApiKey: string
  lmstudioBaseUrl: string
  lmstudioModel: string
  anthropicApiKey: string
  anthropicModel: string
  deepseekApiKey: string
  grokApiKey: string
  grokModel: string
  geminiApiKey: string
  geminiModel: string
  geminiImageModel: string
  falApiKey: string
  falVideoModel: string
  selectedAgent: string
  modelHistory: ModelHistoryEntry[]
  qwenBaseUrl: string
  qwenModel: string
  qwenImageModel?: string
  dashscopeApiKey?: string
  qwenTtsModel?: string
  deepseekLmBaseUrl: string
  deepseekLmModel: string
  useSpecialPrompt: boolean
}

interface AIProviderSelectorProps {
  settings: AISettings
  onSettingsChange: (settings: AISettings) => void
  themeSettings: ThemeSettings
  onThemeSettingsChange: (settings: ThemeSettings) => void
}

interface ModelHistoryEntry {
  name: string
  provider: AIProvider
  lastUsed: Date
  usageCount: number
}

interface ApiKeyInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

function ApiKeyInput({ id, value, onChange, placeholder }: ApiKeyInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="sr-only">
          {showPassword ? "Ocultar API Key" : "Mostrar API Key"}
        </span>
      </Button>
    </div>
  )
}

export default function AIProviderSelector({ settings, onSettingsChange, themeSettings, onThemeSettingsChange }: AIProviderSelectorProps) {
  const [open, setOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState<AISettings>(settings)
  const [tempThemeSettings, setTempThemeSettings] = useState<ThemeSettings>(themeSettings)
  const [sortBy, setSortBy] = useState<'usage' | 'date'>('usage')
  const [isConnected, setIsConnected] = useState(navigator.onLine)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionStartTime] = useState(Date.now())
  const [refreshKey, setRefreshKey] = useState(0)
  const { conversation, clearCorruptedData, forceResetApp } = useLocalStorage()
  const { setTheme } = useTheme()
  const { showNotification } = useNotifications()

  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  useEffect(() => {
    setTempThemeSettings(themeSettings)
  }, [themeSettings])

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
    onThemeSettingsChange(tempThemeSettings)
    setOpen(false)
  }

  const handleCancel = () => {
    setTempSettings(settings)
    setTempThemeSettings(themeSettings)
    setOpen(false)
  }

  const updateThemeSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    const newSettings = { ...tempThemeSettings, [key]: value }
    setTempThemeSettings(newSettings)
    
    // Apply theme changes immediately
    if (key === 'theme') {
      setTheme(value as string)
    }
  }

  const handleRefreshChart = () => {
    setRefreshKey(prev => prev + 1)
    showNotification({ 
      title: 'Gráfica actualizada', 
      body: 'Los datos de velocidad de respuesta se han recargado',
      soundType: 'success', 
      playSound: false 
    })
  }

  const themeOptions = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Oscuro", icon: Moon },
    { value: "system" as const, label: "Sistema", icon: Monitor },
  ]

  const accentColors = [
    { value: "blue" as const, label: "Azul", color: "bg-blue-500" },
    { value: "green" as const, label: "Verde", color: "bg-green-500" },
    { value: "purple" as const, label: "Morado", color: "bg-purple-500" },
    { value: "orange" as const, label: "Naranja", color: "bg-orange-500" },
    { value: "red" as const, label: "Rojo", color: "bg-red-500" },
    { value: "pink" as const, label: "Rosa", color: "bg-pink-500" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-1 sm:px-2 lg:px-3">
          <Settings className="w-4 h-4" />
          <span className="hidden lg:inline ml-2">Ajustes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader className="relative">
          <DialogTitle>Configuración de IA</DialogTitle>
          <DialogDescription>
            Configura el proveedor de IA y sus parámetros
          </DialogDescription>
          <img 
            src="/iaconfig.png" 
            alt="IA Config" 
            className="absolute -top-4 right-4 w-16 h-16 opacity-100 object-contain"
          />
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
                  <SelectItem value="fal">Fal AI (Video)</SelectItem>
                  <SelectItem value="qwen">Qwen (DashScope)</SelectItem>
                  <SelectItem value="deepseek-lm">DeepSeek-LM (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent Selection - Available for all providers */}
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

            {/* OpenAI Settings */}
            {tempSettings.provider === "openai" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">API Key de OpenAI</Label>
                  <ApiKeyInput
                    id="openai-key"
                    placeholder="sk-..."
                    value={tempSettings.openaiApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openai-model">Modelo de OpenAI</Label>
                  <Select
                    value={tempSettings.openaiModel}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, openaiModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-5.2">GPT-5.2 (Más reciente - Dic 2025)</SelectItem>
                      <SelectItem value="gpt-5.2-codex">GPT-5.2 Codex (Programación - Ene 2026)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="o1-preview">o1-preview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme Settings */}
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Personalización
                  </h4>
                  <div className="space-y-4">
                    {/* Theme Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Tema</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {themeOptions.map((option) => {
                          const Icon = option.icon
                          return (
                            <Button
                              key={option.value}
                              variant={tempThemeSettings.theme === option.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateThemeSetting("theme", option.value)}
                              className="flex flex-col gap-1 h-auto py-3"
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{option.label}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Color de acento</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {accentColors.map((color) => (
                          <Button
                            key={color.value}
                            variant="outline"
                            size="sm"
                            onClick={() => updateThemeSetting("accentColor", color.value)}
                            className={`h-8 w-8 p-0 border-2 ${
                              tempThemeSettings.accentColor === color.value
                                ? "border-foreground"
                                : "border-muted"
                            }`}
                            title={color.label}
                          >
                            <div className={`w-4 h-4 rounded-full ${color.color}`} />
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Accessibility Options */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Movimiento reducido</Label>
                        <Switch
                          checked={tempThemeSettings.reducedMotion}
                          onCheckedChange={(checked) => updateThemeSetting("reducedMotion", checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Alto contraste</Label>
                        <Switch
                          checked={tempThemeSettings.highContrast}
                          onCheckedChange={(checked) => updateThemeSetting("highContrast", checked)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tamaño de fuente: {tempThemeSettings.fontSize}px</Label>
                        <Slider
                          value={[tempThemeSettings.fontSize]}
                          onValueChange={([value]) => updateThemeSetting("fontSize", value)}
                          min={12}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Speed Graph */}
                <div className="rounded-lg border p-4 bg-muted/50 h-[430px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Velocidades de Respuesta
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshChart}
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex-1 relative" key={refreshKey}>
                    {(() => {
                      const responseData = conversation
                         .filter(message => message.role === "assistant" && message.responseTime && message.timestamp)
                         .map(message => ({
                           time: new Date(message.timestamp).getTime(),
                           responseTime: message.responseTime! / 1000, // Convert to seconds
                           timestamp: message.timestamp
                         }))
                         .sort((a, b) => a.time - b.time)
                         .slice(-20) // Show last 20 messages for better visualization
                      
                      if (responseData.length === 0) {
                        return (
                          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            No hay datos de velocidad disponibles
                          </div>
                        )
                      }
                      
                      const maxTime = Math.max(...responseData.map(d => d.responseTime))
                      const minTime = Math.min(...responseData.map(d => d.responseTime))
                      const timeRange = maxTime - minTime || 1
                      
                      const svgWidth = 100
                      const svgHeight = 100
                      const padding = 10
                      
                      const points = responseData.map((data, index) => {
                        const x = padding + (index / (responseData.length - 1 || 1)) * (svgWidth - 2 * padding)
                        const y = svgHeight - padding - ((data.responseTime - minTime) / timeRange) * (svgHeight - 2 * padding)
                        return { x, y, data }
                      })
                      
                      const pathData = points.map((point, index) => 
                        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                      ).join(' ')
                      
                      const currentTheme = tempThemeSettings.theme
                      const accentColor = tempThemeSettings.accentColor
                      
                      // Define colors based on theme and accent
                      const getLineColor = () => {
                        if (currentTheme === 'dark') {
                          switch (accentColor) {
                            case 'blue': return '#3b82f6'
                            case 'green': return '#10b981'
                            case 'purple': return '#8b5cf6'
                            case 'orange': return '#f59e0b'
                            case 'red': return '#ef4444'
                            case 'pink': return '#ec4899'
                            default: return '#3b82f6'
                          }
                        } else {
                          switch (accentColor) {
                            case 'blue': return '#2563eb'
                            case 'green': return '#059669'
                            case 'purple': return '#7c3aed'
                            case 'orange': return '#d97706'
                            case 'red': return '#dc2626'
                            case 'pink': return '#db2777'
                            default: return '#2563eb'
                          }
                        }
                      }
                      
                      return (
                         <div className="w-full h-full flex flex-col">
                           <div className="flex-1 min-h-0">
                             <svg 
                               viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                               className="w-full h-full"
                               preserveAspectRatio="none"
                             >
                               {/* Background */}
                                <rect width="100%" height="100%" fill="currentColor" fillOpacity="0.02" />
                                
                                {/* Grid lines */}
                                <defs>
                                  <pattern id="responseGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.05"/>
                                  </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#responseGrid)" />
                               
                               {/* Line */}
                               <path
                                  d={pathData}
                                  fill="none"
                                  stroke={getLineColor()}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                               
                               {/* Points */}
                               {points.map((point, index) => (
                                 <circle
                                    key={index}
                                    cx={point.x}
                                    cy={point.y}
                                    r="2.5"
                                    fill="white"
                                    stroke={getLineColor()}
                                    strokeWidth="1.5"
                                    className="hover:r-4 transition-all cursor-pointer"
                                  >
                                    <title>{`${point.data.responseTime.toFixed(2)}s - ${new Date(point.data.timestamp).toLocaleTimeString()}`}</title>
                                  </circle>
                               ))}
                             </svg>
                           </div>
                           
                           {/* Legend */}
                           <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground flex-shrink-0">
                             <div className="flex items-center gap-1">
                               <div className="w-3 h-0.5 bg-current" style={{backgroundColor: getLineColor()}}></div>
                               <span>Tendencia de velocidad</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <div className="w-2 h-2 rounded-full bg-white border" style={{borderColor: getLineColor()}}></div>
                               <span>Tiempo de respuesta</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <div className="w-3 h-3 opacity-20" style={{backgroundImage: 'url(#responseGrid)'}}></div>
                               <span>Cuadrícula de referencia</span>
                             </div>
                           </div>
                           
                           {/* Stats */}
                           <div className="mt-2 grid grid-cols-3 gap-2 text-xs flex-shrink-0">
                             <div className="text-center">
                               <div className="font-medium">{responseData.length}</div>
                               <div className="text-muted-foreground">Mensajes</div>
                             </div>
                             <div className="text-center">
                               <div className="font-medium">{(responseData.reduce((sum, d) => sum + d.responseTime, 0) / responseData.length).toFixed(1)}s</div>
                               <div className="text-muted-foreground">Promedio</div>
                             </div>
                             <div className="text-center">
                               <div className="font-medium">{minTime.toFixed(1)}s</div>
                               <div className="text-muted-foreground">Más rápido</div>
                             </div>
                           </div>
                         </div>
                       )
                    })()}
                  </div>
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
                

              </div>
            )}


            {/* Anthropic Settings */}
            {tempSettings.provider === "anthropic" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="anthropic-key">API Key de Anthropic</Label>
                  <ApiKeyInput
                    id="anthropic-key"
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
                      <SelectItem value="claude-4-5-opus">Claude 4.5 Opus (Flagship - Nov 2025)</SelectItem>
                      <SelectItem value="claude-4-5-sonnet">Claude 4.5 Sonnet (Ene 2026)</SelectItem>
                      <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                      <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</SelectItem>
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
                  <ApiKeyInput
                    id="deepseek-key"
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
                  <ApiKeyInput
                    id="grok-key"
                    placeholder="xai-..."
                    value={tempSettings.grokApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, grokApiKey: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grok-model">Modelo de Grok</Label>
                  <Select
                    value={tempSettings.grokModel || "grok-4-1-fast-reasoning"}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, grokModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok-4-1-fast-reasoning">Grok 4.1 Fast Reasoning (grok-4-1-fast-reasoning)</SelectItem>
                      <SelectItem value="grok-code-fast-1">Grok Code Fast 1</SelectItem>
                      <SelectItem value="grok-2-1212">Grok 2 (grok-2-1212)</SelectItem>
                      <SelectItem value="grok-2-vision-1212">Grok 2 Vision (grok-2-vision-1212)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Gemini Settings */}
            {tempSettings.provider === "gemini" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">API Key de Google Gemini</Label>
                  <ApiKeyInput
                    id="gemini-key"
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
                      <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash Preview (Dic 2025)</SelectItem>
                      <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro Preview (Nov 2025)</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</SelectItem>
                      <SelectItem value="gemini-live-2.5-flash-preview">Gemini 2.5 Flash Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gemini-image-model">Modelo de Generación de Imágenes</Label>
                  <Select
                    value={tempSettings.geminiImageModel}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, geminiImageModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modelo para imágenes" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="gemini-3-pro-image-preview">Nano Banana Pro (gemini-3-pro-image-preview)</SelectItem>
                       <SelectItem value="gemini-2.5-flash-image-preview">Nano Banana (gemini-2.5-flash-image-preview)</SelectItem>
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

            {/* Fal AI Settings */}
            {tempSettings.provider === "fal" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fal-key">API Key de Fal AI</Label>
                  <ApiKeyInput
                    id="fal-key"
                    placeholder="fal_..."
                    value={tempSettings.falApiKey}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, falApiKey: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fal-video-model">Modelo de Video</Label>
                  <Select
                    value={tempSettings.falVideoModel}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, falVideoModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modelo de video" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fal-ai/kling-video/v2.1/pro/image-to-video">Kling Video Pro (fal-ai/kling-video/v2.1/pro/image-to-video)</SelectItem>
                      <SelectItem value="fal-ai/kling-video/v2.1/standard/image-to-video">Kling Video Standard (fal-ai/kling-video/v2.1/standard/image-to-video)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="rounded-lg border p-3 bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    <strong>Fal AI:</strong> Especializado en generación de videos desde imágenes. 
                    Sube una imagen y genera videos dinámicos con movimiento natural.
                  </p>
                </div>
              </div>
            )}

            {/* Qwen Settings */}
            {tempSettings.provider === "qwen" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashscope-key">API Key de DashScope</Label>
                  <ApiKeyInput
                    id="dashscope-key"
                    placeholder="sk-..."
                    value={tempSettings.dashscopeApiKey || ''}
                    onChange={(e) => 
                      setTempSettings(prev => ({ ...prev, dashscopeApiKey: e.target.value }))
                    }
                  />
                </div>
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
                  <Label>Modelo de Qwen (Texto)</Label>
                  <Select
                    value={tempSettings.qwenModel}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, qwenModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qwen-flash">qwen-flash</SelectItem>
                      <SelectItem value="qwen-plus">qwen-plus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modelo de Qwen (Imágenes)</Label>
                  <Select
                    value={tempSettings.qwenImageModel || ''}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, qwenImageModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qwen3-vl-plus">qwen3-vl-plus</SelectItem>
                      <SelectItem value="qwen-vl-plus">qwen-vl-plus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modelo de Qwen (Voz / TTS)</Label>
                  <Select
                    value={tempSettings.qwenTtsModel || ''}
                    onValueChange={(value) => 
                      setTempSettings(prev => ({ ...prev, qwenTtsModel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qwen3-tts-flash">qwen3-tts-flash</SelectItem>
                    </SelectContent>
                  </Select>
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

            {/* Repair Tools */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Herramientas de Reparación
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded border bg-background/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Limpiar Datos Corruptos</div>
                    <div className="text-xs text-muted-foreground">
                      Elimina datos corruptos que pueden causar errores
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      clearCorruptedData()
                      showNotification({ 
                        title: 'Datos corruptos limpiados', 
                        body: 'Si el error persiste, usa la opción de reinicio completo',
                        soundType: 'success', 
                        playSound: false 
                      })
                    }}
                    className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded border bg-background/50">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Reinicio Completo</div>
                    <div className="text-xs text-muted-foreground">
                      Elimina todos los datos y reinicia la aplicación
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      showNotification({ 
                        title: 'Reiniciando aplicación...', 
                        body: 'Se eliminará todo y la página se recargará',
                        soundType: 'warning', 
                        playSound: false 
                      })
                      forceResetApp()
                    }}
                    className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Atajos de Teclado
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span>Enviar mensaje</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">Enter</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Nueva conversación</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">N</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Guardar conversación</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">S</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Abrir conversación</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">O</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Cambiar modo de chat</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">M</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Limpiar conversación</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">K</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Cambiar tema</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">Shift</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">T</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Mostrar atajos</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">Ctrl</Badge>
                      <Badge variant="outline" className="text-xs px-1 py-0">?</Badge>
                    </div>
                  </div>
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