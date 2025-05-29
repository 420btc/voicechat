'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { useUserData } from '@/hooks/use-user-data'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <AccentColorProvider>{children}</AccentColorProvider>
    </NextThemesProvider>
  )
}

function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const { userData, isLoaded } = useUserData()
  const [currentAccent, setCurrentAccent] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!isLoaded) return

    const body = document.body
    const accentColor = userData.themeSettings.accentColor
    
    // Only update if the accent color has actually changed
    if (currentAccent !== accentColor) {
      // Use requestAnimationFrame for smooth transition
      requestAnimationFrame(() => {
        // Remove all existing accent classes
        body.classList.remove(
          'accent-blue', 'accent-green', 'accent-purple', 
          'accent-orange', 'accent-red', 'accent-pink'
        )
        
        // Add the current accent color class
        body.classList.add(`accent-${accentColor}`)
        
        setCurrentAccent(accentColor)
      })
    }
  }, [userData.themeSettings.accentColor, isLoaded, currentAccent])

  return <>{children}</>
}
