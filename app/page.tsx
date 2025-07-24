"use client"

import { useState, useEffect } from "react"
import { VoiceChat } from "@/components/voice-chat"
import { ApiKeySetup } from "@/components/api-key-setup"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function Home() {
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  
  const {
    apiKey,
    saveApiKey,
    removeApiKey,
    isApiKeyValid
  } = useLocalStorage()

  useEffect(() => {
    // Clean up expired API keys but don't force setup
    if (apiKey && !isApiKeyValid()) {
      removeApiKey()
    }
  }, [apiKey, isApiKeyValid, removeApiKey])

  const handleApiKeySubmit = (key: string) => {
    saveApiKey(key)
    setShowApiKeySetup(false)
  }

  const handleApiKeyReset = () => {
    removeApiKey()
    setShowApiKeySetup(true)
  }

  const handleShowApiKeySetup = () => {
    setShowApiKeySetup(true)
  }

  const handleCloseApiKeySetup = () => {
    setShowApiKeySetup(false)
  }

  return (
    <div className="h-screen text-foreground overflow-hidden">
      {showApiKeySetup ? (
        <ApiKeySetup 
          onApiKeySubmit={handleApiKeySubmit} 
          onClose={handleCloseApiKeySetup}
        />
      ) : (
        <VoiceChat 
          apiKey={apiKey || ""} 
          onApiKeyReset={handleApiKeyReset} 
          onApiKeySubmit={handleApiKeySubmit}
          onShowApiKeySetup={handleShowApiKeySetup}
        />
      )}
    </div>
  )
}
