"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api, User, Team } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Trash2 } from "lucide-react"

export function AdminEventDashboard({ eventId, eventObj, refreshEvent }: { eventId: number, eventObj: any, refreshEvent: () => void }) {
  const router = useRouter()
  const [usersList, setUsersList] = useState<User[]>([])
  const [teamsList, setTeamsList] = useState<Team[]>([])
  const [activeTab, setActiveTab] = useState<"teams" | "judges" | "settings">("teams")
  
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchAdminData = async () => {
    try {
      const uList = await api.listUsers()
      setUsersList(uList)
      const tms = await api.listAllTeams(eventId)
      setTeamsList(tms)
    } catch (err: any) {
      setActionError(err.message || "Failed to load admin data")
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [eventId])

  const handleDeleteTeam = async (id: number) => {
    if(!confirm("Delete this team?")) return
    try {
      await api.deleteTeam(id)
      setActionSuccess("Team deleted")
      fetchAdminData()
    } catch(err: any) { setActionError(err.message) }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-background/80 p-5 backdrop-blur-md space-y-4 shadow-2xl mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border/30 pb-4">
        Admin Management
      </h2>

      <div className="flex gap-2 border-b border-border/20 pb-2 overflow-x-auto">
        {["teams", "judges", "settings"].map(t => (
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

      {activeTab === "judges" && (
        <div className="space-y-4">
           <p className="text-xs text-muted-foreground">Current Judges: {eventObj.event_judges?.map((j: any) => j.username).join(", ") || "None"}</p>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={async () => {
              const username = prompt("Enter username of judge to ADD to this event:");
              if (username) {
                const targetUser = usersList.find(u => u.username === username);
                if (targetUser) {
                  try { await api.addEventJudge(eventId, targetUser.id); refreshEvent(); setActionSuccess("Judge added"); } catch(err: any) { setActionError(err.message); }
                } else { setActionError("User not found in user list."); }
              }
            }} className="h-6 text-[11px] font-mono hover:text-emerald-400">Add Judge</Button>
            <Button variant="outline" size="sm" onClick={async () => {
              const username = prompt("Enter username of judge to REMOVE from this event:");
              if (username) {
                const targetUser = usersList.find(u => u.username === username);
                if (targetUser) {
                  try { await api.removeEventJudge(eventId, targetUser.id); refreshEvent(); setActionSuccess("Judge removed"); } catch(err: any) { setActionError(err.message); }
                } else { setActionError("User not found in user list."); }
              }
            }} className="h-6 text-[11px] font-mono hover:text-amber-400">Remove Judge</Button>
           </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4 text-xs mt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Submission Requirements</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={eventObj.require_github_url || false}
                  onChange={async (e) => {
                    try { await api.updateEventAdmin(eventId, { require_github_url: e.target.checked }); refreshEvent(); setActionSuccess("Updated setting"); } 
                    catch(err: any) { setActionError(err.message); }
                  }}
                />
                Require GitHub URL
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={eventObj.require_demo_url || false}
                  onChange={async (e) => {
                    try { await api.updateEventAdmin(eventId, { require_demo_url: e.target.checked }); refreshEvent(); setActionSuccess("Updated setting"); } 
                    catch(err: any) { setActionError(err.message); }
                  }}
                />
                Require Demo URL
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={eventObj.require_presentation || false}
                  onChange={async (e) => {
                    try { await api.updateEventAdmin(eventId, { require_presentation: e.target.checked }); refreshEvent(); setActionSuccess("Updated setting"); } 
                    catch(err: any) { setActionError(err.message); }
                  }}
                />
                Require Presentation
              </label>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={async () => {
                const val = prompt("Enter Submission Guidelines:", eventObj.submission_guidelines || "");
                if (val !== null && val !== eventObj.submission_guidelines) {
                  try { await api.updateEventAdmin(eventId, { submission_guidelines: val }); refreshEvent(); setActionSuccess("Updated guidelines"); } 
                  catch(err: any) { setActionError(err.message); }
                }
              }}>Edit Guidelines</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "teams" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-[11px] text-muted-foreground uppercase">
                <th className="py-2 px-3 font-normal">Team Name</th>
                <th className="py-2 px-3 font-normal">Code</th>
                <th className="py-2 px-3 font-normal">Submission</th>
                <th className="py-2 px-3 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {teamsList.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => router.push(`/events/${eventId}/teams/${t.id}`)}>
                  <td className="py-2.5 px-3 font-medium text-primary hover:underline">{t.name}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{t.code}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{t.submission ? "Yes" : "No"}</td>
                  <td className="py-2.5 px-3 text-right">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }} className="h-6 text-[11px] font-mono text-destructive hover:bg-destructive/10">Delete</Button>
                  </td>
                </tr>
              ))}
              {teamsList.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">No teams found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
