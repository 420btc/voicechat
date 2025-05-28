"use client"

import { useEffect, useRef } from "react"
import { Play } from "lucide-react"

interface AudioVisualizerProps {
  isRecording: boolean
  audioLevel: number
  isPlaying: boolean
}

export function AudioVisualizer({ isRecording, audioLevel, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = 20
      const barWidth = 3
      const barSpacing = 4
      const maxHeight = 40

      ctx.fillStyle = "white"

      for (let i = 0; i < barCount; i++) {
        let height = 4 // minimum height

        if (isRecording) {
          // Simulate audio levels with some randomness
          height = Math.max(4, audioLevel * maxHeight + Math.random() * 10)
        } else if (isPlaying) {
          // Animate bars when playing AI response
          height = Math.max(4, Math.sin(Date.now() * 0.01 + i) * 15 + 15)
        }

        const x = i * (barWidth + barSpacing)
        const y = (maxHeight - height) / 2

        ctx.fillRect(x, y, barWidth, height)
      }

      if (isRecording || isPlaying) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    if (isRecording || isPlaying) {
      draw()
    } else {
      // Draw static bars
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)"

      const maxHeight = 40 // Declare maxHeight here

      for (let i = 0; i < 20; i++) {
        const x = i * 7
        const height = 4
        const y = (maxHeight - height) / 2
        ctx.fillRect(x, y, 3, height)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, audioLevel, isPlaying])

  return (
    <div className="flex items-center gap-4">
      {isPlaying && (
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <Play className="w-4 h-4 text-black ml-0.5" />
        </div>
      )}

      <canvas ref={canvasRef} width={140} height={40} className="rounded" />

      {(isRecording || isPlaying) && (
        <div className="text-white text-sm font-mono">
          {isRecording ? "●" : "♪"} {Math.floor(Math.random() * 60)}s
        </div>
      )}
    </div>
  )
}
