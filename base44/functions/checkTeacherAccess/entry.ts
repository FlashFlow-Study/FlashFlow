import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Checks whether the current user can use teacher features (classrooms, classroom decks).
// Admins always pass. Non-admins pass for now — this is where a payment/subscription
// check will be added when the teacher feature is paywalled.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = user.role === 'admin';

    // --- PAYWALL HOOK ---
    // When the teacher feature is paywalled, check the user's subscription here.
    // Admins bypass the paywall. For non-admins, verify an active subscription
    // (e.g. via Stripe customer portal API) and return can_use_teacher_mode accordingly.
    // For now, everyone has access.
    const hasActiveSubscription = true; // placeholder for future payment check

    const canUseTeacherMode = isAdmin || hasActiveSubscription;

    return Response.json({
      can_use_teacher_mode: canUseTeacherMode,
      is_admin: isAdmin,
      is_teacher: user.data?.is_teacher === true
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}