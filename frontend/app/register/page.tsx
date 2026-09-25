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

export default function RegisterPage() {
  const { register } = useAuth()
  const [role, setRole] = useState<"participant" | "organizer">("participant")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)

    try {
      await register({
        username,
        email,
        password,
        confirm_password: confirmPassword,
        role,
      })
    } catch (err: any) {
      setError(err.message || "Registration failed.")
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

        <div className="relative z-10 w-full max-w-md rounded-xl border border-border/40 bg-background/80 p-6 backdrop-blur-md shadow-2xl">
          <div className="space-y-1 mb-5 text-left">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Register Account
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Create a new participant or organizer account
            </p>
          </div>

          {error && (
            <div className="mb-4 text-[11px] text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Minimalist Role Selector */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Select Role
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("participant")}
                  className={`h-8 rounded border px-3 text-xs font-mono transition-colors ${
                    role === "participant"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-semibold"
                      : "border-border/40 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  participant
                </button>
                <button
                  type="button"
                  onClick={() => setRole("organizer")}
                  className={`h-8 rounded border px-3 text-xs font-mono transition-colors ${
                    role === "organizer"
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-400 font-semibold"
                      : "border-border/40 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  organizer
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Note: Judges are appointed by Platform Admins.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alice"
                  className="h-8 text-xs font-mono bg-muted/20 border-border/40"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@hack.local"
                  className="h-8 text-xs font-mono bg-muted/20 border-border/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
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
                  className="h-8 text-xs font-mono bg-muted/20 border-border/40"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-8 text-xs font-mono bg-muted/20 border-border/40"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-8 text-xs font-mono bg-foreground text-background hover:bg-foreground/90 mt-2"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
              {loading ? "Registering..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-[11px] text-muted-foreground/70">
            Have an account?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
