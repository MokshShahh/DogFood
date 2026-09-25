import re

with open('frontend/app/events/[id]/page.tsx', 'r') as f:
    content = f.read()

# Add import
import_statement = 'import { AdminEventDashboard } from "@/components/admin-event-dashboard"\n'
content = content.replace('import { Button } from "@/components/ui/button"', import_statement + 'import { Button } from "@/components/ui/button"')

# We will replace the whole TEAM PORTAL and EVALUATION ROSTER sections with conditional logic
# Find where the portal starts.
portal_start = content.find('{/* 1. PARTICIPATION & TEAM PORTAL */}')
if portal_start != -1:
    portal_end_str = '</div>\n      </div>\n    </div>\n  )\n}\n'
    portal_end = content.rfind(portal_end_str)
    
    if portal_end != -1:
        extracted_sections = content[portal_start:portal_end]
        
        replacement = """{user?.role === "admin" ? (
            <AdminEventDashboard eventId={Number(eventId)} eventObj={event} refreshEvent={fetchEvent} />
          ) : (
            <>
              """ + extracted_sections + """
            </>
          )}"""
        
        new_content = content[:portal_start] + replacement + content[portal_end:]
        with open('frontend/app/events/[id]/page.tsx', 'w') as f:
            f.write(new_content)
