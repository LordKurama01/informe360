import type { TrackingEventName } from '@/config/tracking-events';

export interface TrackingEventPayload {
  name: TrackingEventName | string;
  userId?: string;
  sessionId?: string;
  source?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}
