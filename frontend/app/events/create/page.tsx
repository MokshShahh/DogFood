"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/header"
import { Squares } from "@/components/reactbits/squares"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, Upload, Calendar, Globe, Award, Users, Plus, Trash2, ArrowRight } from "lucide-react"

export default function CreateEventPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)

  // Step 1: Details
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [mode, setMode] = useState<"virtual" | "in_person" | "hybrid">("virtual")
  const [location, setLocation] = useState("")
  const [prizePool, setPrizePool] = useState("")
  const [maxTeamSize, setMaxTeamSize] = useState(4)

  // Step 2: Tracks & Prizes
  const [tracks, setTracks] = useState<{ title: string; description: string }[]>([])
  const [prizes, setPrizes] = useState<{ title: string; amount: string; description: string }[]>([])

  // Step 3: Schedule & Phases
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [phases, setPhases] = useState<{ title: string; start_date: string; end_date: string }[]>([])

  // Step 4: Submission Format
  const [requireGithub, setRequireGithub] = useState(true)
  const [requireDemo, setRequireDemo] = useState(false)
  const [requirePresentation, setRequirePresentation] = useState(false)
  const [submissionGuidelines, setSubmissionGuidelines] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "organizer" && user.role !== "admin"))) {
      router.push("/")
    }
  }, [user, isLoading, router])

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!title.trim() || !description.trim()) {
        setError("Please fill out event title and description.")
        return
      }
    } else if (step === 3) {
      if (!startDate || !endDate) {
        setError("Please define the overall start and end dates.")
        return
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setError("End date must be after the start date.")
        return
      }
      for (let i = 0; i < phases.length; i++) {
        if (!phases[i].title || !phases[i].start_date || !phases[i].end_date) {
          setError(`Please fill all fields for phase ${i + 1}`)
          return
        }
      }
    }
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("description", description.trim())
      if (bannerFile) {
        formData.append("banner", bannerFile)
      }
      formData.append("start_date", new Date(startDate).toISOString())
      formData.append("end_date", new Date(endDate).toISOString())
      formData.append("mode", mode)
      formData.append("location", location.trim())
      formData.append("prize_pool", prizePool.trim())
      formData.append("max_team_size", maxTeamSize.toString())
      
      // Submission Format
      formData.append("require_github_url", requireGithub.toString())
      formData.append("require_demo_url", requireDemo.toString())
      formData.append("require_presentation", requirePresentation.toString())
      formData.append("submission_guidelines", submissionGuidelines.trim())
      
      const formattedPhases = phases.map(p => ({
        title: p.title,
        start_date: new Date(p.start_date).toISOString(),
        end_date: new Date(p.end_date).toISOString(),
      }))
      if (formattedPhases.length > 0) formData.append("phases", JSON.stringify(formattedPhases))
      
      if (tracks.length > 0) formData.append("tracks", JSON.stringify(tracks))
      if (prizes.length > 0) formData.append("prizes", JSON.stringify(prizes))

      const newEvent = await api.createEvent(formData)
      router.push(`/events/${newEvent.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to create event.")
    } finally {
      setSubmitting(false)
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

  const stepTitles = [
    "Event Details",
    "Tracks & Prizes",
    "Schedule & Phases",
    "Submission Format"
  ]
  const stepDescriptions = [
    "Define the core information about your hackathon.",
    "Add tracks for participants to compete in and prizes to be won.",
    "Set the overall timeline and specific phases (e.g. Sign up, Code Sprint).",
    "Define exactly what participants need to submit for their projects."
  ]

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono overflow-hidden">
      <Header />

      <div className="relative flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6 pb-20">
        <Squares
          direction="diagonal"
          speed={0.2}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.03)"
          hoverFillColor="rgba(255, 255, 255, 0.06)"
          className="z-0"
        />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>back to events</span>
            </Link>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1.5 w-6 sm:w-10 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted/30'}`} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="space-y-1 mb-6 text-left border-b border-border/30 pb-4">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Step {step}: {stepTitles[step - 1]}
              </h1>
              <p className="text-xs text-muted-foreground">
                {stepDescriptions[step - 1]}
              </p>
            </div>

            {error && (
              <div className="mb-5 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-5 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Event Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NexusHack 2026" className="h-9 font-mono bg-muted/20 border-border/40" />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Event Banner Image</Label>
                  <div className="mt-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 hover:bg-muted/20 transition cursor-pointer">
                    {bannerPreview ? (
                      <div className="relative w-full aspect-[21/9] max-h-48 overflow-hidden rounded-md">
                        <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }} className="absolute top-2 right-2 bg-background/80 px-2 py-1 text-[10px] rounded hover:text-destructive">remove</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer py-4 w-full h-full">
                        <Upload className="size-6 text-muted-foreground mb-2" />
                        <span className="text-xs font-medium">Click to upload banner</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Description & Guidelines *</Label>
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your hackathon..." className="w-full rounded-md border border-border/40 bg-muted/20 p-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Globe className="size-3" /> Event Mode</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["virtual", "in_person", "hybrid"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setMode(m)} className={`h-8 rounded border px-2 text-[11px] font-mono capitalize transition-colors ${mode === m ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/40 bg-muted/10 text-muted-foreground"}`}>{m.replace("_", " ")}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Location / Platform</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={mode === "virtual" ? "Discord / Zoom" : "San Francisco, CA"} className="h-9 font-mono bg-muted/20 border-border/40" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Award className="size-3" /> Prize Pool Info</Label>
                    <Input value={prizePool} onChange={(e) => setPrizePool(e.target.value)} placeholder="$25,000 in Prizes & Grants" className="h-9 font-mono bg-muted/20 border-border/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="size-3" /> Max Team Size</Label>
                    <Input type="number" min={1} max={10} value={maxTeamSize} onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 4)} className="h-9 font-mono bg-muted/20 border-border/40" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-8 text-xs">
                {/* Tracks */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/30 pb-2">
                    <h3 className="font-semibold text-sm">Competition Tracks (Optional)</h3>
                  </div>
                  {tracks.map((track, idx) => (
                    <div key={idx} className="p-3 border border-border/40 rounded-lg bg-muted/10 space-y-3 relative group">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setTracks(tracks.filter((_, i) => i !== idx))} className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-50 group-hover:opacity-100">
                        <Trash2 className="size-4" />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Track Title</Label>
                        <Input value={track.title} onChange={(e) => { const nt = [...tracks]; nt[idx].title = e.target.value; setTracks(nt); }} placeholder="e.g. Generative AI" className="h-8 font-mono bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Track Description</Label>
                        <textarea rows={2} value={track.description} onChange={(e) => { const nt = [...tracks]; nt[idx].description = e.target.value; setTracks(nt); }} className="w-full rounded bg-background border border-input p-2 font-mono" />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setTracks([...tracks, { title: "", description: "" }])} className="w-full border-dashed">
                    <Plus className="size-3 mr-1.5" /> Add Track
                  </Button>
                </div>

                {/* Prizes */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/30 pb-2">
                    <h3 className="font-semibold text-sm">Specific Prizes (Optional)</h3>
                  </div>
                  {prizes.map((prize, idx) => (
                    <div key={idx} className="p-3 border border-border/40 rounded-lg bg-muted/10 space-y-3 relative group">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPrizes(prizes.filter((_, i) => i !== idx))} className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-50 group-hover:opacity-100">
                        <Trash2 className="size-4" />
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">Prize Name</Label>
                          <Input value={prize.title} onChange={(e) => { const np = [...prizes]; np[idx].title = e.target.value; setPrizes(np); }} placeholder="e.g. 1st Place Overall" className="h-8 font-mono bg-background" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground uppercase">Amount / Reward</Label>
                          <Input value={prize.amount} onChange={(e) => { const np = [...prizes]; np[idx].amount = e.target.value; setPrizes(np); }} placeholder="e.g. $5,000 + Credits" className="h-8 font-mono bg-background" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Description</Label>
                        <Input value={prize.description} onChange={(e) => { const np = [...prizes]; np[idx].description = e.target.value; setPrizes(np); }} placeholder="Details about this prize..." className="h-8 font-mono bg-background" />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setPrizes([...prizes, { title: "", amount: "", description: "" }])} className="w-full border-dashed">
                    <Plus className="size-3 mr-1.5" /> Add Prize
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-8 text-xs">
                {/* Overall Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm border-b border-border/30 pb-2">Overall Event Timeline *</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5"><Calendar className="size-3" /> Start Date & Time *</Label>
                      <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 font-mono bg-muted/20 border-border/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase flex items-center gap-1.5"><Calendar className="size-3" /> End Date & Time *</Label>
                      <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 font-mono bg-muted/20 border-border/40" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/30 pb-2">
                    <h3 className="font-semibold text-sm">Event Phases (Optional)</h3>
                  </div>
                  {phases.map((phase, index) => (
                    <div key={index} className="p-4 border border-border/40 rounded-lg bg-muted/10 space-y-4 relative group">
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPhases(phases.filter((_, i) => i !== index))} className="absolute top-2 right-2 h-6 w-6 text-destructive opacity-50 group-hover:opacity-100">
                        <Trash2 className="size-4" />
                      </Button>
                      <div className="space-y-1.5 w-[85%]">
                        <Label className="text-[11px] text-muted-foreground uppercase">Phase Title</Label>
                        <Input value={phase.title} onChange={(e) => { const np = [...phases]; np[index].title = e.target.value; setPhases(np); }} placeholder="e.g. Sign up, Code sprint, Submission" className="h-9 font-mono bg-background" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground uppercase">Start Date</Label>
                          <Input type="datetime-local" value={phase.start_date} onChange={(e) => { const np = [...phases]; np[index].start_date = e.target.value; setPhases(np); }} className="h-9 font-mono bg-background" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground uppercase">End Date</Label>
                          <Input type="datetime-local" value={phase.end_date} onChange={(e) => { const np = [...phases]; np[index].end_date = e.target.value; setPhases(np); }} className="h-9 font-mono bg-background" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setPhases([...phases, { title: "", start_date: "", end_date: "" }])} className="w-full border-dashed">
                    <Plus className="size-3 mr-1.5" /> Add Phase
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                <div className="space-y-5">
                  <div className="p-4 rounded-lg border border-border/40 bg-muted/10 space-y-4">
                    <h3 className="font-semibold text-sm border-b border-border/20 pb-2">Required Fields for Submission</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="req_github" checked={requireGithub} onCheckedChange={(c) => setRequireGithub(c as boolean)} />
                        <label htmlFor="req_github" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Require GitHub Repository URL
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="req_demo" checked={requireDemo} onCheckedChange={(c) => setRequireDemo(c as boolean)} />
                        <label htmlFor="req_demo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Require Deployed URL or Demo Video Link
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="req_pres" checked={requirePresentation} onCheckedChange={(c) => setRequirePresentation(c as boolean)} />
                        <label htmlFor="req_pres" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Require Presentation (Link or File)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Submission Guidelines / Rules</Label>
                    <textarea 
                      rows={5} 
                      value={submissionGuidelines} 
                      onChange={(e) => setSubmissionGuidelines(e.target.value)} 
                      placeholder="Add any specific instructions for project submission..." 
                      className="w-full rounded-md border border-border/40 bg-muted/20 p-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-ring" 
                    />
                  </div>
                </div>
              </form>
            )}

            {/* Navigation Actions */}
            <div className="pt-8 flex justify-between gap-4 mt-auto border-t border-border/30">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="h-9 text-xs">Back</Button>
              ) : <div />}
              
              {step < 4 ? (
                <Button onClick={handleNext} className="h-9 text-xs font-mono bg-foreground text-background hover:bg-foreground/90 font-medium flex items-center gap-2">
                  Next Step <ArrowRight className="size-3" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="h-9 text-xs font-mono bg-foreground text-background hover:bg-foreground/90 font-medium">
                  {submitting ? <><Loader2 className="size-3.5 animate-spin mr-2" /> Publishing...</> : "Publish Hackathon"}
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
