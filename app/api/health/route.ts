import { isYtdlpAvailable } from '@/lib/server/media-resolver';
import { SOLANA_CLUSTER, SOLANA_RPC_URL } from '@/lib/solana/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ytdlp = await isYtdlpAvailable();
  return Response.json({
    ok: true,
    service: 'pinereel',
    ytdlpAvailable: ytdlp,
    solanaCluster: SOLANA_CLUSTER,
    solanaRpc: SOLANA_RPC_URL,
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_COMMIT_SHA || 'local').slice(0, 7),
  });
}

