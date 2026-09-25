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

  const [eventsList, setEventsList] = useState<any[]>([])
  const [teamsList, setTeamsList] = useState<any[]>([])
  const [submissionsList, setSubmissionsList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"users" | "events" | "teams" | "submissions">("events")
  const [activeEventId, setActiveEventId] = useState<number | null>(null)

  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  
  const fetchAdminData = async () => {
    if (user?.role === "admin") {
      try {
        const evs = await api.listEvents()
        setEventsList(evs)
        if (activeEventId) {
            const [tms, subs] = await Promise.all([
              api.listAllTeams(activeEventId),
              api.listAllSubmissions(activeEventId)
            ])
            setTeamsList(tms)
            setSubmissionsList(subs)
        } else {
            const [tms, subs] = await Promise.all([
              api.listAllTeams(),
              api.listAllSubmissions()
            ])
            setTeamsList(tms)
            setSubmissionsList(subs)
        }
      } catch (err: any) {
        setActionError(err.message || "Failed to load admin data")
      }
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminData()
    }
  }, [activeEventId])

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
      fetchUsers(); fetchAdminData()
    }
  }, [user])

  
  const handleDeleteEvent = async (id: number) => {
    if(!confirm("Delete this event?")) return
    try {
      await api.deleteEvent(id)
      setActionSuccess("Event deleted")
      fetchAdminData()
    } catch(err: any) { setActionError(err.message) }
  }
  const handleDeleteTeam = async (id: number) => {
    if(!confirm("Delete this team?")) return
    try {
      await api.deleteTeam(id)
      setActionSuccess("Team deleted")
      fetchAdminData()
    } catch(err: any) { setActionError(err.message) }
  }
  const handleDeleteSubmission = async (id: number) => {
    if(!confirm("Delete this submission?")) return
    try {
      await api.deleteSubmission(id)
      setActionSuccess("Submission deleted")
      fetchAdminData()
    } catch(err: any) { setActionError(err.message) }
  }

  const handleAppointJudge = async (userId: number, username: string) => {
    setActionError(null)
    setActionSuccess(null)
    try {
      await api.appointJudge(userId)
      setActionSuccess(`@${username} appointed as Judge`)
      fetchUsers(); fetchAdminData()
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

          
          {user.role === "admin" && (
            <div className="rounded-xl border border-border/40 bg-background/80 p-5 backdrop-blur-md space-y-4">

              <div className="flex gap-2 border-b border-border/20 pb-2 overflow-x-auto">
                {["users", "events", "teams", "submissions"].map(t => (
                  <Button 
                    key={t}
                    variant={activeTab === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(t as any)}
                    className="capitalize text-xs h-7 font-mono"
                  >
                    Manage {t}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-3 border-b border-border/20 pb-4">
                <span className="text-xs text-muted-foreground font-semibold">Filter by Event:</span>
                <select 
                  className="bg-background border border-border text-xs rounded px-2 py-1"
                  value={activeEventId || ""}
                  onChange={(e) => setActiveEventId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Events (Global)</option>
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
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

              {activeTab === "users" && (
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
                              <Button variant="outline" size="sm" onClick={() => handleAppointJudge(u.id, u.username)} className="h-6 text-[11px] font-mono hover:border-amber-500 hover:text-amber-400">appoint judge</Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/60">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "events" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-[11px] text-muted-foreground uppercase">
                        <th className="py-2 px-3 font-normal">Event Title</th>
                        <th className="py-2 px-3 font-normal">Mode</th>
                        <th className="py-2 px-3 font-normal">Judges</th>
                        <th className="py-2 px-3 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {eventsList.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-medium">{e.title}</td>
                          <td className="py-2.5 px-3 text-muted-foreground capitalize">{e.mode}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {e.event_judges?.map((j: any) => j.username).join(", ") || "None"}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={async () => {
                              const username = prompt("Enter username of judge to ADD to this event:");
                              if (username) {
                                const targetUser = usersList.find(u => u.username === username);
                                if (targetUser) {
                                  try { await api.addEventJudge(e.id, targetUser.id); fetchAdminData(); setActionSuccess("Judge added"); } catch(err: any) { setActionError(err.message); }
                                } else { setActionError("User not found in user list."); }
                              }
                            }} className="h-6 text-[11px] font-mono hover:text-emerald-400">Add Judge</Button>
                            <Button variant="outline" size="sm" onClick={async () => {
                              const username = prompt("Enter username of judge to REMOVE from this event:");
                              if (username) {
                                const targetUser = usersList.find(u => u.username === username);
                                if (targetUser) {
                                  try { await api.removeEventJudge(e.id, targetUser.id); fetchAdminData(); setActionSuccess("Judge removed"); } catch(err: any) { setActionError(err.message); }
                                } else { setActionError("User not found in user list."); }
                              }
                            }} className="h-6 text-[11px] font-mono hover:text-amber-400">Remove Judge</Button>
                            <Button variant="outline" size="sm" onClick={async () => {
                              const newTitle = prompt("Enter new title for event:", e.title);
                              if (newTitle) {
                                try {
                                  await api.updateEventAdmin(e.id, { title: newTitle });
                                  setActionSuccess("Event updated");
                                  fetchAdminData();
                                } catch(err: any) { setActionError(err.message); }
                              }
                            }} className="h-6 text-[11px] font-mono">Edit Title</Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(e.id)} className="h-6 text-[11px] font-mono text-destructive hover:bg-destructive/10">Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "teams" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-[11px] text-muted-foreground uppercase">
                        <th className="py-2 px-3 font-normal">Team Name</th>
                        <th className="py-2 px-3 font-normal">Code</th>
                        <th className="py-2 px-3 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {teamsList.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-medium">{t.name}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{t.code}</td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={async () => {
                              const newName = prompt("Enter new team name:", t.name);
                              if (newName) {
                                try {
                                  await api.updateTeamAdmin(t.id, { name: newName });
                                  setActionSuccess("Team updated");
                                  fetchAdminData();
                                } catch(err: any) { setActionError(err.message); }
                              }
                            }} className="h-6 text-[11px] font-mono">Edit Name</Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTeam(t.id)} className="h-6 text-[11px] font-mono text-destructive hover:bg-destructive/10">Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "submissions" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 text-[11px] text-muted-foreground uppercase">
                        <th className="py-2 px-3 font-normal">Project Title</th>
                        <th className="py-2 px-3 font-normal">Team</th>
                        <th className="py-2 px-3 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {submissionsList.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-medium">{s.title}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{s.team_name}</td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={async () => {
                              const newTitle = prompt("Enter new project title:", s.title);
                              if (newTitle) {
                                try {
                                  await api.updateSubmissionAdmin(s.id, { title: newTitle });
                                  setActionSuccess("Submission updated");
                                  fetchAdminData();
                                } catch(err: any) { setActionError(err.message); }
                              }
                            }} className="h-6 text-[11px] font-mono">Edit Title</Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteSubmission(s.id)} className="h-6 text-[11px] font-mono text-destructive hover:bg-destructive/10">Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
