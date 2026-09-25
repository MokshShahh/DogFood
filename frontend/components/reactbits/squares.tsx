"use client"

import React, { useRef, useEffect } from "react"

interface SquaresProps {
  direction?: "right" | "left" | "up" | "down" | "diagonal"
  speed?: number
  borderColor?: string
  squareSize?: number
  hoverFillColor?: string
  className?: string
}

export function Squares({
  direction = "right",
  speed = 0.5,
  borderColor = "#222226",
  squareSize = 40,
  hoverFillColor = "#222228",
  className = "",
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const requestRef = useRef<number | null>(null)
  const numSquaresX = useRef<number>(0)
  const numSquaresY = useRef<number>(0)
  const gridOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const hoveredSquare = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      numSquaresX.current = Math.ceil(canvas.width / squareSize) + 1
      numSquaresY.current = Math.ceil(canvas.height / squareSize) + 1
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize)
          const squareY = y - (gridOffset.current.y % squareSize)

          if (
            hoveredSquare.current &&
            Math.floor((hoveredSquare.current.x - squareX) / squareSize) === 0 &&
            Math.floor((hoveredSquare.current.y - squareY) / squareSize) === 0
          ) {
            ctx.fillStyle = hoverFillColor
            ctx.fillRect(squareX, squareY, squareSize, squareSize)
          }

          ctx.strokeStyle = borderColor
          ctx.strokeRect(squareX, squareY, squareSize, squareSize)
        }
      }

      const effectiveSpeed = Math.max(speed, 0.1)
      switch (direction) {
        case "right":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          break
        case "left":
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + squareSize) % squareSize
          break
        case "up":
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + squareSize) % squareSize
          break
        case "down":
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
        case "diagonal":
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + squareSize) % squareSize
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize
          break
      }

      requestRef.current = requestAnimationFrame(draw)
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize

      const hoveredX = Math.floor((mouseX + (gridOffset.current.x % squareSize)) / squareSize) * squareSize - startX
      const hoveredY = Math.floor((mouseY + (gridOffset.current.y % squareSize)) / squareSize) * squareSize - startY

      hoveredSquare.current = { x: hoveredX, y: hoveredY }
    }

    const handleMouseLeave = () => {
      hoveredSquare.current = null
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)
    requestRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseleave", handleMouseLeave)
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [direction, speed, borderColor, hoverFillColor, squareSize])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto absolute inset-0 h-full w-full ${className}`}
    />
  )
}
