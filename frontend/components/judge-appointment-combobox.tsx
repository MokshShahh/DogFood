"use client"

import React, { useState, useEffect, useRef } from "react"
import { api, User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, UserPlus, X, Check, Loader2, Shield, AlertCircle } from "lucide-react"

interface JudgeAppointmentComboboxProps {
  eventId: number
  currentJudges?: { id: number; username: string; email?: string }[]
  onJudgeAdded?: (judge: any) => void
  onJudgeRemoved?: (judgeId: number) => void
  disabled?: boolean
}

export function JudgeAppointmentCombobox({
  eventId,
  currentJudges = [],
  onJudgeAdded,
  onJudgeRemoved,
  disabled = false,
}: JudgeAppointmentComboboxProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [candidates, setCandidates] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search when query changes
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(async () => {
      setIsLoading(true)
      setStatusMsg(null)
      try {
        const users = await api.listAppointableJudges(query)
        setCandidates(users)
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Failed to search users" })
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, isOpen])

  const handleAppoint = async (targetUser: User) => {
    if (disabled || isSubmitting) return
    setIsSubmitting(targetUser.id)
    setStatusMsg(null)

    try {
      const res = await api.addEventJudge(eventId, targetUser.id)
      setStatusMsg({ type: "success", text: `@${targetUser.username} appointed as judge!` })
      if (onJudgeAdded) {
        onJudgeAdded(res.judge || { id: targetUser.id, username: targetUser.username, email: targetUser.email })
      }
      setIsOpen(false)
      setQuery("")
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to appoint judge" })
    } finally {
      setIsSubmitting(null)
    }
  }

  const handleRemove = async (judgeId: number, username: string) => {
    if (disabled || removingId) return
    setRemovingId(judgeId)
    setStatusMsg(null)

    try {
      await api.removeEventJudge(eventId, judgeId)
      setStatusMsg({ type: "success", text: `@${username} removed from judges.` })
      if (onJudgeRemoved) {
        onJudgeRemoved(judgeId)
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to remove judge" })
    } finally {
      setRemovingId(null)
    }
  }

  const assignedIds = new Set(currentJudges.map((j) => j.id))

  return (
    <div className="space-y-3 font-mono text-xs" ref={dropdownRef}>
      {/* Current Appointed Judges List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1.5 font-semibold">
            <Shield className="size-3.5 text-amber-400" />
            Appointed Judges ({currentJudges.length})
          </span>
        </div>

        {currentJudges.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic py-1">
            No judges appointed for this contest yet. Search below to assign one.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {currentJudges.map((judge) => (
              <span
                key={judge.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs font-mono"
              >
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="font-medium">@{judge.username}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(judge.id, judge.username)}
                    disabled={removingId === judge.id}
                    className="ml-1 text-amber-400/60 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove Judge"
                  >
                    {removingId === judge.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <X className="size-3" />
                    )}
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filterable Dropdown Input */}
      {!disabled && (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search user by @username or email to appoint..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (!isOpen) setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-8 pr-8 h-8 text-xs font-mono bg-background/90 border-border/50 focus-visible:ring-1 focus-visible:ring-amber-500/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setCandidates([])
                }}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Feedback message */}
          {statusMsg && (
            <div
              className={`mt-1.5 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border ${
                statusMsg.type === "success"
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-rose-400 bg-rose-500/10 border-rose-500/20"
              }`}
            >
              {statusMsg.type === "success" ? (
                <Check className="size-3" />
              ) : (
                <AlertCircle className="size-3" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Results Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border/60 bg-background/95 backdrop-blur-xl shadow-xl divide-y divide-border/20">
              {isLoading ? (
                <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" />
                  Searching user directory...
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  {query ? `No platform users match "${query}"` : "Type to filter platform users..."}
                </div>
              ) : (
                candidates.map((c) => {
                  const isAssigned = assignedIds.has(c.id)
                  const isBusy = isSubmitting === c.id

                  return (
                    <div
                      key={c.id}
                      className="p-2.5 flex items-center justify-between hover:bg-muted/20 transition-colors gap-2"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Avatar className="size-6 border border-border/40">
                          <AvatarFallback className="text-[10px] font-mono uppercase bg-muted/40">
                            {c.username.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <div className="font-semibold text-foreground text-xs truncate">
                            @{c.username}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {c.email} • <span className="capitalize">{c.role}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isAssigned ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-400 border-amber-500/30 bg-amber-500/10 py-0 px-2 flex items-center gap-1"
                          >
                            <Check className="size-2.5" /> Assigned
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleAppoint(c)}
                            className="h-6 text-[11px] px-2.5 font-mono bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                          >
                            {isBusy ? (
                              <Loader2 className="size-3 animate-spin mr-1" />
                            ) : (
                              <UserPlus className="size-3 mr-1" />
                            )}
                            Appoint
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
