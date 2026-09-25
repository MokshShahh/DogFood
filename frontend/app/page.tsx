"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Squares } from "@/components/reactbits/squares"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono select-none overflow-hidden">
      {/* Minimal Header */}
      <Header />

      {/* Main Viewport: React Bits Interactive Squares Canvas */}
      <div className="relative flex-1 flex items-center justify-center">
        <Squares
          direction="diagonal"
          speed={0.3}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          className="z-0"
        />

        {/* Minimal Central Focus */}
        <div className="relative z-10 text-center px-4 max-w-lg space-y-3 pointer-events-none">
          <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
            Hello
          </p>
          <h1 className="text-xl sm:text-2xl font-light tracking-tight text-foreground/90">
            {user ? (
              <span>Session active as <span className="font-semibold text-foreground">@{user.username}</span></span>
            ) : (
              <span>Offline Hackathon Platform</span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
            {user ? (
              <span>Role: <span className="text-foreground">{user.role}</span>. Access dashboard via header status.</span>
            ) : (
              <span>Only auth</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
