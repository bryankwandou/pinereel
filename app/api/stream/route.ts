import { NextRequest } from 'next/server';
import { proxyMediaStream } from '@/lib/server/stream-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const source = req.nextUrl.searchParams.get('source');
  if (!url || url.length > 4096) {
    return Response.json({ error: 'Missing or invalid stream url' }, { status: 400 });
  }
  return proxyMediaStream(url, req.headers.get('range'), null, source);
}

