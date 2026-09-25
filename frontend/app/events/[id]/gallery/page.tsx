"use client"

import React, { useState, useEffect, use } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Squares } from "@/components/reactbits/squares"
import { api, Event as EventType, ProjectSubmission } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Loader2, Award, Code, Video, Presentation, Layers } from "lucide-react"

export default function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [event, setEvent] = useState<EventType | null>(null)
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [trackFilter, setTrackFilter] = useState("")

  const loadData = async () => {
    try {
      const ev = await api.getEvent(eventId)
      setEvent(ev)
      const subs = await api.listGallery(eventId, { q: searchQuery, track: trackFilter })
      setSubmissions(subs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId, searchQuery, trackFilter])

  return (
    <div className="relative min-h-screen flex flex-col bg-background font-mono select-none overflow-hidden pb-16">
      <Header />
      <div className="relative flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">
        <Squares direction="diagonal" speed={0.2} squareSize={48} borderColor="rgba(255, 255, 255, 0.03)" hoverFillColor="rgba(255, 255, 255, 0.06)" className="z-0 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <Link href={`/events/${eventId}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to {event?.title || "Event"}
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
            Public Gallery
          </h1>

          <div className="flex gap-4">
            <Input 
              placeholder="Search projects..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-muted/20 border-border/40 font-mono text-sm max-w-sm"
            />
            {event?.tracks && event.tracks.length > 0 && (
              <select 
                className="rounded-md border border-input bg-muted/20 px-3 py-1 text-sm font-mono max-w-xs"
                value={trackFilter}
                onChange={e => setTrackFilter(e.target.value)}
              >
                <option value="">All Tracks</option>
                {event.tracks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <Loader2 className="animate-spin text-muted-foreground" />
          ) : submissions.length === 0 ? (
            <div className="p-8 border border-border/30 rounded-lg text-center text-muted-foreground">
              No projects found in the gallery.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map(sub => (
                <div key={sub.id} className="p-4 rounded-lg border border-border/40 bg-background/80 backdrop-blur shadow-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{sub.title}</h3>
                    <span className="text-xs bg-muted/30 px-2 py-1 rounded">Team: {sub.team_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic line-clamp-2">"{sub.tagline}"</p>
                  
                  {sub.tech_stack && (
                    <div className="flex flex-wrap gap-1.5">
                      {sub.tech_stack.split(",").map((tech, idx) => (
                        <span key={idx} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">{tech.trim()}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
                    <a href={sub.github_url} target="_blank" className="text-xs flex items-center gap-1 hover:underline">
                      <Code className="size-3" /> Code
                    </a>
                    {sub.demo_url && (
                      <a href={sub.demo_url} target="_blank" className="text-xs text-blue-400 flex items-center gap-1 hover:underline">
                        <Video className="size-3" /> Demo
                      </a>
                    )}
                    {sub.presentation_url && (
                      <a href={sub.presentation_url} target="_blank" className="text-xs text-amber-400 flex items-center gap-1 hover:underline">
                        <Presentation className="size-3" /> Deck
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
