'use client'

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Maximize2, Minimize2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CodeViewerProps {
  code: string
  language?: string
  filename?: string
}

export function CodeViewer({ code, language = "javascript", filename }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar código:', err)
    }
  }

  const CodeContent = () => (
    <div className="relative">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          {filename && (
            <span className="text-sm font-mono text-muted-foreground">{filename}</span>
          )}
          <span className="text-xs bg-muted px-2 py-1 rounded">{language}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 px-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="ml-1 text-xs">{copied ? 'Copiado' : 'Copiar'}</span>
          </Button>
          {!isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-8 px-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="ml-1 text-xs">Expandir</span>
            </Button>
          )}
        </div>
      </div>
      <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </div>
  )

  return (
    <>
      <Card className="my-4 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
        <CodeContent />
      </Card>
      
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>Código - {filename || 'Sin título'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 px-2"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="ml-1 text-xs">Minimizar</span>
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            <CodeContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Función para detectar bloques de código en texto
export function detectCodeBlocks(text: string): Array<{type: 'text' | 'code', content: string, language?: string, filename?: string}> {
  const blocks: Array<{type: 'text' | 'code', content: string, language?: string, filename?: string}> = []
  const codeBlockRegex = /```(\w+)?(?::(.*?))?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Agregar texto antes del bloque de código
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim()
      if (textContent) {
        blocks.push({ type: 'text', content: textContent })
      }
    }

    // Agregar bloque de código
    const language = match[1] || 'text'
    const filename = match[2] || undefined
    const code = match[3].trim()
    
    if (code) {
      blocks.push({ 
        type: 'code', 
        content: code, 
        language, 
        filename 
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Agregar texto restante
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex).trim()
    if (textContent) {
      blocks.push({ type: 'text', content: textContent })
    }
  }

  // Si no se encontraron bloques de código, devolver todo como texto
  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: text })
  }

  return blocks
}