"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcuts {
  onSend?: () => void
  onClear?: () => void
  onNewConversation?: () => void
  onToggleMode?: () => void
  onFocusInput?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (except for specific cases)
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      
      // Ctrl+Enter or Cmd+Enter - Send message (works in input fields)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        shortcuts.onSend?.()
        return
      }
      
      // Escape - Clear input or close modals
      if (event.key === 'Escape') {
        event.preventDefault()
        shortcuts.onEscape?.()
        return
      }
      
      // Don't process other shortcuts if in input field
      if (isInputField) return
      
      // Ctrl+K or Cmd+K - Clear conversation
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        shortcuts.onClear?.()
        return
      }
      
      // Ctrl+N or Cmd+N - New conversation
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault()
        shortcuts.onNewConversation?.()
        return
      }
      
      // Ctrl+M or Cmd+M - Toggle chat mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault()
        shortcuts.onToggleMode?.()
        return
      }
      
      // Forward slash (/) - Focus input
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        shortcuts.onFocusInput?.()
        return
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    // Helper function to show keyboard shortcuts
    getShortcutsHelp: () => [
      { key: 'Ctrl+Enter', description: 'Enviar mensaje' },
      { key: 'Ctrl+K', description: 'Limpiar conversación' },
      { key: 'Ctrl+N', description: 'Nueva conversación' },
      { key: 'Ctrl+M', description: 'Cambiar modo de chat' },
      { key: '/', description: 'Enfocar entrada de texto' },
      { key: 'Esc', description: 'Cancelar/Cerrar' },
    ]
  }
}