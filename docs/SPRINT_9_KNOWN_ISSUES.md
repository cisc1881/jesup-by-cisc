# Sprint 9 Known Issues

**Last updated:** July 10, 2026  
**Release target:** `v1.0.0-beta.2`

---

## Deferred features (by design)

| Issue | Impact | Workaround | Priority | Target |
|-------|--------|------------|----------|--------|
| QR camera scanner for check-in | Admins use manual check-in or ticket code | Use attendance page manual check-in | Medium | V1.1 |
| AI-generated report narrative | Admins enter narrative fields manually | Use Event Reports narrative section | Low | V1.2+ |
| Server-generated PDF | Browser print-to-PDF only | Print report from `/admin/reports/events` | Low | V1.2+ |
| Email delivery / evaluation reminders | In-app notifications only | Manual follow-up with participants | Medium | V1.1 |
| 2FAS student portal (`/me/2fas`) | Students cannot view milestone progress in app | Admin communicates status manually | Medium | V1.2 |

---

## Data and reporting

| Issue | Impact | Workaround | Priority | Target |
|-------|--------|------------|----------|--------|
| Event deletion removes reporting history | Deleting event cascades attendance, evaluations, gallery, snapshots | Export report CSV before deleting; finalize snapshots first | High | V1.1 |
| Multi-event unique participant counts | Totals are registration-based, not deduplicated people | Read UI note; use email-based estimate only | Low | V1.1 |
| Report snapshots store JSON metrics | Large multi-event snapshots may grow over time | Archive old finals; export CSV | Low | V1.2 |

---

## Security and privacy

| Issue | Impact | Workaround | Priority | Target |
|-------|--------|------------|----------|--------|
| Public-read `event-images` bucket | Unapproved submission URLs guessable if leaked | Do not share pending URLs; approve/reject promptly | Medium | V1.1 |
| CMS HTML not sanitized | XSS risk if admin account compromised | Trust admin editors only | Medium | V1.1 |
| `create_admin_notification` open to authenticated | Notification spam possible | Monitor notification center | Low | V1.1 |
| Anonymous evaluation resubmit | Same session can overwrite answers | Accept for beta; monitor completion counts | Low | V1.1 |

---

## UX and accessibility

| Issue | Impact | Workaround | Priority | Target |
|-------|--------|------------|----------|--------|
| Admin tables horizontal scroll (some modules) | Mobile admin less ergonomic | Use Events/2FAS card layouts as model | Low | V1.1 |
| Grants in universal search lack active filter | Inactive grants may appear in search | Admin deactivates via content management | Low | V1.1 |
| Event detail 404 semantics | Missing event shows soft message vs `notFound()` | Verify slug before sharing links | Low | V1.1 |
| Legacy "CISC Connect" branding (some pages) | Inconsistent metadata | Use JESUP-branded routes for demos | Low | V1.1 |

---

## Manual QA still pending

| Area | Notes |
|------|-------|
| Full browser regression on production | Run `SPRINT_9_DEMO_SCRIPT.md` on staging |
| 320px device physical testing | Emulated in devtools; confirm on hardware |
| Email notification end-to-end | Not implemented |
| Production migration apply | Dev verified; prod pending ops confirmation |

---

## Accepted for beta release

The issues above are **documented and accepted** for `v1.0.0-beta.2` unless marked High with a pre-demo workaround required.
