"use client"

import React, { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { api, Team } from "@/lib/api"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit2, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function TeamManagePage({ params }: { params: Promise<{ id: string, teamId: string }> }) {
  const resolvedParams = use(params)
  const eventId = Number(resolvedParams.id)
  const teamId = Number(resolvedParams.teamId)
  
  const router = useRouter()
  const { user } = useAuth()

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchTeam = async () => {
    try {
      const data = await api.getTeamAdmin(teamId)
      setTeam(data)
    } catch (err: any) {
      setActionError(err.message || "Failed to load team")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchTeam()
    } else if (user) {
      router.push("/")
    }
  }, [user, teamId])

  const handleUpdateTeam = async (currentName: string) => {
    const newName = prompt("Enter new team name:", currentName)
    if (newName && newName !== currentName) {
      try {
        await api.updateTeamAdmin(teamId, { name: newName })
        setActionSuccess("Team updated")
        fetchTeam()
      } catch(err: any) { setActionError(err.message) }
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if(!confirm("Remove this member from the team?")) return
    try {
      await api.removeTeamMember(teamId, userId)
      setActionSuccess("Member removed")
      fetchTeam()
    } catch(err: any) { setActionError(err.message) }
  }

  const handleUpdateSubmission = async (subId: number, field: string, currentValue: string) => {
    const newValue = prompt(`Enter new ${field}:`, currentValue)
    if (newValue && newValue !== currentValue) {
      try {
        await api.updateSubmissionAdmin(subId, { [field]: newValue })
        setActionSuccess("Submission updated")
        fetchTeam()
      } catch(err: any) { setActionError(err.message) }
    }
  }

  const handleDeleteSubmission = async (subId: number) => {
    if(!confirm("Delete this submission?")) return
    try {
      await api.deleteSubmission(subId)
      setActionSuccess("Submission deleted")
      fetchTeam()
    } catch(err: any) { setActionError(err.message) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!team) return <div className="min-h-screen p-8 text-center text-destructive">Error loading team.</div>

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono overflow-hidden">
      <Header />
      <div className="relative flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <Link href={`/events/${eventId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to Event
          </Link>
        </div>

        {actionSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
            <CheckCircle2 className="size-3.5" /><span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded">
            <AlertCircle className="size-3.5" /><span>{actionError}</span>
          </div>
        )}

        <div className="space-y-6 rounded-xl border border-border/40 bg-background/80 p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            Team: {team.name}
            <button onClick={() => handleUpdateTeam(team.name)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-4" /></button>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Members</h4>
              <ul className="space-y-2">
                {team.members.map(m => (
                  <li key={m.id} className="flex justify-between items-center text-sm p-3 rounded border border-border/30 bg-muted/10">
                    <span>@{m.username} {m.is_leader && <span className="text-[10px] uppercase ml-2 text-amber-400">(Leader)</span>}</span>
                    <button onClick={() => handleRemoveMember(m.user_id)} className="text-destructive hover:text-destructive/80"><Trash2 className="size-4" /></button>
                  </li>
                ))}
                {team.members.length === 0 && <li className="text-muted-foreground text-sm">No members</li>}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Submission</h4>
              {team.submission ? (
                <div className="space-y-3 p-4 rounded border border-border/30 bg-muted/10 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Title: {team.submission.title}</span>
                    <button onClick={() => handleUpdateSubmission(team.submission!.id, "title", team.submission!.title)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground italic">Tagline: "{team.submission.tagline}"</span>
                    <button onClick={() => handleUpdateSubmission(team.submission!.id, "tagline", team.submission!.tagline)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                  </div>
                  <div className="pt-2 flex flex-col gap-2 border-t border-border/20 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-semibold">GitHub:</span>
                        <a href={team.submission.github_url} target="_blank" className="text-primary hover:underline truncate max-w-[200px]">{team.submission.github_url}</a>
                      </div>
                      <button onClick={() => handleUpdateSubmission(team.submission!.id, "github_url", team.submission!.github_url)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5 shrink-0" /></button>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleDeleteSubmission(team.submission!.id)} className="h-7 text-xs text-destructive hover:bg-destructive/10">Delete Submission</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-4 rounded border border-border/30 bg-muted/10">No project submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
