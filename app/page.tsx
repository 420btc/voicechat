"use client"

import { VoiceChat } from "@/components/voice-chat"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function Home() {
  const {
    apiKey
  } = useLocalStorage()

  return (
    <div className="h-screen text-foreground overflow-hidden">
      <VoiceChat 
        apiKey={apiKey || ""} 
        onApiKeyReset={() => {}} 
        onApiKeySubmit={() => {}}
        onShowApiKeySetup={() => {}}
      />
    </div>
  )
}
