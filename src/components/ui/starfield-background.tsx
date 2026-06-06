"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface StarfieldBackgroundProps {
  className?: string
  children?: React.ReactNode
  count?: number
  speed?: number
  starColor?: string
  twinkle?: boolean
  speedRef?: React.MutableRefObject<number>
}

interface Star {
  x: number
  y: number
  z: number
  twinkleSpeed: number
  twinkleOffset: number
}

export function StarfieldBackground({
  className,
  children,
  count = 400,
  speed = 0.5,
  starColor = "#ffffff",
  twinkle = true,
  speedRef,
}: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    let width = rect.width
    let height = rect.height
    canvas.width = width
    canvas.height = height

    let animationId: number
    let tick = 0
    const maxDepth = 1500

    const createStar = (initialZ?: number): Star => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: initialZ ?? Math.random() * maxDepth,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    })

    const stars: Star[] = Array.from({ length: count }, () => createStar())

    const handleResize = () => {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width
      canvas.height = height
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    const animate = () => {
      tick++
      const currentSpeed = speedRef ? speedRef.current : speed

      ctx.fillStyle = "rgba(10, 10, 15, 0.2)"
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      for (const star of stars) {
        star.z -= currentSpeed * 2
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2
          star.y = (Math.random() - 0.5) * height * 2
          star.z = maxDepth
        }

        const scale = 400 / star.z
        const x = cx + star.x * scale
        const y = cy + star.y * scale

        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue

        const size = Math.max(0.5, (1 - star.z / maxDepth) * 3)
        let opacity = (1 - star.z / maxDepth) * 0.9 + 0.1

        if (twinkle && star.twinkleSpeed > 0.015) {
          opacity *= 0.7 + 0.3 * Math.sin(tick * star.twinkleSpeed + star.twinkleOffset)
        }

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = starColor
        ctx.globalAlpha = opacity
        ctx.fill()

        if (star.z < maxDepth * 0.3 && currentSpeed > 0.3) {
          const streakLength = (1 - star.z / maxDepth) * currentSpeed * 8
          const angle = Math.atan2(star.y, star.x)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - Math.cos(angle) * streakLength, y - Math.sin(angle) * streakLength)
          ctx.strokeStyle = starColor
          ctx.globalAlpha = opacity * 0.3
          ctx.lineWidth = size * 0.5
          ctx.stroke()
        }
      }

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    ctx.fillStyle = "#0a0a0f"
    ctx.fillRect(0, 0, width, height)
    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      ro.disconnect()
    }
  }, [count, speed, starColor, twinkle, speedRef])

  return (
    <div ref={containerRef} className={cn("fixed inset-0 overflow-hidden bg-[#0a0a0f]", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(56, 100, 180, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(100, 60, 150, 0.1) 0%, transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(5,5,10,0.9) 100%)",
        }}
      />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}
