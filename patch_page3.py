with open('frontend/app/events/[id]/page.tsx', 'r') as f:
    content = f.read()

# Fix the handler function
old_handler = """  const handleEditField = async (field: string, currentValue: string) => {
    const newValue = prompt(`Enter new ${field}:`, currentValue)
    if (newValue && newValue !== currentValue) {
      try {
        await api.updateEventAdmin(Number(eventId), { [field]: newValue })
        fetchEvent()
      } catch (err: any) {
        alert(err.message)
      }
    }
  }"""

new_handler = """  const updateField = async (field: string, newValue: string) => {
    try {
      await api.updateEventAdmin(Number(eventId), { [field]: newValue })
      fetchEvent()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleEditField = async (field: string, currentValue: string) => {
    const newValue = prompt(`Enter new ${field}:`, currentValue)
    if (newValue && newValue !== currentValue) {
      updateField(field, newValue)
    }
  }"""

content = content.replace(old_handler, new_handler)

# Fix the manual prompt cases
content = content.replace('handleEditField("mode", newMode)', 'updateField("mode", newMode)')
content = content.replace('handleEditField("max_team_size", newSize)', 'updateField("max_team_size", newSize)')
content = content.replace('handleEditField("start_date", newStart)', 'updateField("start_date", newStart)')
content = content.replace('handleEditField("end_date", newEnd)', 'updateField("end_date", newEnd)')

with open('frontend/app/events/[id]/page.tsx', 'w') as f:
    f.write(content)
