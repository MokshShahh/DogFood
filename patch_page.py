import re

with open('frontend/app/events/[id]/page.tsx', 'r') as f:
    content = f.read()

# Add Edit2 to imports
content = content.replace(
    'import { AdminEventDashboard } from "@/components/admin-event-dashboard"',
    'import { AdminEventDashboard } from "@/components/admin-event-dashboard"\nimport { Edit2 } from "lucide-react"'
)

# Function to handle inline edit
inline_edit_func = """
  const handleEditField = async (field: string, currentValue: string) => {
    const newValue = prompt(`Enter new ${field}:`, currentValue)
    if (newValue && newValue !== currentValue) {
      try {
        await api.updateEventAdmin(Number(eventId), { [field]: newValue })
        fetchEvent()
      } catch (err: any) {
        alert(err.message)
      }
    }
  }
"""

content = content.replace("  const fetchEvent = async () => {", inline_edit_func + "\n  const fetchEvent = async () => {")

# Update Event Title
content = content.replace(
    """<h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
                  {event.title}
                </h1>""",
    """<h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground flex items-center gap-2">
                  {event.title}
                  {user?.role === "admin" && (
                    <button onClick={() => handleEditField("title", event.title)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-5" /></button>
                  )}
                </h1>"""
)

# Update Location
content = content.replace(
    """<div className="text-sm text-foreground font-medium truncate">
                    {event.location}
                  </div>""",
    """<div className="text-sm text-foreground font-medium truncate flex items-center justify-between">
                    <span>{event.location}</span>
                    {user?.role === "admin" && (
                      <button onClick={() => handleEditField("location", event.location)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                    )}
                  </div>"""
)

# Update Prize Pool
content = content.replace(
    """<div className="text-sm text-emerald-400 font-semibold truncate">
                    {event.prize_pool || "Non-monetary / Certificates"}
                  </div>""",
    """<div className="text-sm text-emerald-400 font-semibold truncate flex items-center justify-between">
                    <span>{event.prize_pool || "Non-monetary / Certificates"}</span>
                    {user?.role === "admin" && (
                      <button onClick={() => handleEditField("prize_pool", event.prize_pool)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                    )}
                  </div>"""
)

# Update Description
content = content.replace(
    """<h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Event Brief & Objectives
                </h3>""",
    """<h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                  Event Brief & Objectives
                  {user?.role === "admin" && (
                    <button onClick={() => handleEditField("description", event.description)} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                  )}
                </h3>"""
)

with open('frontend/app/events/[id]/page.tsx', 'w') as f:
    f.write(content)

