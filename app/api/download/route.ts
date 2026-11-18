import { NextRequest } from 'next/server';
import { proxyMediaStream } from '@/lib/server/stream-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'pinereel-video.mp4';
  const source = req.nextUrl.searchParams.get('source');

  if (!url && !source) {
    return Response.json({ error: 'Missing download url or source parameter' }, { status: 400 });
  }

  return proxyMediaStream(
    url || source || '',
    req.headers.get('range'),
    filename,
    source
  );
}

