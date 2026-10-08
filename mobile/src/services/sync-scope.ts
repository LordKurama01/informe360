export type Scope = { userId: string; organizationId: string };
export type QueueRecord = { ownerUserId?: string; workspace: { organizationId: string } };
export function eligibleForSync<T extends QueueRecord>(records: T[], scope: Scope): T[] {
  if (!scope.userId || !scope.organizationId) return [];
  return records.filter(x => x.ownerUserId === scope.userId && x.workspace?.organizationId === scope.organizationId);
}
