"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Moon, Sun, Palette, Monitor, Zap } from "lucide-react"

export type Theme = "light" | "dark" | "system"
export type AccentColor = "blue" | "green" | "purple" | "orange" | "red" | "pink"

interface ThemeSettings {
  theme: Theme
  accentColor: AccentColor
  reducedMotion: boolean
  fontSize: number
  highContrast: boolean
}

interface ThemeSelectorProps {
  settings: ThemeSettings
  onSettingsChange: (settings: ThemeSettings) => void
}

export function ThemeSelector({ settings, onSettingsChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { setTheme } = useTheme()

  // Sync theme on mount and when settings change
  useEffect(() => {
    setTheme(settings.theme)
  }, [settings.theme, setTheme])

  const updateSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    
    // Apply theme changes immediately
    if (key === 'theme') {
      setTheme(value as string)
    }
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

  const getCurrentThemeIcon = () => {
    const option = themeOptions.find(opt => opt.value === settings.theme)
    return option ? option.icon : Sun
  }

  const ThemeIcon = getCurrentThemeIcon()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <ThemeIcon className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Tema</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Personalización
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={settings.theme === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("theme", option.value)}
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
            <div className="grid grid-cols-3 gap-2">
              {accentColors.map((color) => (
                <Button
                  key={color.value}
                  variant={settings.accentColor === color.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting("accentColor", color.value)}
                  className="flex items-center gap-2 justify-start"
                >
                  <div className={`w-3 h-3 rounded-full ${color.color}`} />
                  <span className="text-xs">{color.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tamaño de fuente</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting("fontSize", value)}
                min={12}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Pequeño</span>
                <span>{settings.fontSize}px</span>
                <span>Grande</span>
              </div>
            </div>
          </div>

          {/* Accessibility Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Accesibilidad</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">Alto contraste</Label>
                <p className="text-xs text-gray-400">Mejora la legibilidad</p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting("highContrast", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Reducir animaciones
                </Label>
                <p className="text-xs text-gray-400">Menos movimiento en la interfaz</p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
              />
            </div>
          </div>

          {/* Preview */}
          <Card className="p-4 bg-gray-800 border-gray-700">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vista previa</Label>
              <div 
                className="p-3 rounded border"
                style={{ 
                  fontSize: `${settings.fontSize}px`,
                  filter: settings.highContrast ? 'contrast(1.2)' : 'none'
                }}
              >
                <p className="text-white">Texto de ejemplo</p>
                <p className="text-gray-400 text-sm">Texto secundario</p>
                <div className={`w-4 h-4 rounded mt-2 ${
                  accentColors.find(c => c.value === settings.accentColor)?.color
                }`} />
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}