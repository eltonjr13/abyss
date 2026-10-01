export function canStartDive(access: {
  userId: string | null;
  accountId: string | null;
  verified: boolean;
  authLoading: boolean;
  authBusy: boolean;
  connected: boolean;
  syncBusy: boolean;
}): boolean {
  return Boolean(access.userId && access.userId === access.accountId && access.verified &&
    !access.authLoading && !access.authBusy && access.connected && !access.syncBusy);
}
