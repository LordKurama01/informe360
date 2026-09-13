# HSE Copilot Mobile P0 — Design

## Purpose

Build the smallest native mobile product that proves the Informe360 HSE Copilot loop can be sold: field capture → structured finding → due/responsible → reminder → evidence → closure → report reuse.

## Product boundaries

- Native field app: React Native + Expo SDK 57.
- Existing Next.js app remains desktop/reporting and server API surface.
- Supabase project `wvjmsltqrztlvgmayicr` remains the only operational source of truth.
- No parallel database.
- No normative engine in P0 beyond deterministic handling of dates explicitly supplied by the user.
- No AI-generated legal expiry date is authoritative.

## Data flow

1. User signs into mobile with Supabase Auth.
2. Mobile resolves current organization/site.
3. Raw text/audio/photo is persisted first.
4. Server-side AI endpoint optionally transcribes/structures it.
5. User sees a structured draft and confirms/corrects it.
6. Mobile writes finding/action/reminder under RLS.
7. Home calculates Today/Upcoming/Overdue/Closed from persisted data.
8. Evidence uploads to private Storage under `<organization_id>/...`.
9. Close/reopen mutates operational record while preserving original capture.
10. Desktop report flow can link existing findings through `report_findings`.

## AI strategy

### Free-first

- Groq Free Plan for structured extraction and Whisper transcription while limits permit.
- Strict JSON schema on supported Groq models.
- Ollama + Qwen3 4B optional local fallback for text extraction.
- Manual mode if all AI providers are unavailable.

### Provider boundary

`AIProvider` exposes `structureFieldEntry()` and `transcribeAudio()`. Provider choice is server-side/configurable. Mobile never knows Groq/OpenAI/Ollama credentials.

### Safety rule

The AI output may include `dueText` only when that phrase was explicitly present in user input. Final `due_at` is resolved by deterministic application code and confirmed by the user. No field named `normative_due_at` exists in the AI contract.

## Mobile UX

Home is operational, not dashboard-heavy. Primary CTA is `REGISTRAR`. Secondary surfaces are `Hoy`, `Próximos`, `Vencidos`, `Cerrados`, and alerts. Capture supports text first, then audio/photo from the same flow.

## Offline boundary

P0 stores drafts/pending captures locally and offers retry. Full conflict resolution/outbox synchronization is P1.

## Reuse policy

Apache-2.0/MIT repositories may donate patterns/code with attribution. AGPL repositories are benchmark/reference only unless licensing strategy changes explicitly.
