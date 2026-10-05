import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Called after login/registration with a browser fingerprint hash. It records
// the fingerprint for the current user, then checks it against fingerprints
// already marked as belonging to a terminated account. On a match, it bans the
// current account for ban evasion and returns { banned: true } so the client
// can reload into the banned screen.

const EVASION_REASON =
  'You may have used/created an account to avoid enforcement action taken against another account.';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch { /* empty body */ }
    const fingerprintHash = body?.fingerprint_hash;
    if (!fingerprintHash || typeof fingerprintHash !== 'string') {
      return Response.json({ error: 'fingerprint_hash required' }, { status: 400 });
    }

    // Record this device fingerprint for the current user (skip if already stored).
    const mine = await base44.asServiceRole.entities.DeviceFingerprint.filter({
      user_id: user.id,
      fingerprint_hash: fingerprintHash
    });
    if (mine.length === 0) {
      await base44.asServiceRole.entities.DeviceFingerprint.create({
        fingerprint_hash: fingerprintHash,
        user_id: user.id,
        terminated: false
      });
    }

    // Check whether this fingerprint is associated with any terminated account.
    const terminated = await base44.asServiceRole.entities.DeviceFingerprint.filter({
      fingerprint_hash: fingerprintHash,
      terminated: true
    });
    if (terminated.length > 0) {
      await base44.asServiceRole.entities.Ban.create({
        user_id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        reason: EVASION_REASON,
        banned_date: new Date().toISOString(),
        status: 'banned',
        source: 'auto_moderation'
      });
      return Response.json({ banned: true });
    }
    return Response.json({ banned: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}