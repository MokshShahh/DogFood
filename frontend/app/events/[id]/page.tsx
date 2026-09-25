"use client"

import React, { useState, useEffect, use } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Squares } from "@/components/reactbits/squares"
import { api, Event as EventType, Team, ProjectSubmission } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Globe,
  Award,
  Users,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  PlusCircle,
  UserPlus,
  LogOut,
  Shield,
  Crown,
  FileCode2,
  ExternalLink,
  Presentation,
  Video,
  Layers,
  ArrowRight,
} from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const { user } = useAuth()

  const [event, setEvent] = useState<EventType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Team Form States
  const [teamName, setTeamName] = useState("")
  const [teamCodeInput, setTeamCodeInput] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [activeTab, setActiveTab] = useState<"create" | "join">("create")

  // Submissions roster for Organizers/Judges
  const [allSubmissions, setAllSubmissions] = useState<ProjectSubmission[]>([])

  const fetchEvent = async () => {
    try {
      const data = await api.getEvent(eventId)
      setEvent(data)

      // If organizer, judge, or creator, load submissions roster
      const isReviewer =
        user &&
        (["organizer", "judge", "admin"].includes(user.role) ||
          data.created_by === user.id)

      if (isReviewer) {
        try {
          const subs = await api.listEventSubmissions(eventId)
          setAllSubmissions(subs)
        } catch {
          // ignore if unauthorized
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load event details.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId, user])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)
    if (!teamName.trim()) {
      setActionError("Team name cannot be empty.")
      return
    }

    setActionLoading(true)
    try {
      const res = await api.createTeam(eventId, teamName.trim())
      setActionSuccess(res.message)
      setTeamName("")
      await fetchEvent()
    } catch (err: any) {
      setActionError(err.message || "Could not create team.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)
    if (!teamCodeInput.trim()) {
      setActionError("Please enter a team code.")
      return
    }

    setActionLoading(true)
    try {
      const res = await api.joinTeam(eventId, teamCodeInput.trim())
      setActionSuccess(res.message)
      setTeamCodeInput("")
      await fetchEvent()
    } catch (err: any) {
      setActionError(err.message || "Could not join team.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return
    setActionError(null)
    setActionSuccess(null)

    setActionLoading(true)
    try {
      const res = await api.leaveTeam(eventId)
      setActionSuccess(res.message)
      await fetchEvent()
    } catch (err: any) {
      setActionError(err.message || "Could not leave team.")
    } finally {
      setActionLoading(false)
    }
  }

  const copyTeamCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getMediaUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith("http")) return url
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col bg-background font-mono select-none">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-foreground" />
            Loading hackathon specifications...
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="relative min-h-screen flex flex-col bg-background font-mono select-none">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-xl border border-destructive/30 bg-destructive/5 space-y-4 text-center">
            <AlertCircle className="size-8 text-destructive mx-auto" />
            <h2 className="text-sm font-semibold text-foreground">Hackathon Not Found</h2>
            <p className="text-sm text-muted-foreground">{error || "Unable to locate event record."}</p>
            <Link href="/">
              <Button size="sm" variant="outline" className="text-sm font-mono">
                <ArrowLeft className="size-3 mr-1.5" /> Return to Events
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const bannerUrl = getMediaUrl(event.banner)

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono select-none overflow-hidden pb-16">
      <Header />

      <div className="relative flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <Squares
          direction="diagonal"
          speed={0.2}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(255, 255, 255, 0.06)"
          className="z-0 pointer-events-none"
        />

        <div className="relative z-10 space-y-8">
          {/* Back Navigation */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Hackathons
            </Link>
          </div>

          {/* Event Header & Banner */}
          <div className="rounded-xl border border-border/40 bg-background/80 overflow-hidden backdrop-blur-md shadow-2xl">
            {bannerUrl ? (
              <div className="relative w-full h-48 sm:h-72 bg-muted/20 border-b border-border/30 overflow-hidden">
                <img
                  src={bannerUrl}
                  alt={event.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              </div>
            ) : null}

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    {event.mode.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">
                    Max Team Size: {event.max_team_size}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
                  {event.title}
                </h1>
                <p className="text-sm text-muted-foreground font-mono">
                  Organized by <span className="text-foreground">@{event.created_by_username}</span>
                </p>
              </div>

              {/* Event Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-lg border border-border/30 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Calendar className="size-3" /> Timeline
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border/30 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Globe className="size-3" /> Location
                  </div>
                  <div className="text-sm text-foreground font-medium truncate">
                    {event.location}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-border/30 bg-muted/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Award className="size-3" /> Prize Pool
                  </div>
                  <div className="text-sm text-emerald-400 font-semibold truncate">
                    {event.prize_pool || "Non-monetary / Certificates"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 border-t border-border/30 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Event Brief & Objectives
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback Banners */}
          {actionError && (
            <div className="p-3.5 rounded-lg border border-destructive/40 bg-destructive/10 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div className="p-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm text-emerald-400 flex items-center gap-2">
              <Check className="size-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* 1. PARTICIPATION & TEAM PORTAL */}
          <div className="rounded-xl border border-border/40 bg-background/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/30 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                  Participation & Team Formation
                </h2>
                <p className="text-sm text-muted-foreground">
                  Form a team with friends using a shareable team code
                </p>
              </div>

              {event.my_team && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                  Registered
                </span>
              )}
            </div>

            {event.my_team ? (
              /* SCENARIO A: PARTICIPANT IS IN A TEAM */
              <div className="space-y-6">
                <div className="p-5 rounded-lg border border-border/40 bg-muted/10 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Your Registered Team
                      </span>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {event.my_team.name}
                        {event.my_team.leader === user?.id && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono flex items-center gap-1 font-normal">
                            <Crown className="size-3" /> Team Leader
                          </span>
                        )}
                      </h3>
                    </div>

                    {/* Shareable Team Code */}
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono bg-background/80 border border-border/60 px-3 py-1.5 rounded-md text-foreground flex items-center gap-2">
                        <span className="text-muted-foreground text-[10px] uppercase">Team Code:</span>
                        <span className="font-bold tracking-wider text-emerald-400">{event.my_team.code}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyTeamCode(event.my_team!.code)}
                        className="h-8 text-sm font-mono gap-1.5"
                      >
                        {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        {copied ? "Copied" : "Copy Code"}
                      </Button>
                    </div>
                  </div>

                  {/* Team Members Roster */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Roster ({event.my_team.members.length} / {event.max_team_size} members)</span>
                      <span>
                        {event.max_team_size - event.my_team.members.length} slot(s) remaining
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {event.my_team.members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 rounded-md border border-border/40 bg-muted/20 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">@{m.username}</span>
                            {m.is_leader && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                <Crown className="size-2.5" /> Leader
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            joined {new Date(m.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROJECT SUBMISSION ACTION CALLOUT */}
                  <div className="p-4 rounded-lg border border-border/50 bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="size-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                          Project Submission Portal
                        </span>
                        {event.my_team.submission ? (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                            Delivered
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                            Pending Submission
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {event.my_team.submission
                          ? `Project: "${event.my_team.submission.title}" — view deliverables or update before deadline`
                          : "Prepare and submit your team's project, repository links, slides, and demo"}
                      </p>
                    </div>

                    <Link href={`/events/${eventId}/${event.my_team.code}`}>
                      <Button size="sm" className="text-sm font-mono bg-foreground text-background hover:bg-foreground/90 gap-1.5 w-full sm:w-auto">
                        <span>{event.my_team.submission ? "Manage Submission" : "Submit Project"}</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLeaveTeam}
                      disabled={actionLoading}
                      className="text-sm text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    >
                      <LogOut className="size-3.5 mr-1" />
                      Leave Team
                    </Button>
                  </div>
                </div>
              </div>
            ) : user ? (
              /* SCENARIO B: LOGGED IN PARTICIPANT WITHOUT A TEAM */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-mono transition-colors rounded-md ${
                      activeTab === "create"
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    <PlusCircle className="size-3.5" />
                    <span>Create a Team</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("join")}
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-mono transition-colors rounded-md ${
                      activeTab === "join"
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    <UserPlus className="size-3.5" />
                    <span>Join with Team Code</span>
                  </button>
                </div>

                {activeTab === "create" ? (
                  <form onSubmit={handleCreateTeam} className="space-y-3.5 max-w-md pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="teamName" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Team Name
                      </Label>
                      <Input
                        id="teamName"
                        type="text"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. CyberPunks, CodeCrafters"
                        className="h-9 text-sm font-mono bg-muted/20 border-border/40"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Creating a team makes you the team leader and generates a shareable team code.
                    </p>
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="h-8 text-sm font-mono bg-foreground text-background hover:bg-foreground/90 font-medium"
                    >
                      {actionLoading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                      Create Team & Generate Code
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleJoinTeam} className="space-y-3.5 max-w-md pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="teamCode" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        Enter Team Code
                      </Label>
                      <Input
                        id="teamCode"
                        type="text"
                        required
                        value={teamCodeInput}
                        onChange={(e) => setTeamCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. HACK-9A2B"
                        className="h-9 text-sm font-mono uppercase bg-muted/20 border-border/40 tracking-wider"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ask your team leader for their team code and paste it above to join.
                    </p>
                    <Button
                      type="submit"
                      disabled={actionLoading}
                      className="h-8 text-sm font-mono bg-foreground text-background hover:bg-foreground/90 font-medium"
                    >
                      {actionLoading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                      Join Team
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              /* SCENARIO C: UNAUTHENTICATED */
              <div className="p-6 rounded-lg border border-border/40 bg-muted/10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account to form or join a team for this hackathon.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/login">
                    <Button size="sm" variant="outline" className="text-sm font-mono">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="text-sm font-mono bg-foreground text-background">
                      Register
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 2. ORGANIZER / JUDGE SUBMISSIONS EVALUATION ROSTER */}
          {allSubmissions.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-background/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                <Award className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Submitted Projects Roster ({allSubmissions.length} projects)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-lg border border-border/40 bg-muted/10 space-y-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{sub.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">
                        Team: {sub.team_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                      &quot;{sub.tagline}&quot;
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/20">
                      {sub.github_url && (
                        <a
                          href={sub.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-foreground hover:underline"
                        >
                          <GithubIcon className="size-3" /> repo
                        </a>
                      )}
                      {sub.demo_url && (
                        <a
                          href={sub.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <Video className="size-3" /> demo
                        </a>
                      )}
                      {sub.presentation_url && (
                        <a
                          href={sub.presentation_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                        >
                          <Presentation className="size-3" /> deck
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
