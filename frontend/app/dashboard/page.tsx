"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Squares } from "@/components/reactbits/squares"
import { api, User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [usersList, setUsersList] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const fetchUsers = async () => {
    if (user?.role === "admin") {
      setLoadingUsers(true)
      try {
        const data = await api.listUsers()
        setUsersList(data)
      } catch (err: any) {
        setActionError(err.message || "Failed to load user directory")
      } finally {
        setLoadingUsers(false)
      }
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers()
    }
  }, [user])

  const handleAppointJudge = async (userId: number, username: string) => {
    setActionError(null)
    setActionSuccess(null)
    try {
      await api.appointJudge(userId)
      setActionSuccess(`@${username} appointed as Judge`)
      fetchUsers()
    } catch (err: any) {
      setActionError(err.message || "Action failed")
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-mono text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" />
        authenticating...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono overflow-hidden">
      {/* Header displays user and role on the right */}
      <Header />

      <div className="relative flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        <Squares
          direction="diagonal"
          speed={0.2}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(255, 255, 255, 0.06)"
          className="z-0"
        />

        <div className="relative z-10 space-y-6">
          {/* Active Session Overview */}
          <div className="rounded-xl border border-border/40 bg-background/80 p-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Active Session
                </p>
                <h1 className="text-base font-semibold text-foreground">
                  @{user.username}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">role:</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-border/60 bg-muted/30 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Admin User Management for Appointing Judges */}
          {user.role === "admin" && (
            <div className="rounded-xl border border-border/40 bg-background/80 p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    Admin / Appoint Judges
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Promote participants or organizers to Judge status
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="h-7 text-xs font-mono"
                >
                  {loadingUsers ? "refreshing..." : "refresh"}
                </Button>
              </div>

              {actionSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                  <CheckCircle2 className="size-3.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {actionError && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
                  <AlertCircle className="size-3.5" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] text-muted-foreground uppercase">
                      <th className="py-2 px-3 font-normal">Username</th>
                      <th className="py-2 px-3 font-normal">Role</th>
                      <th className="py-2 px-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 font-medium">@{u.username}</td>
                        <td className="py-2.5 px-3 text-muted-foreground capitalize">{u.role}</td>
                        <td className="py-2.5 px-3 text-right">
                          {u.role !== "judge" && u.role !== "admin" ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleAppointJudge(u.id, u.username)}
                              className="h-6 text-[11px] font-mono hover:border-amber-500 hover:text-amber-400"
                            >
                              appoint as judge
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
