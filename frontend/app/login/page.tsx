"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Squares } from "@/components/reactbits/squares"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login({ username, password })
    } catch (err: any) {
      setError(err.message || "Invalid credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono overflow-hidden">
      <Header />

      <div className="relative flex-1 flex items-center justify-center p-4">
        <Squares
          direction="diagonal"
          speed={0.2}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.07)"
          className="z-0"
        />

        <div className="relative z-10 w-full max-w-sm rounded-xl border border-border/40 bg-background/80 p-6 backdrop-blur-md shadow-2xl">
          <div className="space-y-1 mb-6 text-left">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Authenticate via secure local JWT session
            </p>
          </div>

          {error && (
            <div className="mb-4 text-[11px] text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Username / Email
              </Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alice"
                className="h-8 text-xs font-mono bg-muted/20 border-border/40 focus-visible:ring-1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-xs font-mono bg-muted/20 border-border/40 focus-visible:ring-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-8 text-xs font-mono bg-foreground text-background hover:bg-foreground/90 mt-2"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              {loading ? "Authenticating..." : "Continue"}
            </Button>
          </form>

          <div className="mt-5 text-center text-[11px] text-muted-foreground/70">
            No account?{" "}
            <Link href="/register" className="text-foreground hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
