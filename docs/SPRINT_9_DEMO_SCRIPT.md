# Sprint 9 Demo Script

**Audience:** CISC leadership, Extension partners  
**Duration:** ~25 minutes  
**Environment:** Staging or development with seeded demo data  
**Fallback:** Each step includes an alternative if live data is unavailable

---

## Prerequisites

- [ ] Admin account with `user_roles.role = 'admin'`
- [ ] At least one **published** event with registration open
- [ ] Native evaluation configured and open for that event
- [ ] At least one open 2FAS internship (`is_2fas = true`, `is_open = true`)
- [ ] Demo attendee account (non-admin) signed in on second device/browser

---

## Demo flow

### 1. Open JESUP
- Navigate to home `/`
- **Show:** Featured programs, events, mobile bottom navigation
- **Fallback:** Explain content sections even if sparse; open Programs list

### 2. Browse programs and events
- Open a program detail `/programs/$slug`
- Open event detail `/events/$id`
- **Show:** Registration panel, agenda, speakers, gallery (if approved images exist)
- **Fallback:** Use BTW Summit or any published event slug from admin list

### 3. Submit public inquiry
- Go to `/join`
- Complete inquiry form with consent checked
- **Show:** Success confirmation and reference message
- **Fallback:** Show pre-submitted inquiry in admin queue instead

### 4. Show admin notification
- Sign in as admin → Command Center `/admin`
- Open notification bell
- **Show:** New inquiry notification
- **Fallback:** Open `/admin/inquiries` directly and filter status = new

### 5. Review and assign inquiry
- `/admin/inquiries` → open inquiry
- Assign to self, add internal note (admin-only), update status
- **Show:** Notes not visible to public user

### 6. Register for event
- As demo attendee on event page → Register
- **Show:** Confirmation, ticket/registration state on event page
- **Fallback:** Use pre-registered demo account

### 7. Check in attendee
- Admin → `/admin/events/$eventId/attendance`
- Find registration → mark checked in
- **Show:** Status change, summary cards update
- **Fallback:** Use ticket code manual check-in field

### 8. Add walk-in
- Same attendance page → Add walk-in dialog
- Enter name, optional demographics (collapsed)
- **Show:** Walk-in appears in list and summary
- **Fallback:** Explain walk-in row already seeded

### 9. Complete evaluation
- As attendee → `/events/$id/evaluation` (or Evaluation CTA on event page)
- Submit native evaluation form
- **Show:** Thank-you / completion state
- **Fallback:** Show completed response in admin evaluations list

### 10. Show demographic aggregates
- Admin → attendance or evaluations page
- Scroll to demographic aggregate cards
- **Show:** “Fewer than 5” suppression for small cells
- **Fallback:** Explain privacy rule if no demographic data yet

### 11. Submit participant photo
- As attendee on event detail → “Share a photo”
- Confirm permission checkbox, upload image
- **Show:** Pending confirmation message
- **Fallback:** Use existing pending submission in moderation queue

### 12. Approve photo
- Admin → `/admin/events/gallery`
- Review pending submission → approve with caption/alt text
- **Show:** Approved status; image appears on public event gallery after refresh
- **Fallback:** Show already-approved gallery image on event page

### 13. Generate event report
- Admin → `/admin/reports/events`
- Select event (or multi-event + date filter)
- **Show:** Summary cards, attendance chart, demographic section
- **Fallback:** Select date range covering seeded events

### 14. Save draft
- Enter narrative fields (report title, purpose, recommendations)
- Click **Save draft**
- **Show:** Draft appears in saved drafts list
- **Fallback:** Explain snapshot feature if migration unavailable

### 15. Finalize and print report
- Click **Finalize** on saved draft
- Click **Print report** → Save as PDF
- **Show:** Admin controls hidden in print preview; JESUP branding visible
- **Fallback:** Scroll printable preview on screen

### 16. Show 2FAS open eligibility
- `/internships` → filter or highlight 2FAS opportunities
- Open application form for open internship
- **Show:** Institution picker with 1890 land-grant institutions
- **Fallback:** `/admin/internships` to show `is_2fas` and `is_open` flags

---

## Closing talking points

- End-to-end engagement: inquiry → registration → attendance → evaluation → reporting
- Privacy by design: demographics aggregate-only, anonymous evaluations unlinkable
- Extension-ready documentation: printable reports and CSV exports for leadership
- Beta scope: QR scanner and AI narrative on roadmap, not in this release

---

## Quick recovery phrases

| If this fails… | Say… |
|----------------|------|
| Empty gallery | “Participant submissions are moderated before public display.” |
| No demographics | “All demographic fields are optional; aggregates appear after sufficient responses.” |
| Evaluation closed | “Evaluations open after the event window configured by staff.” |
| Report draft error | “Live metrics still work; snapshots require the reporting migration.” |
