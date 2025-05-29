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
import { Settings } from "lucide-react"
import { AIProvider } from "@/hooks/use-openai"

interface AISettings {
  provider: AIProvider
  openaiApiKey: string
  lmstudioApiKey: string
  lmstudioBaseUrl: string
  lmstudioModel: string
  modelHistory: ModelHistoryEntry[]
}

interface AIProviderSelectorProps {
  settings: AISettings
  onSettingsChange: (settings: AISettings) => void
}

interface ModelHistoryEntry {
  name: string
  provider: "openai" | "lmstudio"
  lastUsed: Date
  usageCount: number
}

export function AIProviderSelector({ settings, onSettingsChange }: AIProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState<AISettings>(settings)

  const handleSave = () => {
    onSettingsChange(tempSettings)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempSettings(settings)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="px-1 sm:px-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">AI</span>
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
              
              <div className="space-y-2">
                <Label>Historial de Modelos Usados</Label>
                <div className="rounded-lg border p-3 bg-muted/30 max-h-32 overflow-y-auto">
                  {settings.modelHistory.length > 0 ? (
                    <div className="space-y-2">
                      {settings.modelHistory
                        .filter(entry => entry.provider === "lmstudio")
                        .map((entry, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{entry.name}</span>
                          <div className="text-xs text-muted-foreground">
                            <span>Usado {entry.usageCount} veces</span>
                            <span className="ml-2">
                              {new Date(entry.lastUsed).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
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
              
              <div className="space-y-2">
                <Label htmlFor="lmstudio-key">API Key (opcional)</Label>
                <Input
                  id="lmstudio-key"
                  placeholder="lm-studio"
                  value={tempSettings.lmstudioApiKey}
                  onChange={(e) => 
                    setTempSettings(prev => ({ ...prev, lmstudioApiKey: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Por defecto LM Studio no requiere API key, pero puedes configurar una si es necesario
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">
              {tempSettings.provider === "openai" ? "OpenAI" : "LM Studio"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {tempSettings.provider === "openai" 
                ? "Usa los modelos de OpenAI en la nube. Requiere API key válida y conexión a internet."
                : "Usa modelos locales a través de LM Studio. Asegúrate de que LM Studio esté ejecutándose en el puerto especificado."
              }
            </p>
            {tempSettings.provider === "lmstudio" && (
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