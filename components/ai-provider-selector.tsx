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
}

interface AIProviderSelectorProps {
  settings: AISettings
  onSettingsChange: (settings: AISettings) => void
}

const LMSTUDIO_MODELS = [
  "Meta-Llama-3.1-8B-Instruct-GGUF",
  "Janus-Pro-7B-LM-GGUF", 
  "Devstral-Small-2505-GGUF",
  "local-model"
]

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
                <Label htmlFor="lmstudio-model">Modelo</Label>
                <Select
                  value={tempSettings.lmstudioModel}
                  onValueChange={(value) => 
                    setTempSettings(prev => ({ ...prev, lmstudioModel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LMSTUDIO_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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