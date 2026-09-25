"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut } from "lucide-react"

export function Header() {
  const { user, logout } = useAuth()

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            admin
          </span>
        )
      case "judge":
        return (
          <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            judge
          </span>
        )
      case "organizer":
        return (
          <span className="font-mono text-[11px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
            organizer
          </span>
        )
      case "participant":
      default:
        return (
          <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            participant
          </span>
        )
    }
  }

  return (
    <header className="relative z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Minimal Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="font-semibold text-foreground tracking-tight">DOG FOOD</span>

        </Link>

        {/* Right side: Username and Role (when authenticated) or clean Auth links */}
        <div className="flex items-center gap-4 font-mono text-xs">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Visible username and role on the header right */}
              <div className="flex items-center gap-2 border border-border/40 bg-muted/20 px-3 py-1 rounded-full">
                <span className="font-medium text-foreground">@{user.username}</span>
                <span className="text-muted-foreground/40">•</span>
                {getRoleBadge(user.role)}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
              >
                <LogOut className="size-3 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium rounded-md"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
