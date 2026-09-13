# HSE Copilot — WhatsApp Field Copilot

Date: 2026-09-13

## Product decision

WhatsApp is a field channel for HSE Copilot, not a second product and not a second source of truth. App, WhatsApp and web must operate on the same Informe360 findings, evidence, reminders and audit trail.

## Primary user flow

1. A linked HSE user sends text, audio or photo to the configured WhatsApp Business number.
2. Meta sends the event to the Informe360 webhook.
3. Informe360 verifies the webhook signature, normalizes the message and resolves the WhatsApp identity to an HSE user, organization and optional active site/context.
4. Audio is downloaded from Meta and transcribed by the existing HSE transcription router. Images use the existing HSE vision router. Text goes directly to the intent router.
5. The HSE assistant classifies the request and builds a command.
6. Read-only queries, notes, reminders and context changes can execute directly when safe. Creating an official finding, materially changing one, or closing/cancelling requires confirmation.
7. The resulting record is written to the same Supabase data model used by the app and appears there immediately.
8. Original WhatsApp message/media, transcript, interpretation, confirmation and execution result remain auditable.

## Initial intents

- CREATE_FINDING
- UPDATE_FINDING
- ADD_EVIDENCE
- CREATE_REMINDER
- RESCHEDULE_REMINDER
- QUERY_PENDING
- QUERY_FINDINGS
- FIELD_NOTE
- SET_CONTEXT
- CLOSE_FINDING
- DAILY_SUMMARY
- QUERY_PROCEDURE

The first production slice must fully support CREATE_FINDING, CREATE_REMINDER, QUERY_PENDING, SET_CONTEXT and confirmation/cancellation. Other intents may respond safely as unsupported until their executor is implemented; they must never fabricate an action.

## Confirmation policy

### Direct execution

- create a personal operational reminder
- save a field note
- set active context
- read/query own organization data

### Explicit confirmation

- create an official finding
- materially update a finding
- add evidence to an official record when association is inferred rather than explicit

### Reinforced confirmation

- close, cancel or delete an official finding/action
- any operation with destructive/audit significance

The assistant must never invent legal/regulatory deadlines. Operational dates explicitly stated by the user may be resolved using the existing date-resolution logic.

## Architecture

```text
WhatsApp Cloud API
       |
       v
/api/hse/channels/whatsapp
       |
       +--> signature verification / normalization / idempotency
       |
       v
Identity Resolver ----> channel identity + organization + site/context
       |
       v
Media Router ----------> existing transcribeAudio / analyzeImage
       |
       v
Intent Router
       |
       v
Command Processor
       |
       +--> findings / smart_actions / reminders / evidence
       +--> conversation context
       +--> channel audit
       |
       v
Supabase (single source of truth)
       |
       +--> App
       +--> Web
       +--> WhatsApp replies/reminders
```

## Reuse from Prestige/OpenBSP

Reuse the proven Meta transport concepts from `LordKurama01/prestige-ai-reception`:

- WhatsApp webhook payload normalization
- provider message IDs as idempotency keys
- text/audio/image/document parsing
- Graph API outbound messaging
- provider/account/phone-number separation
- existing Meta onboarding/Embedded Signup strategy for future multi-tenant provisioning

Do not couple HSE business logic to the Prestige database. Informe360 owns HSE identity, context, commands, findings and reminders. The same Meta app/provider credentials may be reused where permitted, but secrets remain server-only.

## Data model additions

- `hse_channel_identities`: links provider/account/external WhatsApp user to HSE user + org + default/active site.
- `hse_channel_messages`: immutable-ish channel audit for inbound/outbound messages and media metadata.
- `hse_assistant_commands`: proposed/confirmed/executed/rejected command audit, payload and result references.
- `hse_conversation_contexts`: active field/site/finding context per channel identity.
- extend `reminders` to allow operational free reminders and `whatsapp` as a channel while preserving existing linked reminders.

All new public tables use RLS. Channel audit/commands are writable only server-side. Authenticated users can read rows only through organization membership where product UX needs it. No service-role secret is exposed to mobile/web clients.

## Calendar

Informe360 reminders are the source of truth. Google Calendar is an optional projection/sync target, never the canonical store. A reminder must remain valid if Google is disconnected.

## Media and evidence

Original WhatsApp media must be downloaded server-side using Meta credentials. For a confirmed finding, media is persisted into the existing HSE evidence/storage model and associated with the created finding where appropriate. The original message/transcript is retained in channel audit metadata.

## Security

- HTTPS endpoint only.
- GET webhook verification token check.
- POST `X-Hub-Signature-256` HMAC verification with Meta app secret.
- idempotency by provider message ID.
- only linked identities may execute HSE commands.
- membership and site ownership are revalidated server-side before execution.
- confirmation tokens expire and are scoped to one identity/command.
- service-role key is server-only.
- no normative/legal deadline can be inferred by AI.

## Pilot success criteria

From Luis's WhatsApp:

1. Send audio: “La amoladora está hecha mierda en el taller cerca del banco, que lo vea electricidad mañana.”
2. System transcribes and proposes a finding with location, element, responsible party and operational due date.
3. Luis confirms in WhatsApp.
4. Finding + action + reminder appear in Informe360.
5. `¿Qué tengo pendiente?` returns open/overdue work for the linked organization.
6. `Estoy en Equipo 14` changes context; subsequent messages inherit that context without inventing data.
7. Duplicate Meta delivery does not duplicate records.
8. Audit shows original message, transcript, proposed command, confirmation and result.
