"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Shield, X } from "lucide-react"

interface ApiKeySetupProps {
  onApiKeySubmit: (apiKey: string) => void
  onClose?: () => void
  existingApiKey?: string
}

export function ApiKeySetup({ onApiKeySubmit, onClose, existingApiKey }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (existingApiKey) {
      setApiKey(existingApiKey)
    }
  }, [existingApiKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setIsLoading(true)
    // Simulate API key validation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onApiKeySubmit(apiKey.trim())
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-black" />
          </div>
          <CardTitle className="text-white text-2xl">Configurar Clave API de OpenAI</CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa tu clave API de OpenAI para habilitar la funcionalidad de chat por voz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-white"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? "Validando..." : "Continuar"}
            </Button>
          </form>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Tu clave API se almacena de forma segura en tu navegador</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
