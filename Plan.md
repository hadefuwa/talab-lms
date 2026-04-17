---

# Project: Talab LMS (v2.7 - The Definitive Plan)

## Phase 0: The "Founder-First" Prototype
**Primary Objective:** Deploy a private, high-performance version of Talab LMS for personal curriculum testing.
* **Auth:** Google OAuth via Supabase for instant access.
* **AI:** Integrated **Gemini API** chatbot for "Lesson Assistance."
* **Storage:** **Cloudflare R2** for proprietary video/PDF assets.
* **Billing:** Mocked for Sprint 1 (manual `is_active` toggle).

---

## I. Macro: The Strategic Vision
### 1. The Core Philosophy: "Shared Content / Isolated Progress"
Talab LMS is a **Content-as-a-Service (CaaS)** platform.
* **The Founder:** Sole source of curriculum; total control over the `courses` and `lessons` tables.
* **Parents:** Local admins who manage their own "Organization" (family) and track their own kids.
* **Security:** Intellectual Property is protected by an "Edge Bouncer" (Cloudflare Worker).

---

## II. Micro: The Technical Blueprints

### 1. The Data Model (ERD)
This is the foundational schema your devs need to ensure multi-tenancy works from Day 1.

| Table | Purpose | Fields |
| :--- | :--- | :--- |
| **`organizations`** | Family unit | `id`, `name`, `subscription_status`, `stripe_customer_id` |
| **`profiles`** | User Identity | `id`, `org_id`, `role` (founder, parent, student), `full_name` |
| **`courses`** | Global Subject | `id`, `title`, `subject_category`, `is_published` |
| **`lessons`** | Global Content | `id`, `course_id`, `r2_key` (filename), `content_body` |
| **`progress_logs`** | Private Data | `id`, `student_id`, `lesson_id`, `org_id`, `status` |

### 2. The "Edge Gatekeeper" Logic
To protect your R2 assets, the Worker handles requests as follows:
1. **Validate JWT:** Is the user logged in via Google?
2. **Check Subscription:** Is their `organization.subscription_status` active?
3. **Check Role:** Is a student trying to access a lesson they are enrolled in?
4. **Sign URL:** If yes, generate a **60-second Presigned R2 URL**.

### 3. Detailed Security (RBAC)
We avoid hardcoding UIDs by using **Supabase Role Claims**:
* **Founder Role:** Has `ALL` permissions on `courses` and `lessons`.
* **Parent/Student Roles:** Have `SELECT` only on `courses`.
* **Tenant Isolation:** All `progress_logs` queries are restricted by `RLS`: `WHERE org_id = auth.jwt().org_id`.

### 4. AI Integration (Gemini)
* A Cloudflare Worker acts as a proxy to the **Gemini API**.
* **Context Injection:** When a student asks a question, the app sends the current lesson's text to Gemini as "context" so the AI stays relevant to your curriculum.

---

## III. Execution Roadmap

### Sprint 1: The Secure Foundation
* **Goal:** Founder logs in via Google, plays an R2 video, and checks off a lesson.
* **Tasks:** * Setup Supabase Auth + Schema.
    * Deploy "Gatekeeper" Worker with **HTTP 206 (Range Request)** support for video scrubbing.
    * Integrate Gemini Sidebar.
* **Success Metric:** Video plays securely (no direct R2 access); progress persists.

### Sprint 2: The Parent/Billing Portal
* **Goal:** Enable subscriptions and multi-student management.
* **Tasks:**
    * Stripe Webhook implementation with **Idempotency** (the `stripe_events` table).
    * Parent Dashboard for inviting students.

---

## IV. Non-Goals
* **No SCORM (v1):** Use Video + Native Next.js Quizzes for now.
* **No Manual Grading:** Everything is auto-tracked or completion-based.
* **No Native App:** Mobile-optimized PWA strategy.

---

### Candid Note for the Devs
> "This is a **Security-First, Lean Prototype**. 
> 1. Use **Google OAuth** for Auth. 
> 2. Use **Cloudflare R2** for all proprietary videos—the Worker must sign URLs and support **Range Requests** for smooth 4K playback. 
> 3. Integrate **Gemini API** for the chatbot. 
> 4. Do not hardcode my UID; use a `role` column in the `profiles` table. 
> Our motto is: **Fast at the Edge, Secure at the Database.**"

