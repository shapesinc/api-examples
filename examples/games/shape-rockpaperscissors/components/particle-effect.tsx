"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

type ParticleEffectProps = {
  type: "win" | "lose" | "draw"
  active: boolean
  className?: string
}

export function ParticleEffect({ type, active, className }: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)

  interface Particle {
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    color: string
    alpha: number
    rotation: number
    rotationSpeed: number
  }

  useEffect(() => {
    if (!canvasRef.current || !active) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create particles
    const createParticles = () => {
      particlesRef.current = []
      const particleCount = 100

      for (let i = 0; i < particleCount; i++) {
        const colors = {
          win: ["#10B981", "#34D399", "#6EE7B7"],
          lose: ["#EF4444", "#F87171", "#FCA5A5"],
          draw: ["#F59E0B", "#FBBF24", "#FCD34D"],
        }

        const color = colors[type][Math.floor(Math.random() * colors[type].length)]

        particlesRef.current.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          size: Math.random() * 8 + 2,
          speedX: Math.random() * 6 - 3,
          speedY: Math.random() * 6 - 3,
          color,
          alpha: 1,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        })
      }
    }

    createParticles()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        // Update particle position
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Apply gravity for falling effect
        particle.speedY += 0.05

        // Fade out
        particle.alpha -= 0.005

        // Rotate
        particle.rotation += particle.rotationSpeed

        // Remove particles that are no longer visible
        if (particle.alpha <= 0) {
          particlesRef.current.splice(index, 1)
        }

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.alpha
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)

        if (type === "win") {
          // Star shape for win
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((i * 4 * Math.PI) / 5) * particle.size, Math.sin((i * 4 * Math.PI) / 5) * particle.size)
            ctx.lineTo(
              Math.cos(((i * 4 + 2) * Math.PI) / 5) * (particle.size / 2),
              Math.sin(((i * 4 + 2) * Math.PI) / 5) * (particle.size / 2),
            )
          }
          ctx.closePath()
          ctx.fillStyle = particle.color
          ctx.fill()
        } else if (type === "lose") {
          // X shape for lose
          ctx.lineWidth = particle.size / 3
          ctx.strokeStyle = particle.color
          ctx.beginPath()
          ctx.moveTo(-particle.size / 2, -particle.size / 2)
          ctx.lineTo(particle.size / 2, particle.size / 2)
          ctx.moveTo(particle.size / 2, -particle.size / 2)
          ctx.lineTo(-particle.size / 2, particle.size / 2)
          ctx.stroke()
        } else {
          // Circle for draw
          ctx.beginPath()
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = particle.color
          ctx.fill()
        }

        ctx.restore()
      })

      // Continue animation if there are particles left
      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [active, type])

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 w-full h-full pointer-events-none z-10", !active && "hidden", className)}
    />
  )
}
