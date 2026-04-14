import React, { useState, useEffect, useRef } from "react"
import { File, FileCode, FileJson, FileText, Image as ImageIcon, Folder, ChevronRight, ChevronDown, Plus, Play, Maximize2, Monitor, Smartphone, RefreshCw, Loader2, Download, Settings, Trash2, CheckCircle2, AlertCircle, Circle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ProjectFile {
  name: string
  content: string
  type: string
  status: 'saved' | 'modified' | 'error'
}

interface ProjectStep {
  id: string
  name: string
  files: ProjectFile[]
  timestamp: Date
}

interface BuilderPanelProps {
  files: ProjectFile[]
  onUpdateFile: (name: string, content: string) => void
  onCreateFile: (name: string) => void
  onDeleteFile: (name: string) => void
  isGenerating: boolean
  projectSteps?: ProjectStep[]
  onRestoreStep?: (stepId: string) => void
}

export function BuilderPanel({ files, onUpdateFile, onCreateFile, onDeleteFile, isGenerating, projectSteps = [], onRestoreStep }: BuilderPanelProps) {
  const [activeFile, setActiveFile] = useState<string | null>(files[0]?.name || null)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (files.length > 0 && !activeFile) {
      setActiveFile(files[0].name)
    }
  }, [files, activeFile])

  const getFileIcon = (name: string) => {
    if (name.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-500" />
    if (name.endsWith('.css')) return <FileCode className="w-4 h-4 text-blue-500" />
    if (name.endsWith('.js') || name.endsWith('.ts')) return <FileCode className="w-4 h-4 text-yellow-500" />
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-green-500" />
    if (name.match(/\.(png|jpg|jpeg|gif|svg)$/i)) return <ImageIcon className="w-4 h-4 text-purple-500" />
    return <FileText className="w-4 h-4 text-muted-foreground" />
  }

  const generateSrcDoc = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'))?.content || '<h1>App</h1>'
    const cssFiles = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n')
    const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts')).map(f => f.content).join('\n')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            ${cssFiles}
          </style>
        </head>
        <body>
          ${htmlFile}
          <script>
            try {
              ${jsFiles}
            } catch (err) {
              console.error(err);
              document.body.innerHTML += '<div style="color:red; padding:10px; background:#fee; border:1px solid red; margin-top:20px;">Runtime Error: ' + err.message + '</div>';
            }
          </script>
        </body>
      </html>
    `
  }

  const updatePreview = () => {
    setIsLoading(true)
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = generateSrcDoc()
      }
      setIsLoading(false)
    }, 300)
  }

  useEffect(() => {
    updatePreview()
  }, [files])

  const openInNewTab = () => {
    const blob = new Blob([generateSrcDoc()], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card rounded-lg border shadow-sm relative">
        <div className="text-center text-muted-foreground">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-2 faster-one-regular">Local AI</h3>
          <p className="text-sm max-w-sm mx-auto mb-4">
            Tu primera preview
          </p>
        </div>
        <Button 
          className="absolute bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all"
          onClick={() => onCreateFile('index.html')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    )
  }

  const activeFileContent = files.find(f => f.name === activeFile)

  return (
    <div className="flex-1 h-full bg-background rounded-lg border shadow-sm overflow-hidden flex">
      {/* Sidebar */}
      <div className={`border-r bg-card transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="h-12 flex items-center justify-between px-4 border-b">
          <span className="font-medium text-sm">Archivos</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCreateFile('nuevo.txt')}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {files.map(file => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                className={`w-full group flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                  activeFile === file.name ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(file.name)}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {file.status === 'modified' && <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />}
                  {file.status === 'error' && <AlertCircle className="w-3 h-3 text-destructive" />}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center">
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" onClick={(e) => { e.stopPropagation(); onDeleteFile(file.name); }} />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {projectSteps.length > 0 && (
            <div className="mt-4 border-t pt-2">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Historial de Pasos
              </div>
              <div className="p-2 space-y-1">
                {projectSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => onRestoreStep && onRestoreStep(step.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors hover:bg-muted/50 text-left"
                    title={`Restaurar a ${step.name}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate text-muted-foreground hover:text-foreground">{step.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Editor & Preview Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-2 bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Folder className="w-4 h-4" />
            </Button>
            {activeFile && (
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md text-sm">
                {getFileIcon(activeFile)}
                <span className="font-medium">{activeFile}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-muted/50 rounded-md p-0.5">
              <Button variant={device === 'desktop' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-sm" onClick={() => setDevice('desktop')}>
                <Monitor className="w-4 h-4" />
              </Button>
              <Button variant={device === 'mobile' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-sm" onClick={() => setDevice('mobile')}>
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            <div className="w-px h-4 bg-border mx-2" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={updatePreview}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openInNewTab} title="Abrir en nueva pestaña">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Split */}
        <div className="flex-1 flex min-h-0">
          {/* Code Editor */}
          <div className="w-1/2 border-r flex flex-col">
            <textarea
              value={activeFileContent?.content || ''}
              onChange={(e) => onUpdateFile(activeFile!, e.target.value)}
              className="flex-1 w-full resize-none bg-zinc-950 text-zinc-50 p-4 font-mono text-sm outline-none"
              spellCheck={false}
              disabled={!activeFile}
              placeholder={activeFile ? "Escribe tu código aquí..." : "Selecciona un archivo"}
            />
          </div>
          
          {/* Preview */}
          <div className={`w-1/2 relative bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden transition-all ${device === 'mobile' ? 'p-8' : 'p-0'}`}>
            <div className={`transition-all duration-300 ${device === 'mobile' ? 'w-[375px] h-[812px] border-[12px] border-zinc-800 rounded-[2.5rem] shadow-2xl bg-white overflow-hidden relative' : 'w-full h-full bg-white'}`}>
              {device === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-3xl w-40 mx-auto z-10"></div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-modals allow-same-origin"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-20">
                  <div className="bg-background/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm font-medium">Generando...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
