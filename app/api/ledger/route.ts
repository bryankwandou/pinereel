import { NextRequest } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  PINEREEL_LEDGER_ADDRESS,
  SOLANA_RPC_URL,
} from '@/lib/solana/config';
import type { AttestationPayload, OnChainAttestation } from '@/lib/solana/attestation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CachedEntry {
  expiresAt: number;
  data: {
    slot: number;
    blockHeight: number;
    records: OnChainAttestation[];
    rpcUrl: string;
  };
}

const cache = new Map<string, CachedEntry>();

export async function GET(req: NextRequest) {
  const rawAddr = req.nextUrl.searchParams.get('address') || PINEREEL_LEDGER_ADDRESS;
  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(rawAddr);
  } catch {
    return Response.json({ error: 'Invalid Solana public key address.' }, { status: 400 });
  }

  const addr = pubkey.toBase58();
  const force = req.nextUrl.searchParams.get('refresh') === '1';
  const now = Date.now();
  const hit = cache.get(addr);
  if (!force && hit && hit.expiresAt > now) {
    return Response.json(hit.data);
  }

  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const [slot, blockHeight, sigs] = await Promise.all([
      connection.getSlot('confirmed'),
      connection.getBlockHeight('confirmed'),
      connection.getSignaturesForAddress(pubkey, { limit: 6 }),
    ]);

    const parsedTxs =
      sigs.length > 0
        ? await connection
            .getParsedTransactions(
              sigs.map((s) => s.signature),
              { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }
            )
            .catch(() => sigs.map(() => null))
        : [];

    const records: OnChainAttestation[] = sigs.map((sigInfo, i) => {
      const parsed = parsedTxs[i];
      let rawMemo = sigInfo.memo || '';

      if (!rawMemo && parsed?.transaction?.message?.instructions) {
        for (const ix of parsed.transaction.message.instructions) {
          if ('parsed' in ix && ix.program === 'spl-memo' && typeof ix.parsed === 'string') {
            rawMemo = ix.parsed;
            break;
          }
        }
      }

      const cleaned = rawMemo.replace(/^\[\d+\]\s*/, '').trim();
      let payload: AttestationPayload | null = null;
      if (cleaned.startsWith('{')) {
        try {
          const candidate = JSON.parse(cleaned) as AttestationPayload;
          if (candidate && candidate.app === 'pinereel') {
            payload = candidate;
          }
        } catch {
          payload = null;
        }
      }

      const signer =
        parsed?.transaction?.message?.accountKeys?.[0]?.pubkey?.toBase58() || addr;

      return {
        signature: sigInfo.signature,
        slot: sigInfo.slot,
        blockTime: sigInfo.blockTime ?? null,
        signer,
        payload,
        rawMemo: cleaned || 'Memo data recorded on-chain',
        err: Boolean(sigInfo.err),
      };
    });

    const data = { slot, blockHeight, records, rpcUrl: SOLANA_RPC_URL };
    cache.set(addr, { expiresAt: now + 30_000, data });
    return Response.json(data);
  } catch (err) {
    if (hit) {
      return Response.json(hit.data);
    }
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unable to reach Solana Devnet RPC' },
      { status: 502 }
    );
  }
}

