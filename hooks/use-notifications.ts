"use client"

import { useEffect, useCallback, useState } from "react"

interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  silent?: boolean
  tag?: string
  playSound?: boolean
  soundType?: 'message' | 'success' | 'error' | 'warning'
}

interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  browserNotifications: boolean
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    browserNotifications: true
  })

  // Initialize notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return Notification.permission
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback((soundType: 'message' | 'success' | 'error' | 'warning' = 'message') => {
    if (!settings.soundEnabled) return

    try {
      // Create audio context for better browser support
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Different frequencies for different notification types
      const frequencies = {
        message: [800, 600], // Pleasant two-tone
        success: [523, 659, 784], // C-E-G chord
        error: [400, 300], // Lower, more urgent
        warning: [600, 500, 600] // Three-tone warning
      }

      const freqs = frequencies[soundType]
      let delay = 0

      freqs.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        }, delay)
        
        delay += soundType === 'success' ? 100 : 150
      })
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }, [settings.soundEnabled])

  // Show notification
  const showNotification = useCallback(async (options: NotificationOptions) => {
    if (!settings.enabled) return

    // Play sound if requested
    if (options.playSound !== false) {
      playNotificationSound(options.soundType)
    }

    // Show browser notification if enabled and permission granted
    if (settings.browserNotifications && 'Notification' in window) {
      if (permission === 'granted') {
        try {
          const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/placeholder-logo.svg',
            silent: options.silent || false,
            tag: options.tag,
            requireInteraction: false
          })

          // Auto-close after 4 seconds
          setTimeout(() => {
            notification.close()
          }, 4000)

          return notification
        } catch (error) {
          console.warn('Could not show browser notification:', error)
        }
      } else if (permission === 'default') {
        // Try to request permission
        const newPermission = await requestPermission()
        if (newPermission === 'granted') {
          return showNotification(options) // Retry
        }
      }
    }
  }, [settings, permission, playNotificationSound, requestPermission])

  // Predefined notification types
  const notifyNewMessage = useCallback((senderName?: string) => {
    showNotification({
      title: 'Nuevo mensaje',
      body: senderName ? `Mensaje de ${senderName}` : 'Has recibido un nuevo mensaje',
      soundType: 'message',
      tag: 'new-message'
    })
  }, [showNotification])

  const notifyAutoSave = useCallback(() => {
    showNotification({
      title: 'Conversación guardada',
      body: 'Tu conversación se ha guardado automáticamente',
      soundType: 'success',
      silent: true,
      tag: 'auto-save'
    })
  }, [showNotification])

  const notifyError = useCallback((message: string) => {
    showNotification({
      title: 'Error',
      body: message,
      soundType: 'error',
      tag: 'error'
    })
  }, [showNotification])

  const notifySuccess = useCallback((message: string) => {
    showNotification({
      title: 'Éxito',
      body: message,
      soundType: 'success',
      tag: 'success'
    })
  }, [showNotification])

  const notifyWarning = useCallback((message: string) => {
    showNotification({
      title: 'Advertencia',
      body: message,
      soundType: 'warning',
      tag: 'warning'
    })
  }, [showNotification])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Get current status
  const getStatus = useCallback(() => {
    return {
      permission,
      settings,
      isSupported: 'Notification' in window,
      canShowNotifications: permission === 'granted' && settings.browserNotifications
    }
  }, [permission, settings])

  return {
    // Core functions
    showNotification,
    requestPermission,
    playNotificationSound,
    
    // Predefined notifications
    notifyNewMessage,
    notifyAutoSave,
    notifyError,
    notifySuccess,
    notifyWarning,
    
    // Settings and status
    settings,
    updateSettings,
    getStatus,
    permission
  }
}