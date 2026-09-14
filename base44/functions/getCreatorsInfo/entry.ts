import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const userIds = body?.user_ids;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ creators: {} });
    }

    const uniqueIds = [...new Set(userIds.filter(Boolean))].slice(0, 100);
    const creators = {};

    for (const id of uniqueIds) {
      try {
        const u = await base44.asServiceRole.entities.User.get(id);
        if (u) {
          creators[id] = {
            full_name: u.full_name || '',
            email: u.email || ''
          };
        }
      } catch (e) {
        // skip missing/inaccessible users
      }
    }

    return Response.json({ creators });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}