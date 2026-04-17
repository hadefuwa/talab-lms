# Talab LMS — Project TODO

## In Progress
- [ ] Parent progress dashboard — show each student's lesson completion, quiz scores, and game scores

## Up Next
- [ ] Admin edit/delete for courses and lessons
- [ ] Deploy Cloudflare R2 Gatekeeper Worker and set `GATEKEEPER_WORKER_URL`
- [ ] Course enrollment gate — restrict access to published courses by subscription status

## Backlog
- [ ] Stripe setup — add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs to Vercel env vars
- [ ] Add more custom JS games as lesson types

## Completed ✅
- [x] Sprint 1: Google OAuth, Supabase schema + RLS, progress tracking
- [x] Gemini AI sidebar on lesson pages
- [x] Cloudflare R2 Gatekeeper Worker (code ready, not yet deployed)
- [x] Sprint 2: Family management, student invites
- [x] Stripe billing UI + webhook handler (code ready, keys not yet set)
- [x] Quiz system (builder + player + scoring API)
- [x] PWA manifest + icons
- [x] Game lessons — iframe + postMessage score reporting (Flappy Bird proof-of-concept)
- [x] Live deployment at talab.space via Vercel
