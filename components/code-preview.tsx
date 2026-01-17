
import { useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, Smartphone, Monitor, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CodePreviewProps {
  html: string
  css: string
  js: string
  autoRefresh?: boolean
}

export function CodePreview({ html, css, js, autoRefresh = true }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [key, setKey] = useState(0) // Force re-render
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [isLoading, setIsLoading] = useState(false)

  const generateSrcDoc = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            ${css}
          </style>
        </head>
        <body>
          ${html}
          <script>
            try {
              ${js}
            } catch (err) {
              console.error(err);
              document.body.innerHTML += '<div style="color:red; padding:10px; background:#fee; border:1px solid red; margin-top:20px;">Runtime Error: ' + err.message + '</div>';
            }
          </script>
        </body>
      </html>
    `
  }

  useEffect(() => {
    if (autoRefresh) {
      updatePreview()
    }
  }, [html, css, js, autoRefresh])

  const updatePreview = () => {
    setIsLoading(true)
    // Small delay to show loading state and prevent flickering on rapid typing
    setTimeout(() => {
        if (iframeRef.current) {
            iframeRef.current.srcdoc = generateSrcDoc()
        }
        setIsLoading(false)
    }, 300)
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-1">
            <Button
                variant={device === 'desktop' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setDevice('desktop')}
                title="Desktop View"
            >
                <Monitor className="h-3 w-3" />
            </Button>
            <Button
                variant={device === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setDevice('mobile')}
                title="Mobile View"
            >
                <Smartphone className="h-3 w-3" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={updatePreview}
                title="Refresh"
            >
                <RefreshCw className="h-3 w-3" />
            </Button>
        </div>
      </div>
      
      <div className={`flex-1 relative bg-white dark:bg-zinc-950 transition-all duration-300 ${device === 'mobile' ? 'p-8 flex justify-center bg-gray-100 dark:bg-gray-900' : ''}`}>
        <div className={`${device === 'mobile' ? 'w-[375px] h-[667px] border-8 border-gray-800 rounded-[30px] overflow-hidden shadow-xl bg-white' : 'w-full h-full'}`}>
            <iframe
                ref={iframeRef}
                title="Code Preview"
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-modals allow-same-origin"
            />
        </div>
      </div>
    </div>
  )
}
