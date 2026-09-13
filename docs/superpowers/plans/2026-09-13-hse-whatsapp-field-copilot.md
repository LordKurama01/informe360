# HSE WhatsApp Field Copilot — Implementation Plan

## Goal

Deliver a production-ready WhatsApp field channel over the existing HSE Copilot core, with auditable text/audio/image ingestion, safe intent routing, identity resolution, confirmations, findings and reminders, while keeping current production untouched until validation.

## Workstream 1 — Contract and QA

- Add `scripts/check-hse-whatsapp.mjs` as a structural/security contract.
- Add `test:hse:whatsapp` to root QA.
- Assert required webhook/channel/assistant files exist.
- Assert mobile code contains no Meta/provider secrets.
- Assert `.env.example` documents only server-side Meta variables.

## Workstream 2 — Database

Add one additive migration:

- channel identities
- channel messages/audit
- assistant commands
- conversation context
- reminders extension for free operational reminders + WhatsApp channel
- indexes, RLS, explicit grants
- service-role-only transactional RPC for confirmed channel-created finding bundles

No existing table is dropped or renamed.

## Workstream 3 — Meta channel adapter

- payload normalization based on the tested Prestige/OpenBSP implementation
- GET verification
- HMAC SHA-256 POST verification
- media metadata/download
- outbound text messaging
- idempotency by provider message ID

## Workstream 4 — HSE conversational core

- identity resolver
- deterministic intent classifier for high-confidence common commands
- Groq JSON-schema classifier fallback when configured
- operational date parsing through existing HSE date resolver
- safe command processor
- confirmation/cancellation state machine
- context storage

## Workstream 5 — Supported pilot actions

Fully execute:

- CREATE_FINDING (confirmation required)
- CREATE_REMINDER
- QUERY_PENDING
- SET_CONTEXT
- FIELD_NOTE

Safely recognize but do not silently execute unsupported/destructive actions until explicitly implemented.

## Workstream 6 — Runtime

- add env contract for Meta app secret, verify token, access token, phone-number ID and Graph version
- deploy only after CI is green and secrets are configured server-side
- configure Meta webhook callback to `/api/hse/channels/whatsapp`
- link Luis's WhatsApp identity to his HSE user/org/site
- run real audio/text/idempotency E2E

## Verification gates

1. RED: new WhatsApp contract test fails before implementation.
2. GREEN: contract test passes.
3. Root QA success.
4. Supabase security and performance advisors reviewed after migration.
5. Git diff confirms no accidental mobile secrets or unrelated production changes.
6. Real Meta callback verification succeeds.
7. Real inbound text succeeds.
8. Real inbound voice transcribes.
9. Confirmation creates exactly one finding.
10. Duplicate webhook delivery creates no duplicate record.
