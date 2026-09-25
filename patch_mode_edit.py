with open('frontend/app/events/[id]/page.tsx', 'r') as f:
    content = f.read()

old_mode = """<span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    {event.mode.replace("_", " ")}
                  </span>"""

new_mode = """<span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                    {event.mode.replace("_", " ")}
                    {user?.role === "admin" && (
                      <button onClick={() => {
                        const newMode = prompt("Enter new mode (virtual, in_person, hybrid):", event.mode);
                        if (newMode && ["virtual", "in_person", "hybrid"].includes(newMode) && newMode !== event.mode) {
                          handleEditField("mode", newMode);
                        } else if (newMode && !["virtual", "in_person", "hybrid"].includes(newMode)) {
                          alert("Invalid mode. Must be virtual, in_person, or hybrid.");
                        }
                      }} className="ml-1 text-emerald-400/70 hover:text-emerald-400"><Edit2 className="size-3" /></button>
                    )}
                  </span>"""

content = content.replace(old_mode, new_mode)

old_team_size = """<span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">
                    Max Team Size: {event.max_team_size}
                  </span>"""

new_team_size = """<span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded">
                    Max Team Size: {event.max_team_size}
                    {user?.role === "admin" && (
                      <button onClick={() => {
                        const newSize = prompt("Enter new max team size:", event.max_team_size.toString());
                        if (newSize && !isNaN(Number(newSize)) && newSize !== event.max_team_size.toString()) {
                          handleEditField("max_team_size", newSize);
                        }
                      }} className="ml-1 text-muted-foreground hover:text-foreground"><Edit2 className="size-3" /></button>
                    )}
                  </span>"""

content = content.replace(old_team_size, new_team_size)

with open('frontend/app/events/[id]/page.tsx', 'w') as f:
    f.write(content)
