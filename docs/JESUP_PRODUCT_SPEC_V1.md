# JESUP Product Specification v1.0

**Document status:** Master reference  
**Version:** 1.0  
**Last updated:** July 2026  
**Owner:** Carver Integrative Sustainability Center (CISC), Tuskegee University Cooperative Extension Program

---

## 1. Product Overview

| Field | Value |
|-------|-------|
| **App name** | JESUP |
| **Subtitle** | The Digital Extension Wagon |
| **Powered by** | Carver Integrative Sustainability Center (CISC) |
| **Website** | [cisc1881.org](https://cisc1881.org) |
| **Institution** | CISC is part of the Tuskegee University Cooperative Extension Program |
| **Founder / Director** | Dr. Raymon Shange |
| **Associate Director** | Franklin Quarcoo |

JESUP is the public-facing digital platform developed by CISC to connect communities with Cooperative Extension education, research, programs, and resources. It serves as a modern extension of Tuskegee’s historic commitment to reaching people where they are—on the farm, in the classroom, and in the community.

The platform is designed to scale for years: supporting future mobile apps, AI services, reporting tools, and field-based Extension workflows while remaining CMS-driven and mobile-first from day one.

---

## 2. Mission

JESUP modernizes the historic **Jesup Wagon** concept—the mobile education unit George Washington Carver used to bring agricultural knowledge directly to farmers and communities.

Where the original wagon carried seeds, tools, and demonstrations across rural Alabama, JESUP carries Extension education into the palm of every user’s hand. The platform delivers:

- **Programs** — Cooperative Extension offerings across agriculture, sustainability, and community development
- **Research & publications** — Factsheets, reports, bulletins, and multimedia resources
- **Events & workshops** — Trainings, conferences, field days, and community gatherings
- **Farmers markets** — Local food access, vendor directories, and market discovery
- **Surveys** — Community input and program evaluation via Qualtrics integration
- **Internships & 2FAS** — Student pipeline development from high school through graduate study
- **Podcasts** — Audio storytelling and Extension outreach
- **Partners, grants, equipment, and donations** — Community resources and institutional support

JESUP exists to make Extension **accessible, discoverable, and actionable**—for farmers, students, agents, faculty, partners, and the public.

---

## 3. Brand Direction

JESUP should feel like a **premium mobile application**, not a traditional university website. The visual language draws from best-in-class consumer products while honoring Tuskegee’s heritage.

### Color palette

| Role | Direction |
|------|-----------|
| **Primary** | Crimson gradient — deep Tuskegee crimson with rich tonal depth |
| **Neutrals** | White, gray, and light gray for clarity and breathing room |
| **Accent** | Gold — warm, metallic, jewelry-quality (gold watch or necklace tone) |

### Typography

- Simple, highly legible, modern sans-serif
- Strong hierarchy: bold headlines, clean body text, subtle eyebrow labels
- Generous tracking on display type; comfortable reading on mobile

### Experience principles

- **Mobile-first** — Designed for phones first; scales gracefully to tablet and desktop
- **Premium feel** — Large imagery, glass surfaces, smooth animations, horizontal carousels
- **Inspiration** — Apple (clarity), Nike (energy), Airbnb (discovery), Spotify (media), and modern generation-native apps
- **Accessibility** — High contrast, readable type, touch-friendly targets, semantic structure

### Design system

All public and admin surfaces use a shared JESUP design system: crimson panels, gold dividers, glass cards, lift shadows, pull-to-refresh, skeleton loaders, and consistent component patterns across modules.

---

## 4. Core Users

JESUP serves a diverse ecosystem of stakeholders across Alabama and beyond.

| User group | Primary needs |
|------------|---------------|
| **Farmers / producers** | Market discovery, publications, events, equipment, food access resources |
| **Students** | Programs, internships, 2FAS, events, career pathways |
| **High school students** | 2FAS high school track, introductory programs, summer opportunities |
| **Undergraduate students** | 2FAS undergraduate track, internships, research, events |
| **Graduate students** | 2FAS graduate track, fellows/interns, advanced research, grants |
| **Extension agents** | Program promotion, event management, community outreach tools |
| **CISC staff** | Content management via JESUP Command Center |
| **Faculty / researchers** | Publications, grants, program visibility, survey data |
| **Community partners** | Partner profiles, co-hosted events, program linkages |
| **Donors** | Donation pathways, impact visibility, program support |
| **Public visitors** | Discovery of programs, markets, events, and Extension resources |

---

## 5. Core Modules

Each module is self-contained with routes, components, services, database access, types, and—where applicable—admin pages in the JESUP Command Center.

| Module | Description | Public route | Admin route |
|--------|-------------|--------------|-------------|
| **Home dashboard** | Hero carousel, featured content, quick actions, impact stats | `/` | — |
| **Programs** | Cooperative Extension program directory and detail pages | `/programs` | `/admin/programs` |
| **2FAS** | Future Farmers and Agricultural Specialists student development | `/programs/2fas`, `/internships` | `/admin/internships` |
| **Events / workshops** | Calendar, map, registration, detail pages | `/events` | `/admin/events` |
| **Farmers markets** | Market directory, map, vendors, products, favorites | `/markets` | `/admin/markets` |
| **Publications** | Factsheets, reports, magazines, bulletins, videos | `/publications` | `/admin/publications` |
| **Grants** | Funding opportunities and grant directory | `/grants` | `/admin/grants` |
| **Surveys / Qualtrics** | Survey links and community feedback | `/surveys` | `/admin/surveys` |
| **Equipment checkout** | Inventory browsing and checkout requests | `/equipment` | `/admin/equipment` |
| **Partners** | Community and organizational partner directory | `/partners` | `/admin/partners` |
| **Donation** | Giving and support pathways | `/donate` | — |
| **Podcast** | Episode directory and featured audio | `/podcast` | `/admin/podcast` |
| **User profile** | Registrations, applications, checkouts, activity | `/me` | — |
| **JESUP Command Center** | Staff CMS, media library, search, notifications, settings | — | `/admin` |
| **Analytics** | Platform metrics and reporting | — | `/admin/analytics` |
| **Ask JESUP AI** *(future)* | Conversational Extension assistant | TBD | `/admin/settings` (AI config) |

### Platform services (cross-module)

- **Unified CMS** — Images, documents, rich text, tags, categories, featured items, status, SEO, relationships
- **Media library** — Global asset manager reusable across every module
- **Relationship engine** — Connect programs, events, publications, podcasts, partners, grants, and markets without code
- **Global search** — Search across all published content types
- **Notification center** — In-app notifications with future push, email, and SMS support

---

## 6. 2FAS Program

**Future Farmers and Agricultural Specialists (2FAS)** is CISC’s flagship internship and student development program. It prepares the next generation of agricultural leaders, researchers, and Extension professionals through structured pathways from high school through graduate study.

### Tracks

| Track | Audience | Focus |
|-------|----------|-------|
| **High school** | Secondary students | Introduction to agriculture, sustainability, and CISC programming |
| **Undergraduate** | College students | Internships, field experience, mentorship, and career exploration |
| **Graduate** | Master’s and doctoral students | Advanced research, policy, and Extension leadership |
| **Graduate fellows / interns** | Selected graduate participants | Deep research engagement, program delivery, and pipeline development |

### Platform capabilities (current & planned)

| Capability | Status |
|------------|--------|
| Program visibility on JESUP home and programs pages | Live |
| Internship listings and public application flow | Live |
| Application intake (resume, contact, status) | Live |
| Admin review and status management | Live |
| Mentor assignment and tracking | Phase 2 |
| Structured evaluations | Phase 2 |
| Progress tracking dashboards | Phase 2 |
| Certificates upon completion | Phase 2 |
| 2FAS-dedicated student portal | Phase 2 |

2FAS is both a **program module** and a **long-term talent pipeline** for CISC, Tuskegee Cooperative Extension, and the broader 1890 Land-Grant community.

---

## 7. Technical Stack

| Layer | Technology | Role |
|-------|------------|------|
| **Prototype / foundation** | Lovable | Rapid prototyping and initial scaffolding |
| **Production development** | Cursor | Production cleanup, architecture, and ongoing development |
| **Framework** | TanStack Start | Full-stack React with file-based routing and SSR |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui | Component library and styling |
| **Database** | Supabase / PostgreSQL | Primary data store with migrations and RLS |
| **Authentication** | Supabase Auth | User sign-in, sessions, role-based access |
| **File storage** | Supabase Storage | Images, documents, audio, and media library assets |
| **Maps** | Google Maps (embed + directions) | Market and event location services |
| **AI** *(future)* | OpenAI / Anthropic API | Ask JESUP AI, content generation, summarization |
| **Notifications** *(future)* | Firebase Cloud Messaging | Push notifications for events, markets, and 2FAS |

### Architecture

- **Modular platform** — `src/modules/` with domain barrels (programs, events, markets, publications, etc.) and shared platform services (CMS, admin, notifications, settings)
- **CMS-driven** — No hardcoded content; all public surfaces read from Supabase
- **Reusable design system** — `src/components/design-system/` shared across public and admin
- **Preserved routes** — Public URLs remain stable across refactors

---

## 8. Security Model

JESUP follows a defense-in-depth approach aligned with Supabase best practices.

### Access tiers

| Tier | Who | What they can do |
|------|-----|------------------|
| **Public (anonymous)** | Any visitor | Read published/active content only |
| **Authenticated** | Signed-in users | Register for events, submit applications, request equipment checkouts, save favorites |
| **Admin** | CISC staff with `admin` role | Full JESUP Command Center access |

### Implementation

- **Row Level Security (RLS)** — Enforced on all tables; public policies filter to `is_active`, `is_published`, or `status = published` as appropriate
- **`user_roles` table** — Maps users to roles (`admin`, `user`)
- **`has_role()` function** — SECURITY DEFINER RPC used in RLS policies; `GRANT EXECUTE` to `anon` and `authenticated` for policy evaluation
- **Admin route guard** — `beforeLoad` checks auth + admin role; redirects to `/unauthorized` if insufficient
- **Environment variables** — Supabase URL, anon key, and service credentials stored in `.env`; never committed to version control
- **Storage policies** — Bucket-level RLS; public read for published assets; admin write for uploads

### Data protection principles

- Users can only read and update their own registrations, applications, and checkouts
- Admin operations require verified `admin` role
- Sensitive admin RPCs use SECURITY DEFINER with explicit grants
- Future AI integrations will use server-side API keys only

---

## 9. Admin / JESUP Command Center

The **JESUP Command Center** is the staff-facing CMS and operations hub. It replaces the legacy “Admin Dashboard” naming throughout the application.

### Command Center sections

| Section | Capabilities |
|---------|-------------|
| **Dashboard** | Widget overview — counts for all modules, registrations, pending approvals |
| **Content** | Programs, events, markets, publications, podcasts, partners, grants |
| **Operations** | Internships / 2FAS, equipment, surveys, donations, users |
| **Platform** | Analytics, media library, global search, notifications, settings |

### What CISC staff can manage

- **Programs** — Categories, cover images, rich descriptions, related content, featured status
- **Events** — Agenda, speakers, gallery, registration, surveys, location/map coordinates
- **Publications** — Content types, PDFs, cover images, categories, related programs/events
- **Markets** — Vendors, products, hours, photos, announcements, SNAP/EBT, map coordinates
- **Grants** — Funding opportunities, deadlines, descriptions
- **Equipment** — Inventory, checkout requests, approval workflow
- **Internships / 2FAS** — Listings, application review, status management
- **Podcasts** — Episodes, covers, guests, publish status
- **Partners** — Logos, descriptions, publish status
- **Surveys** — Qualtrics links and survey metadata
- **Donations** — Public donation page (managed via settings/navigation)
- **Users** — Profile review and role management
- **Analytics** — Platform-wide metrics across all modules
- **Settings** — Organization profile, brand assets, homepage, navigation, Google Maps, Qualtrics, AI, email, storage

### Platform tools

- **Media library** — Upload and reuse images, videos, PDFs, audio, logos, and documents globally
- **Relationship engine** — Attach programs, events, publications, podcasts, partners, and grants to any content item
- **Global search** — Find any published content from a single admin search page
- **Notification center** — Create in-app notifications; future channels for push, email, and SMS

---

## 10. Roadmap

### MVP *(current foundation)*

| Feature | Status |
|---------|--------|
| Authentication (Supabase Auth) | ✅ Live |
| Programs (public + admin) | ✅ Live |
| Publications (public + admin) | ✅ Live |
| Events (public + admin + registration) | ✅ Live |
| Farmers markets (public + admin + map) | ✅ Live |
| Equipment checkout (public + admin) | ✅ Live |
| Surveys (public + admin) | ✅ Live |
| Partners (public + admin) | ✅ Live |
| Donation page | ✅ Live |
| Podcast (public + admin) | ✅ Live |
| JESUP Command Center (admin management) | ✅ Live |
| Modular platform architecture | ✅ Live |
| Media library, global search, settings scaffold | ✅ Live |

### Phase 2 — Engagement & pipeline

| Feature | Description |
|---------|-------------|
| **2FAS student management** | Full student portal, mentor assignment, evaluations, progress tracking |
| **Event QR check-in** | On-site attendance verification via QR codes |
| **Certificates** | Automated completion certificates for events and 2FAS |
| **Notifications** | Push, email, and SMS delivery via Firebase and transactional email |
| **Analytics** | Engagement trends, registration funnels, geographic reach, exportable reports |

### Phase 3 — AI & intelligence

| Feature | Description |
|---------|-------------|
| **Ask JESUP AI** | Conversational assistant for Extension questions, program discovery, and resource navigation |
| **Factsheet generator** | AI-assisted drafting of Extension factsheets from research notes |
| **Survey summarizer** | Automated synthesis of Qualtrics response data |
| **Impact report generator** | AI-generated annual impact reports for CISC leadership and stakeholders |
| **Grant assistant** | AI support for grant discovery, drafting, and compliance |

### Phase 4 — Field & mobile

| Feature | Description |
|---------|-------------|
| **Mobile app store release** | Native iOS and Android apps via React Native or Capacitor wrapper |
| **Offline publications** | Download factsheets and bulletins for field use without connectivity |
| **Push notifications** | Real-time alerts for events, market days, 2FAS deadlines, and weather |
| **Field tools** | Agent-facing tools for on-site data collection and demonstration logging |
| **Shelf-life & food safety guidance** | Interactive tools for producers and consumers on storage and safety |

---

## 11. Product Vision

JESUP should become the **flagship digital Extension ecosystem** for the Carver Integrative Sustainability Center—and a replicable model for other Cooperative Extension and **1890 Land-Grant** programs nationwide.

### Near-term vision (1–2 years)

- A polished, mobile-first platform that CISC staff manage entirely through the Command Center
- Every program, event, market, and publication connected through the relationship engine
- 2FAS operating as a fully tracked student pipeline from application through completion
- Measurable community impact through analytics and survey integration

### Long-term vision (3–5 years)

- **Ask JESUP AI** serving as a trusted Extension companion—answering farmer questions, guiding students to programs, and helping agents in the field
- Native mobile apps with offline capability for rural connectivity challenges
- Open architecture that other 1890 institutions can adopt, adapt, and extend
- A documented, CMS-driven platform that grows for decades without rewrites

### Why it matters

George Washington Carver believed that education must travel to the people. Booker T. Washington built Tuskegee on the principle of learning by doing. The Jesup Wagon carried that spirit into every county.

**JESUP carries it into every pocket.**

From a farmer checking which market accepts SNAP/EBT, to a high school student discovering the 2FAS program, to an Extension agent publishing tomorrow’s workshop—JESUP is the Digital Extension Wagon for a new generation.

---

## Document control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | July 2026 | CISC / JESUP development team | Initial master reference |

**Related documents**

- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Database Design](./DATABASE_DESIGN.md)
- [Design System](./DESIGN_SYSTEM.md)
- [API Specification](./API_SPECIFICATION.md)
- [Development Roadmap](./DEVELOPMENT_ROADMAP.md)
- [AI Roadmap](./AI_ROADMAP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

*JESUP · The Digital Extension Wagon · Powered by CISC · Tuskegee University Cooperative Extension Program*
