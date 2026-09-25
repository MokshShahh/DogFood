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
import { ArrowLeft, Loader2, Upload, Calendar, Globe, Award, Users } from "lucide-react"

export default function CreateEventPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [mode, setMode] = useState<"virtual" | "in_person" | "hybrid">("virtual")
  const [location, setLocation] = useState("")
  const [prizePool, setPrizePool] = useState("")
  const [maxTeamSize, setMaxTeamSize] = useState(4)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !description.trim() || !startDate || !endDate) {
      setError("Please fill out all required fields.")
      return
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after the start date.")
      return
    }

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

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono overflow-hidden">
      <Header />

      <div className="relative flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6">
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
            <span className="text-[11px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              organizer portal
            </span>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="space-y-1 mb-6 text-left border-b border-border/30 pb-4">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Create New Hackathon Event
              </h1>
              <p className="text-xs text-muted-foreground">
                Publish a hackathon, define schedule, and configure team parameters
              </p>
            </div>

            {error && (
              <div className="mb-5 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Event Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Event Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NexusHack 2026: AI Frontiers"
                  className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                />
              </div>

              {/* Banner Upload */}
              <div className="space-y-1.5">
                <Label htmlFor="banner" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Event Banner Image
                </Label>
                <div className="mt-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 transition hover:bg-muted/20">
                  {bannerPreview ? (
                    <div className="relative w-full aspect-[21/9] max-h-48 overflow-hidden rounded-md border border-border/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bannerPreview}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBannerFile(null)
                          setBannerPreview(null)
                        }}
                        className="absolute top-2 right-2 bg-background/80 border border-border/60 px-2 py-1 text-[10px] rounded hover:bg-destructive/20 hover:text-destructive"
                      >
                        remove
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="banner"
                      className="flex flex-col items-center justify-center cursor-pointer py-4"
                    >
                      <Upload className="size-6 text-muted-foreground mb-2" />
                      <span className="text-xs text-foreground font-medium">Click to upload banner</span>
                      <span className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB</span>
                      <input
                        id="banner"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Description & Guidelines *
                </Label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your hackathon tracks, rules, eligibility, and expectations..."
                  className="w-full rounded-md border border-border/40 bg-muted/20 p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="size-3" /> Start Date & Time *
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="size-3" /> End Date & Time *
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                  />
                </div>
              </div>

              {/* Mode & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="size-3" /> Event Mode
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["virtual", "in_person", "hybrid"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`h-8 rounded border px-2 text-[11px] font-mono capitalize transition-colors ${
                          mode === m
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border/40 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {m.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Location / Platform
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={mode === "virtual" ? "Discord / Zoom" : "San Francisco, CA"}
                    className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                  />
                </div>
              </div>

              {/* Prize Pool & Team Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prizePool" className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="size-3" /> Prize Pool
                  </Label>
                  <Input
                    id="prizePool"
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="$25,000 in Prizes & Grants"
                    className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="maxTeamSize" className="text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="size-3" /> Max Team Size (1 - 10)
                  </Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    min={1}
                    max={10}
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 4)}
                    className="h-9 text-xs font-mono bg-muted/20 border-border/40"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 text-xs font-mono bg-foreground text-background hover:bg-foreground/90 font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-2" />
                      Publishing Event...
                    </>
                  ) : (
                    "Publish Hackathon Event"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
