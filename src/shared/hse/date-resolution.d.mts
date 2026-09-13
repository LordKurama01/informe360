export type UserDueResolution = { source: 'user_explicit'; raw: string; iso: string };
export function resolveUserDueText(text: string, now?: Date): UserDueResolution | null;
