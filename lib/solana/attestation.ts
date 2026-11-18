import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import {
  MEMO_PROGRAM_ID,
  PINEREEL_LEDGER_ADDRESS,
  SOLANA_RPC_URL,
} from './config';

export type TxPhase =
  | { kind: 'idle' }
  | { kind: 'building' }
  | { kind: 'signing' }
  | { kind: 'sent'; signature: string }
  | { kind: 'confirmed'; signature: string }
  | { kind: 'finalized'; signature: string }
  | { kind: 'failed'; message: string; signature?: string; cancelled?: boolean };

export interface AttestationPayload {
  v: 1;
  app: 'pinereel';
  verdict: 'SAFE' | 'CAUTION' | 'BLOCKED';
  score: number;
  kidSafe: boolean;
  source: string;
  urlHash: string;
  mediaHash?: string;
}

export interface OnChainAttestation {
  signature: string;
  slot: number;
  blockTime: number | null;
  signer: string;
  payload: AttestationPayload | null;
  rawMemo: string;
  err: boolean;
}

export function mapTxError(e: unknown): { message: string; cancelled?: boolean } {
  const err = e as { name?: string; message?: string; code?: number; logs?: string[] };
  const text = `${err?.message ?? String(e)} ${(err?.logs ?? []).join(' ')}`.toLowerCase();

  if (
    (err?.name === 'WalletSignTransactionError' && text.includes('reject')) ||
    err?.code === 4001 ||
    text.includes('user rejected') ||
    text.includes('cancelled')
  ) {
    return { message: 'Request was cancelled in your wallet.', cancelled: true };
  }
  if (text.includes('insufficient lamports') || text.includes('no record of a prior credit')) {
    return {
      message: 'Not enough Devnet SOL to pay the network fee. Request test SOL from a Devnet faucet and try again.',
    };
  }
  if (
    err?.name === 'TransactionExpiredBlockheightExceededError' ||
    text.includes('blockhash not found') ||
    text.includes('block height exceeded')
  ) {
    return { message: 'The blockhash expired before confirmation, so nothing was recorded. Try again.' };
  }
  if (text.includes('429') || text.includes('too many requests')) {
    return { message: 'Devnet RPC is rate-limited right now. Wait a few seconds and retry.' };
  }
  return {
    message: 'Transaction did not confirm yet. If an Explorer link is visible, inspect it before retrying.',
  };
}

export function buildMemoTransaction(
  payer: PublicKey,
  payload: AttestationPayload
): Transaction {
  const memoText = JSON.stringify(payload);
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from(memoText, 'utf8'),
  });
  return new Transaction().add(instruction);
}

export async function submitWalletAttestation(
  connection: Connection,
  wallet: WalletContextState,
  payload: AttestationPayload,
  onPhase: (phase: TxPhase) => void
): Promise<void> {
  let signature: string | undefined;
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Connect a Solana Devnet wallet first.');
    }
    onPhase({ kind: 'building' });
    const tx = buildMemoTransaction(wallet.publicKey, payload);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;

    onPhase({ kind: 'signing' });
    const signed = await wallet.signTransaction(tx);

    signature = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
    onPhase({ kind: 'sent', signature });

    const strategy = { signature, blockhash, lastValidBlockHeight };
    const res = await connection.confirmTransaction(strategy, 'confirmed');
    if (res.value.err) {
      throw new Error(`Program returned error: ${JSON.stringify(res.value.err)}`);
    }
    onPhase({ kind: 'confirmed', signature });

    const finalSig = signature;
    connection
      .confirmTransaction(strategy, 'finalized')
      .then(() => onPhase({ kind: 'finalized', signature: finalSig }))
      .catch(() => {
        /* Confirmed state already suffices for UX */
      });
  } catch (e) {
    const mapped = mapTxError(e);
    onPhase({
      kind: 'failed',
      message: mapped.message,
      cancelled: mapped.cancelled,
      signature,
    });
  }
}

export async function fetchDevnetAttestations(
  address = PINEREEL_LEDGER_ADDRESS,
  limit = 10
): Promise<{
  slot: number;
  blockHeight: number;
  records: OnChainAttestation[];
  rpcUrl: string;
}> {
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  const pubkey = new PublicKey(address);

  const [slot, blockHeight, sigs] = await Promise.all([
    connection.getSlot('confirmed'),
    connection.getBlockHeight('confirmed'),
    connection.getSignaturesForAddress(pubkey, { limit }),
  ]);

  const txResponses = await Promise.all(
    sigs.map((s) =>
      connection
        .getParsedTransaction(s.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        })
        .catch(() => null)
    )
  );

  const records: OnChainAttestation[] = [];
  for (let i = 0; i < sigs.length; i++) {
    const sigInfo = sigs[i];
    const parsed = txResponses[i];
    let rawMemo = sigInfo.memo || '';

    if (!rawMemo && parsed?.transaction?.message?.instructions) {
      for (const ix of parsed.transaction.message.instructions) {
        if ('parsed' in ix && ix.program === 'spl-memo' && typeof ix.parsed === 'string') {
          rawMemo = ix.parsed;
          break;
        }
      }
    }

    // Strip "[N] " prefix added by Solana RPC signature memo summaries if present
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
      parsed?.transaction?.message?.accountKeys?.[0]?.pubkey?.toBase58() || address;

    records.push({
      signature: sigInfo.signature,
      slot: sigInfo.slot,
      blockTime: sigInfo.blockTime ?? null,
      signer,
      payload,
      rawMemo: cleaned || 'Memo data recorded on-chain',
      err: Boolean(sigInfo.err),
    });
  }

  return { slot, blockHeight, records, rpcUrl: SOLANA_RPC_URL };
}

