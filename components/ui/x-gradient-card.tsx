import { cn } from "@/lib/utils"
import { VerifiedIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Maximize2, Minimize2, Clock, Zap, Brain, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export interface XCardProps {
    link: string
    authorName: string
    authorHandle: string
    authorImage: string
    content: string[] | Array<{type: 'text' | 'code', content: string, language?: string, filename?: string}>
    timestamp?: string
    isVerified?: boolean
    className?: string;
    isProgrammerMode?: boolean
    model?: string
    provider?: string
    responseTime?: number // in milliseconds
    tokensUsed?: number
}

function XCard({
    link = "https://x.com/dorian_baffier/status/1880291036410572934",
    authorName = "Dorian",
    authorHandle = "dorian_baffier",
    authorImage = "https://pbs.twimg.com/profile_images/1854916060807675904/KtBJsyWr_400x400.jpg",
    content = [
        "All components from KokonutUI can now be open in @v0 🎉",
        "1. Click on 'Open in V0'",
        "2. Customize with prompts",
        "3. Deploy to your app",
    ],
    isVerified = true,
    timestamp = "Jan 18, 2025",
    className,
    isProgrammerMode = false,
    model,
    provider,
    responseTime,
    tokensUsed
}: XCardProps) {
    const [copiedStates, setCopiedStates] = useState<{[key: number]: boolean}>({})
    const [expandedCode, setExpandedCode] = useState<{content: string, language: string, filename?: string} | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const copyToClipboard = async (code: string, index: number) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopiedStates(prev => ({ ...prev, [index]: true }))
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [index]: false }))
            }, 2000)
        } catch (err) {
            console.error('Error al copiar código:', err)
        }
    }
    return (
        <>
            <div
                onClick={() => setIsDetailModalOpen(true)}
                className={cn(
                    "w-full min-w-[400px] md:min-w-[500px] max-w-xl p-1.5 rounded-2xl relative isolate overflow-hidden cursor-pointer",
                    "bg-white dark:bg-black/90",
                    "border border-black/10 dark:border-white/10",
                    "shadow-[0_8px_16px_rgb(0_0_0_/_0.15)] dark:shadow-[0_8px_16px_rgb(0_0_0_/_0.25)]",
                    "will-change-transform translate-z-0 transition-transform hover:scale-[1.02]",
                    className
                )}
            >
                <div
                    className={cn(
                        "w-full p-5 rounded-xl relative",
                        "bg-white dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-transparent",
                        "border border-black/[0.05] dark:border-white/[0.08]",
                        "text-black/90 dark:text-white",
                        "shadow-sm",
                        "will-change-transform translate-z-0",
                        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-black/[0.02] before:to-black/[0.01] dark:before:from-white/[0.03] dark:before:to-white/[0.01] before:opacity-0 before:transition-opacity before:pointer-events-none",
                        "hover:before:opacity-100"
                    )}
                >
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full overflow-hidden">
                                <img
                                    src={authorImage}
                                    alt={authorName}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-black dark:text-white/90 hover:underline cursor-pointer">
                                            {authorName}
                                        </span>
                                        {isVerified && (
                                            <VerifiedIcon className="h-4 w-4 text-blue-400" />
                                        )}
                                    </div>
                                    <span className="text-black dark:text-white/60 text-sm">
                                        @{authorHandle}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="h-8 w-8 text-black dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-1 flex items-center justify-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="1200"
                                        height="1227"
                                        fill="none"
                                        viewBox="0 0 1200 1227"
                                        className="w-4 h-4"
                                    >
                                        <title>X</title>
                                        <path
                                            fill="currentColor"
                                            d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2">
                        {isProgrammerMode && Array.isArray(content) && content.length > 0 && typeof content[0] === 'object' && 'type' in content[0] ? (
                            // Renderizado para modo programador con bloques de código
                            (content as Array<{type: 'text' | 'code', content: string, language?: string, filename?: string}>).map((block, index) => {
                                if (block.type === 'code') {
                                    return (
                                        <div key={index} className="my-4 overflow-hidden border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                                            <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                    </div>
                                                    {block.filename && (
                                                        <span className="text-sm font-mono text-muted-foreground">{block.filename}</span>
                                                    )}
                                                    <span className="text-xs bg-muted px-2 py-1 rounded">{block.language || 'text'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            copyToClipboard(block.content, index)
                                                        }}
                                                        className="h-8 px-2"
                                                    >
                                                        {copiedStates[index] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        <span className="ml-1 text-xs">{copiedStates[index] ? 'Copiado' : 'Copiar'}</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setExpandedCode({
                                                                content: block.content,
                                                                language: block.language || 'text',
                                                                filename: block.filename
                                                            })
                                                        }}
                                                        className="h-8 px-2"
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                        <span className="ml-1 text-xs">Expandir</span>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto">
                                                <pre className="text-sm font-mono leading-relaxed">
                                                    <code className={`language-${block.language || 'text'}`}>{block.content}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <p
                                            key={index}
                                            className="text-black dark:text-white/90 text-base mb-2"
                                        >
                                            {block.content}
                                        </p>
                                    )
                                }
                            })
                        ) : (
                            // Renderizado normal para texto simple
                            (content as string[]).map((item, index) => (
                                <p
                                    key={index}
                                    className="text-black dark:text-white/90 text-base"
                                >
                                    {item}
                                </p>
                            ))
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-black dark:text-white/50">
                                {timestamp}
                            </span>
                            {model && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    {model}
                                </span>
                            )}
                            {provider && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    provider.toLowerCase().includes('lmstudio') || provider.toLowerCase().includes('lm studio') 
                                        ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                }`}>
                                    {provider}
                                </span>
                            )}
                            {responseTime && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    responseTime <= 2000 
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        : responseTime <= 20000
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                }`}>
                                    {responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`}
                                </span>
                            )}
                            {tokensUsed && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                    {tokensUsed} tokens
                                </span>
                            )}
                        </div>
                    </div>


                </div>
            </div>
            
            {/* Modal para código expandido */}
            <Dialog open={!!expandedCode} onOpenChange={() => setExpandedCode(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center justify-between">
                            <span>Código - {expandedCode?.filename || 'Sin título'}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedCode(null)}
                                className="h-8 px-2"
                            >
                                <Minimize2 className="w-4 h-4" />
                                <span className="ml-1 text-xs">Minimizar</span>
                            </Button>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[calc(90vh-120px)]">
                        {expandedCode && (
                            <div className="relative">
                                <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        {expandedCode.filename && (
                                            <span className="text-sm font-mono text-muted-foreground">{expandedCode.filename}</span>
                                        )}
                                        <span className="text-xs bg-muted px-2 py-1 rounded">{expandedCode.language}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto">
                                    <pre className="text-sm font-mono leading-relaxed">
                                        <code className={`language-${expandedCode.language}`}>{expandedCode.content}</code>
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de detalles */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                                <img
                                    src={authorImage}
                                    alt={authorName}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{authorName}</span>
                                    {isVerified && <VerifiedIcon className="h-4 w-4 text-blue-400" />}
                                </div>
                                <span className="text-sm text-muted-foreground">@{authorHandle}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="overflow-auto max-h-[calc(90vh-200px)] space-y-6">
                        {/* Estadísticas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {timestamp && (
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Fecha</p>
                                        <p className="text-sm font-medium">{timestamp}</p>
                                    </div>
                                </div>
                            )}
                            {responseTime && (
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tiempo</p>
                                        <p className="text-sm font-medium">{responseTime}ms</p>
                                    </div>
                                </div>
                            )}
                            {tokensUsed && (
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Brain className="h-4 w-4 text-purple-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tokens</p>
                                        <p className="text-sm font-medium">{tokensUsed.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                            {(model || provider) && (
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <User className="h-4 w-4 text-green-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Modelo</p>
                                        <p className="text-sm font-medium">{model || provider}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Badges de información */}
                        <div className="flex flex-wrap gap-2">
                            {provider && <Badge variant="secondary">{provider}</Badge>}
                            {model && <Badge variant="outline">{model}</Badge>}
                            {isProgrammerMode && <Badge variant="default">Modo Programador</Badge>}
                        </div>

                        {/* Contenido completo */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Contenido Completo</h3>
                            <div className="p-4 bg-muted/30 rounded-lg">
                                {isProgrammerMode && Array.isArray(content) && content.length > 0 && typeof content[0] === 'object' && 'type' in content[0] ? (
                                    // Renderizado para modo programador
                                    (content as Array<{type: 'text' | 'code', content: string, language?: string, filename?: string}>).map((block, index) => (
                                        <div key={index} className="mb-4 last:mb-0">
                                            {block.type === 'code' ? (
                                                <div className="border rounded-lg overflow-hidden">
                                                    <div className="bg-muted/50 px-3 py-2 border-b flex items-center gap-2">
                                                        <span className="text-xs font-mono">{block.filename || 'código'}</span>
                                                        <Badge variant="outline" className="text-xs">{block.language || 'text'}</Badge>
                                                    </div>
                                                    <pre className="p-3 text-sm overflow-x-auto bg-slate-950 text-slate-100">
                                                        <code>{block.content}</code>
                                                    </pre>
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed">{block.content}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Renderizado para contenido normal
                                    Array.isArray(content) ? (
                                        content.map((line, index) => (
                                            <p key={index} className="text-sm leading-relaxed mb-2 last:mb-0">
                                                {typeof line === 'string' ? line : line.content}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm leading-relaxed">{content}</p>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Enlace original */}
                        {link && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Enlace original:</p>
                                <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-600 text-sm break-all"
                                >
                                    {link}
                                </a>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}


export { XCard }