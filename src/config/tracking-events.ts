export const TrackingEventNames = {
  PageView: 'page_view',
  WhatsAppClick: 'whatsapp_click',
  FounderOfferView: 'founder_offer_view',
  SignupStarted: 'signup_started',
  SignupCompleted: 'signup_completed',
  Login: 'login',
  ReportCreated: 'report_created',
  GeminiStarted: 'gemini_generation_started',
  GeminiCompleted: 'gemini_generation_completed',
  GeminiFailed: 'gemini_generation_failed',
  PdfExported: 'pdf_exported',
  SmartActionCreated: 'smart_action_created',
  CalendarEventCreated: 'calendar_event_created',
  PaymentRegistered: 'payment_registered',
  PlanActivated: 'plan_activated',
  FeedbackReceived: 'feedback_received',
  EvidenceAdded: 'xprize_evidence_added',
  ControlOpened: 'control_opened'
} as const;

export type TrackingEventName = typeof TrackingEventNames[keyof typeof TrackingEventNames];
