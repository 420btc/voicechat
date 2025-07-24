"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Keyboard, Command } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface KeyboardShortcutsHelpProps {
  className?: string
}

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Enviar mensaje',
    category: 'Chat'
  },
  {
    keys: ['Escape'],
    description: 'Limpiar entrada / Cerrar modal',
    category: 'Chat'
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Limpiar conversación',
    category: 'Chat'
  },
  {
    keys: ['Ctrl', 'N'],
    description: 'Nueva conversación',
    category: 'Conversación'
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Guardar conversación',
    category: 'Conversación'
  },
  {
    keys: ['Ctrl', 'O'],
    description: 'Abrir conversación',
    category: 'Conversación'
  },
  {
    keys: ['Ctrl', 'M'],
    description: 'Cambiar modo de chat',
    category: 'Navegación'
  },
  {
    keys: ['/'],
    description: 'Enfocar entrada de texto',
    category: 'Navegación'
  },
  {
    keys: ['Ctrl', '?'],
    description: 'Mostrar atajos de teclado',
    category: 'Ayuda'
  },
  {
    keys: ['Ctrl', ','],
    description: 'Abrir configuración',
    category: 'Configuración'
  },
  {
    keys: ['Ctrl', 'Shift', 'T'],
    description: 'Cambiar tema',
    category: 'Configuración'
  },
  {
    keys: ['Ctrl', 'Shift', 'C'],
    description: 'Modo compacto',
    category: 'Vista'
  }
]

const categories = ['Chat', 'Conversación', 'Navegación', 'Configuración', 'Vista', 'Ayuda']

export function KeyboardShortcutsHelp({ className }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)

    // Listen for Ctrl+? to open shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const formatKey = (key: string) => {
    if (isMac) {
      switch (key) {
        case 'Ctrl':
          return '⌘'
        case 'Alt':
          return '⌥'
        case 'Shift':
          return '⇧'
        case 'Enter':
          return '↵'
        case 'Escape':
          return '⎋'
        default:
          return key
      }
    }
    return key
  }

  const renderShortcut = (shortcut: Shortcut) => (
    <div key={shortcut.description} className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <div key={index} className="flex items-center">
            <Badge variant="outline" className="px-2 py-1 text-xs font-mono bg-gray-800 border-gray-600">
              {formatKey(key)}
            </Badge>
            {index < shortcut.keys.length - 1 && (
              <span className="mx-1 text-gray-500">+</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`text-gray-400 hover:text-white ${className}`}
              >
                <Keyboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Atajos</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Atajos de teclado ({isMac ? '⌘' : 'Ctrl'}+?)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DialogContent className="max-w-2xl max-h-[190vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Command className="w-5 h-5" />
            Atajos de Teclado
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {categories.map(category => {
            const categoryShortcuts = shortcuts.filter(s => s.category === category)
            if (categoryShortcuts.length === 0) return null
            
            return (
              <div key={category}>
                <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryShortcuts.map(renderShortcut)}
                </div>
              </div>
            )
          })}
          
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">💡 Consejo</h4>
            <p className="text-sm text-gray-300">
              Presiona <Badge variant="outline" className="mx-1 px-2 py-1 text-xs font-mono bg-gray-700">
                {isMac ? '⌘' : 'Ctrl'}
              </Badge> + 
              <Badge variant="outline" className="mx-1 px-2 py-1 text-xs font-mono bg-gray-700">
                ?
              </Badge> en cualquier momento para ver estos atajos.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Export shortcuts for use in other components
export { shortcuts, type Shortcut }