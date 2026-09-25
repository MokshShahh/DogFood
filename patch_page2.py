with open('frontend/app/events/[id]/page.tsx', 'r') as f:
    content = f.read()

old_timeline = """<div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Calendar className="size-3" /> Timeline
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}
                  </div>"""

new_timeline = """<div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Calendar className="size-3" /> Timeline
                  </div>
                  <div className="text-sm text-foreground font-medium flex items-center justify-between">
                    <span>
                      {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}
                    </span>
                    {user?.role === "admin" && (
                      <button onClick={() => {
                        const newStart = prompt("Enter new start date (YYYY-MM-DD or YYYY-MM-DDTHH:MM):", event.start_date)
                        if (newStart && newStart !== event.start_date) handleEditField("start_date", newStart)
                        const newEnd = prompt("Enter new end date (YYYY-MM-DD or YYYY-MM-DDTHH:MM):", event.end_date)
                        if (newEnd && newEnd !== event.end_date) handleEditField("end_date", newEnd)
                      }} className="text-muted-foreground hover:text-primary"><Edit2 className="size-3.5" /></button>
                    )}
                  </div>"""

content = content.replace(old_timeline, new_timeline)

with open('frontend/app/events/[id]/page.tsx', 'w') as f:
    f.write(content)
