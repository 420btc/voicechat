"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, Calendar, User, Bot, X } from "lucide-react"
import { SavedConversation } from "@/components/conversation-manager"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  audio?: Blob
  model?: string
  provider?: string
  responseTime?: number
  tokensUsed?: number
  promptTokens?: number
  images?: File[]
}

interface SearchResult {
  conversation: SavedConversation
  messageIndex: number
  message: Message
  snippet: string
  relevanceScore: number
}

interface ConversationSearchProps {
  savedConversations: SavedConversation[]
  onLoadConversation: (conversation: SavedConversation) => void
  className?: string
}

export function ConversationSearch({ savedConversations, onLoadConversation, className }: ConversationSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search function
  const performSearch = useMemo(() => {
    return (query: string): SearchResult[] => {
      if (!query.trim()) return []
      
      const results: SearchResult[] = []
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)
      
      savedConversations.forEach(conversation => {
        conversation.messages.forEach((message, messageIndex) => {
          const content = message.content.toLowerCase()
          const title = conversation.title.toLowerCase()
          
          // Calculate relevance score
          let relevanceScore = 0
          let matchedTerms = 0
          
          searchTerms.forEach(term => {
            // Title matches are worth more
            if (title.includes(term)) {
              relevanceScore += 10
              matchedTerms++
            }
            
            // Content matches
            if (content.includes(term)) {
              relevanceScore += 5
              matchedTerms++
            }
            
            // Exact phrase bonus
            if (content.includes(query.toLowerCase())) {
              relevanceScore += 15
            }
          })
          
          // Only include if at least one term matches
          if (matchedTerms > 0) {
            // Create snippet with highlighted terms
            const snippet = createSnippet(message.content, searchTerms)
            
            results.push({
              conversation,
              messageIndex,
              message,
              snippet,
              relevanceScore
            })
          }
        })
      })
      
      // Sort by relevance score (descending) and then by date (newest first)
      return results.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        return new Date(b.conversation.updatedAt).getTime() - new Date(a.conversation.updatedAt).getTime()
      }).slice(0, 50) // Limit to 50 results
    }
  }, [savedConversations])

  // Create snippet with context
  const createSnippet = (content: string, searchTerms: string[]): string => {
    const maxLength = 150
    const contextLength = 50
    
    // Find the first occurrence of any search term
    let firstMatchIndex = -1
    let matchedTerm = ''
    
    for (const term of searchTerms) {
      const index = content.toLowerCase().indexOf(term)
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index
        matchedTerm = term
      }
    }
    
    if (firstMatchIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }
    
    // Calculate start and end positions for snippet
    const start = Math.max(0, firstMatchIndex - contextLength)
    const end = Math.min(content.length, firstMatchIndex + matchedTerm.length + contextLength)
    
    let snippet = content.substring(start, end)
    
    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    return snippet
  }

  // Perform search when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      const results = performSearch(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  const handleLoadConversation = (result: SearchResult) => {
    onLoadConversation(result.conversation)
    setIsOpen(false)
    setSearchQuery("")
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const highlightText = (text: string, searchTerms: string[]) => {
    if (!searchTerms.length) return text
    
    let highlightedText = text
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    })
    
    return highlightedText
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={`text-gray-400 hover:text-white ${className}`}>
          <Search className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Buscar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar en Conversaciones
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en mensajes, títulos de conversaciones..."
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Search Results */}
          <ScrollArea className="h-[400px] w-full">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Buscando...</div>
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No se encontraron resultados</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div
                    key={`${result.conversation.id}-${result.messageIndex}-${index}`}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLoadConversation(result)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Conversation Title */}
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <h3 className="font-medium text-sm truncate">
                            {result.conversation.title}
                          </h3>
                        </div>
                        
                        {/* Message Preview */}
                        <div className="flex items-start gap-2 mb-2">
                          {result.message.role === 'user' ? (
                            <User className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                          ) : (
                            <Bot className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                          )}
                          <p 
                            className="text-sm text-muted-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: highlightText(result.snippet, searchQuery.toLowerCase().split(' '))
                            }}
                          />
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(result.conversation.updatedAt)}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {result.conversation.messages.length} mensajes
                          </Badge>
                          {result.message.model && (
                            <Badge variant="outline" className="text-xs">
                              {result.message.model}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Relevance Score (for debugging) */}
                      {process.env.NODE_ENV === 'development' && (
                        <Badge variant="outline" className="text-xs">
                          {result.relevanceScore}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Escribe para buscar en tus conversaciones</p>
                  <p className="text-xs mt-1">Busca por contenido, títulos o palabras clave</p>
                </div>
              </div>
            )}
          </ScrollArea>
          
          {/* Search Stats */}
          {searchQuery && searchResults.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              {searchResults.length === 50 && ' (mostrando los primeros 50)'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}