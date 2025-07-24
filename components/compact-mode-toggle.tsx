"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Maximize2, Minimize2 } from "lucide-react"

interface CompactModeToggleProps {
  onToggle?: (isCompact: boolean) => void
  className?: string
}

export function CompactModeToggle({ onToggle, className }: CompactModeToggleProps) {
  const [isCompact, setIsCompact] = useState(false)

  // Load compact mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-chat-compact-mode')
    if (saved !== null) {
      const compact = JSON.parse(saved)
      setIsCompact(compact)
      applyCompactMode(compact)
    }
  }, [])

  // Apply compact mode styles
  const applyCompactMode = (compact: boolean) => {
    const root = document.documentElement
    
    if (compact) {
      // Compact mode styles
      root.style.setProperty('--chat-message-spacing', '0.5rem')
      root.style.setProperty('--chat-message-padding', '0.75rem')
      root.style.setProperty('--chat-avatar-size', '2rem')
      root.style.setProperty('--chat-font-size', '0.875rem')
      root.style.setProperty('--chat-line-height', '1.4')
      root.style.setProperty('--header-padding', '0.5rem')
      root.style.setProperty('--input-padding', '0.75rem')
      
      // Add compact class to body
      document.body.classList.add('compact-mode')
    } else {
      // Normal mode styles
      root.style.removeProperty('--chat-message-spacing')
      root.style.removeProperty('--chat-message-padding')
      root.style.removeProperty('--chat-avatar-size')
      root.style.removeProperty('--chat-font-size')
      root.style.removeProperty('--chat-line-height')
      root.style.removeProperty('--header-padding')
      root.style.removeProperty('--input-padding')
      
      // Remove compact class from body
      document.body.classList.remove('compact-mode')
    }
  }

  const handleToggle = () => {
    const newCompactState = !isCompact
    setIsCompact(newCompactState)
    
    // Save to localStorage
    localStorage.setItem('ai-chat-compact-mode', JSON.stringify(newCompactState))
    
    // Apply styles
    applyCompactMode(newCompactState)
    
    // Notify parent component
    onToggle?.(newCompactState)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className={`text-gray-400 hover:text-white ${className}`}
          >
            {isCompact ? (
              <Maximize2 className="w-4 h-4 sm:mr-2" />
            ) : (
              <Minimize2 className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {isCompact ? 'Expandir' : 'Compacto'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isCompact ? 'Cambiar a vista normal' : 'Cambiar a vista compacta'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// CSS styles to be added to globals.css
export const compactModeStyles = `
/* Compact Mode Styles */
.compact-mode {
  /* Message containers */
  .conversation-message {
    margin-bottom: var(--chat-message-spacing, 1rem);
    padding: var(--chat-message-padding, 1rem);
  }
  
  /* Avatar sizes */
  .user-avatar,
  .ai-avatar {
    width: var(--chat-avatar-size, 2.5rem);
    height: var(--chat-avatar-size, 2.5rem);
  }
  
  /* Text sizing */
  .message-content {
    font-size: var(--chat-font-size, 1rem);
    line-height: var(--chat-line-height, 1.5);
  }
  
  /* Header padding */
  .chat-header {
    padding: var(--header-padding, 1rem);
  }
  
  /* Input area padding */
  .chat-input-area {
    padding: var(--input-padding, 1rem);
  }
  
  /* Reduce button sizes */
  .compact-button {
    height: 2rem;
    padding: 0 0.75rem;
    font-size: 0.875rem;
  }
  
  /* Reduce spacing in conversation history */
  .conversation-history {
    gap: 0.5rem;
  }
  
  /* Smaller code blocks */
  .code-viewer {
    font-size: 0.8rem;
  }
  
  /* Compact metadata */
  .message-metadata {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  /* Reduce spacing in dialogs */
  .dialog-content {
    padding: 1rem;
  }
  
  /* Smaller voice input */
  .voice-input-container {
    padding: 1rem;
  }
  
  /* Compact settings panels */
  .settings-panel {
    padding: 0.75rem;
  }
  
  /* Reduce margins in cards */
  .animated-card {
    margin: 0.5rem 0;
  }
}

/* Smooth transitions for mode switching */
.conversation-message,
.user-avatar,
.ai-avatar,
.message-content,
.chat-header,
.chat-input-area {
  transition: all 0.2s ease-in-out;
}
`