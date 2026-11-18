import { NextRequest } from 'next/server';
import { resolveVideoSource } from '@/lib/server/media-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: unknown };
    if (typeof body?.url !== 'string' || body.url.length > 2048) {
      return Response.json(
        { ok: false, error: 'Provide a valid string URL under 2048 characters.' },
        { status: 400 }
      );
    }
    const resolved = await resolveVideoSource(body.url);
    const status = resolved.engine === 'blocked' ? 403 : 200;
    return Response.json(resolved, { status });
  } catch {
    return Response.json(
      { ok: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || url.length > 2048) {
    return Response.json(
      { ok: false, error: 'Missing or oversized url query parameter.' },
      { status: 400 }
    );
  }
  const resolved = await resolveVideoSource(url);
  const status = resolved.engine === 'blocked' ? 403 : 200;
  return Response.json(resolved, { status });
}

