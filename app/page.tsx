"use client"

import { useState, useEffect } from "react"
import { VoiceChat } from "@/components/voice-chat"
import { ApiKeySetup } from "@/components/api-key-setup"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function Home() {
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  
  const {
    apiKey,
    saveApiKey,
    removeApiKey,
    isApiKeyValid
  } = useLocalStorage()

  useEffect(() => {
    // Check if API key exists and is valid
    if (apiKey && isApiKeyValid()) {
      setIsApiKeySet(true)
    } else {
      setIsApiKeySet(false)
      if (apiKey && !isApiKeyValid()) {
        // API key has expired, remove it
        removeApiKey()
      }
    }
  }, [apiKey, isApiKeyValid, removeApiKey])

  const handleApiKeySubmit = (key: string) => {
    saveApiKey(key)
    setIsApiKeySet(true)
  }

  const handleApiKeyReset = () => {
    removeApiKey()
    setIsApiKeySet(false)
  }

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      {!isApiKeySet ? (
        <ApiKeySetup onApiKeySubmit={handleApiKeySubmit} />
      ) : (
        <VoiceChat 
          apiKey={apiKey} 
          onApiKeyReset={handleApiKeyReset} 
          onApiKeySubmit={handleApiKeySubmit}
        />
      )}
    </div>
  )
}
