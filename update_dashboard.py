import re

with open('frontend/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Add activeEventId state
content = content.replace(
    'const [activeTab, setActiveTab] = useState<"users" | "events" | "teams" | "submissions">("users")',
    'const [activeTab, setActiveTab] = useState<"users" | "events" | "teams" | "submissions">("events")\n  const [activeEventId, setActiveEventId] = useState<number | null>(null)'
)

# Modify fetchAdminData to fetch based on activeEventId
fetch_admin_data_orig = """  const fetchAdminData = async () => {
    if (user?.role === "admin") {
      try {
        const [evs, tms, subs] = await Promise.all([
          api.listEvents(),
          api.listAllTeams(),
          api.listAllSubmissions()
        ])
        setEventsList(evs)
        setTeamsList(tms)
        setSubmissionsList(subs)
      } catch (err: any) {
        setActionError(err.message || "Failed to load admin data")
      }
    }
  }"""

fetch_admin_data_new = """  const fetchAdminData = async () => {
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
  }, [activeEventId])"""

content = content.replace(fetch_admin_data_orig, fetch_admin_data_new)

# Add event selector
event_selector = """
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
              </div>"""

content = content.replace(
"""              <div className="flex gap-2 border-b border-border/20 pb-2 overflow-x-auto">
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
              </div>""", event_selector
)

# Update events table to show judges column
events_table_orig = """<th className="py-2 px-3 font-normal">Event Title</th>
                        <th className="py-2 px-3 font-normal">Mode</th>
                        <th className="py-2 px-3 font-normal text-right">Action</th>"""

events_table_new = """<th className="py-2 px-3 font-normal">Event Title</th>
                        <th className="py-2 px-3 font-normal">Mode</th>
                        <th className="py-2 px-3 font-normal">Judges</th>
                        <th className="py-2 px-3 font-normal text-right">Action</th>"""

content = content.replace(events_table_orig, events_table_new)

events_row_orig = """<td className="py-2.5 px-3 font-medium">{e.title}</td>
                          <td className="py-2.5 px-3 text-muted-foreground capitalize">{e.mode}</td>
                          <td className="py-2.5 px-3 text-right space-x-2">"""

events_row_new = """<td className="py-2.5 px-3 font-medium">{e.title}</td>
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
                            }} className="h-6 text-[11px] font-mono hover:text-amber-400">Remove Judge</Button>"""

content = content.replace(events_row_orig, events_row_new)

with open('frontend/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

